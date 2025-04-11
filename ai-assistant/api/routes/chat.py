"""Chat route handler for the AI Assistant API.

This module handles the chat endpoint that processes user messages,
enriches context, and returns AI responses with optional guided steps.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import time

# Import services
from ..services.llm_client import LLMClient
from ..services.vector_store import VectorStore
from ..services.guided_task_engine import GuidedTaskEngine
from ..services.escalation import create_ticket, notify_support

# Import tenant middleware
from ..services.middleware import get_tenant_id

# Create router
router = APIRouter()

# Stub router
@router.get("/")
async def chat_root():
    return {"message": "Chat endpoint stub"}

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

# Services
llm_client = LLMClient()
vector_store = VectorStore()
guided_task_engine = GuidedTaskEngine()

# Chat endpoint
@router.post("/", response_model=ChatResponse)
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