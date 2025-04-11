"""Middleware functions for the AI Assistant API.

This module provides middleware functions for authentication and tenant identification.
"""

from fastapi import Request, HTTPException, status
from typing import Dict

# Simple in-memory API key store (replace with database in production)
API_KEYS: Dict[str, str] = {
    "demo-key": "demo-tenant",  # API key: tenant ID
}

async def get_tenant_id(request: Request) -> str:
    """Validate API key and return tenant ID."""
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is missing",
        )
    
    tenant_id = API_KEYS.get(api_key)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    
    return tenant_id