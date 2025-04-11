"""Main entry point for the AI Assistant API.

This module initializes the FastAPI application and includes all routes.
It also sets up middleware for authentication, CORS, and tenant identification.
"""

from fastapi import FastAPI, Depends, HTTPException, Request, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import time
from typing import Dict, Optional, List, Any
import os
import tempfile
import uuid
import logging

# Import services
from services.llm_client import LLMClient
from services.vector_store import VectorStore
from services.guided_task_engine import GuidedTaskEngine
from services.escalation import create_ticket, notify_support

# Import tenant middleware
from services.middleware import get_tenant_id

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Assistant API",
    description="API for the AI Assistant that provides contextual help and guided tasks",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API keys are now managed in the middleware module

# Models
class ApiError(BaseModel):
    timestamp: int
    url: str
    method: str
    status: Optional[int] = None
    message: str

class Context(BaseModel):
    currentPage: str
    userRole: Optional[str] = None
    permissions: Optional[List[str]] = None
    recentApiErrors: Optional[List[ApiError]] = None

class Step(BaseModel):
    id: str
    title: str
    description: str
    completed: bool = False

class ChatRequest(BaseModel):
    tenantId: str
    message: str
    context: Context
    sessionId: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    steps: Optional[List[Step]] = None
    sessionId: Optional[str] = None

class IngestResponse(BaseModel):
    success: bool
    document_id: str
    document_name: str
    chunk_count: int
    errors: Optional[List[str]] = None

# Services
llm_client = LLMClient()
vector_store = VectorStore()
guided_task_engine = GuidedTaskEngine()

# Add request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID and processing time to response headers."""
    request_id = f"{int(time.time() * 1000)}"
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Chat endpoint
@app.post("/chat/", response_model=ChatResponse, tags=["chat"])
async def chat(
    request: ChatRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> ChatResponse:
    """Process a chat message and return a response."""
    # Validate tenant ID from request matches authenticated tenant
    if request.tenantId != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant ID mismatch",
        )
    
    # Enrich context with vector search results
    enriched_context = await enrich_context(request.context, request.message, tenant_id)
    
    # Generate LLM response
    llm_response = await llm_client.generate_response(
        message=request.message,
        context=enriched_context,
        tenant_id=tenant_id,
    )
    
    # Check if response contains steps
    steps = None
    if llm_response.get("has_steps", False):
        # Parse steps from LLM response
        steps = guided_task_engine.parse_steps(llm_response.get("raw_response", ""))
        
        # Store steps in session if session ID provided
        if request.sessionId:
            guided_task_engine.store_steps(request.sessionId, steps)
    
    # Check if escalation is needed
    if llm_response.get("needs_escalation", False):
        # Create support ticket
        ticket_id = await create_ticket(
            tenant_id=tenant_id,
            details={
                "message": request.message,
                "context": enriched_context,
                "llm_response": llm_response.get("response", ""),
            },
        )
        
        # Notify support team
        await notify_support(
            tenant_id=tenant_id,
            message=f"New support ticket created: {ticket_id}",
        )
        
        # Add escalation info to response
        escalation_message = f"\n\nI've created a support ticket ({ticket_id}) for you. Our team will follow up soon."
        llm_response["response"] += escalation_message
    
    return ChatResponse(
        response=llm_response.get("response", ""),
        steps=steps,
        sessionId=request.sessionId or f"session_{int(time.time())}",
    )

async def enrich_context(context: Context, message: str, tenant_id: str) -> Dict[str, Any]:
    """Enrich context with vector search results and other information.
    
    Args:
        context: The original context.
        message: The user message.
        tenant_id: The tenant ID.
        
    Returns:
        The enriched context with vector search results.
    """
    # Convert context to dict
    context_dict = context.dict()
    
    try:
        # Add vector search results
        vector_results = await vector_store.search(
            query=message,
            tenant_id=tenant_id,
            limit=5,
        )
        context_dict["vectorResults"] = vector_results
        
        # Log the enrichment
        logger.info(f"Enriched context with {len(vector_results)} vector results for tenant {tenant_id}")
    except Exception as e:
        # Log error but continue without vector results
        logger.error(f"Error enriching context: {e}")
        context_dict["vectorResults"] = []
    
    # Add timestamp
    context_dict["timestamp"] = int(time.time())
    
    return context_dict

# Supported file types
SUPPORTED_FILE_TYPES = {
    ".md": "text/markdown",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".yaml": "application/x-yaml",
    ".yml": "application/x-yaml",
}

# Document ingestion endpoint
@app.post("/ingest-docs/", response_model=IngestResponse, tags=["ingest-docs"])
async def ingest_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),  # e.g., "api_docs", "help_guide", "faq"
    tenant_id: str = Depends(get_tenant_id),
) -> IngestResponse:
    """Ingest a document and store its embeddings in the vector database."""
    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in SUPPORTED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_ext}. Supported types: {', '.join(SUPPORTED_FILE_TYPES.keys())}",
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
        # Write uploaded file content to temporary file
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Process file and store embeddings
        document_id = str(uuid.uuid4())
        result = await vector_store.ingest_document(
            file_path=temp_file_path,
            document_id=document_id,
            document_type=document_type,
            tenant_id=tenant_id,
            metadata={
                "filename": file.filename,
                "content_type": file.content_type or SUPPORTED_FILE_TYPES[file_ext],
            },
        )
        
        return IngestResponse(
            success=True,
            document_id=document_id,
            document_name=file.filename,
            chunk_count=result.get("chunk_count", 0),
            errors=result.get("errors"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}",
        )
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

# Batch document ingestion endpoint
@app.post("/ingest-docs/batch", response_model=List[IngestResponse], tags=["ingest-docs"])
async def ingest_documents(
    files: List[UploadFile] = File(...),
    document_type: str = Form(...),
    tenant_id: str = Depends(get_tenant_id),
) -> List[IngestResponse]:
    """Ingest multiple documents and store their embeddings in the vector database."""
    responses = []
    
    for file in files:
        try:
            # Process each file individually
            response = await ingest_document(
                file=file,
                document_type=document_type,
                tenant_id=tenant_id,
            )
            responses.append(response)
        except HTTPException as e:
            # Add failed file with error
            responses.append(
                IngestResponse(
                    success=False,
                    document_id="",
                    document_name=file.filename,
                    chunk_count=0,
                    errors=[e.detail],
                )
            )
    
    return responses

# Delete document endpoint
@app.delete("/ingest-docs/{document_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["ingest-docs"])
async def delete_document(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id),
):
    """Delete a document and its embeddings from the vector database."""
    try:
        await vector_store.delete_document(
            document_id=document_id,
            tenant_id=tenant_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        )

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": time.time()}

# Metrics endpoint
@app.get("/metrics", tags=["metrics"])
async def metrics(tenant_id: str = Depends(get_tenant_id)):
    """Get service metrics."""
    # In a real implementation, this would query a metrics database
    return {
        "tenant_id": tenant_id,
        "total_requests": 0,
        "total_chat_messages": 0,
        "total_documents": 0,
        "average_response_time": 0,
    }

# Error handler for uncaught exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "type": type(exc).__name__,
        },
    )

@app.get("/", tags=["root"])
async def read_root():
    return {"message": "Welcome to the API"}  # basic welcome endpoint

if __name__ == "__main__":
    import uvicorn
    # Changed to run app directly to resolve run bugs
    uvicorn.run(app, host="0.0.0.0", port=8000)