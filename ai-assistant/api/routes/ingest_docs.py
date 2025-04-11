"""Document ingestion route handler for the AI Assistant API.

This module handles the document ingestion endpoint that processes uploaded files,
extracts content, and stores embeddings in the vector database.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
import uuid

# Import services
from services.vector_store import VectorStore

# Import tenant middleware
from services.middleware import get_tenant_id

# Create router
router = APIRouter()

# Stub router to satisfy the import from main.py
@router.get("/")
async def ingest_docs_root():
    return {"message": "Ingest docs endpoint stub"}

# Models
class IngestResponse(BaseModel):
    success: bool
    document_id: str
    document_name: str
    chunk_count: int
    errors: Optional[List[str]] = None

# Services
vector_store = VectorStore()

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
@router.post("/", response_model=IngestResponse)
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
@router.post("/batch", response_model=List[IngestResponse])
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
@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
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