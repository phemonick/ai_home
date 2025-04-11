"""Main entry point for the AI Assistant API.

This module initializes the FastAPI application and includes all routes.
It also sets up middleware for authentication, CORS, and tenant identification.
"""

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import time
from typing import Dict, Optional

# Import routes
from routes.chat import router as chat_router
from routes.ingest_docs import router as ingest_docs_router

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

# Import middleware for API key validation and tenant identification
from services.middleware import get_tenant_id, API_KEYS

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

# Include routers
app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(ingest_docs_router, prefix="/ingest-docs", tags=["ingest-docs"])

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

@app.get("/")
async def read_root():
    return {"message": "Welcome to the API"}  # basic welcome endpoint

class PredictionInput(BaseModel):
    data: str  # adjust fields as per idea.md spec

@app.post("/predict")
async def predict(input: PredictionInput):
    # placeholder for prediction logic
    result = {"prediction": f"Processed input: {input.data}"}
    return result

if __name__ == "__main__":
    import uvicorn
    # Changed to run app directly to resolve run bugs
    uvicorn.run(app, host="0.0.0.0", port=8000)