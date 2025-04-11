"""Escalation Service for the AI Assistant API.

This module provides functionality to create support tickets and notify
support staff when the AI Assistant needs to escalate an issue.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory ticket store (replace with database in production)
TICKET_STORE: Dict[str, Dict[str, Any]] = {}

# Directory for storing tickets as files (for persistence in MVP)
TICKET_DIR = "./data/tickets"
os.makedirs(TICKET_DIR, exist_ok=True)

async def create_ticket(tenant_id: str, details: Dict[str, Any]) -> str:
    """Create a support ticket.
    
    Args:
        tenant_id: The tenant ID.
        details: Details about the issue.
        
    Returns:
        The ticket ID.
    """
    # Generate ticket ID
    ticket_id = str(uuid.uuid4())
    
    # Create ticket
    ticket = {
        "ticket_id": ticket_id,
        "tenant_id": tenant_id,
        "status": "open",
        "created_at": datetime.now().isoformat(),
        "details": details
    }
    
    # Store in memory
    TICKET_STORE[ticket_id] = ticket
    
    # Store as file for persistence
    ticket_file = os.path.join(TICKET_DIR, f"{ticket_id}.json")
    with open(ticket_file, "w", encoding="utf-8") as f:
        json.dump(ticket, f, default=str)
    
    # Log ticket creation
    logger.info(f"Created support ticket {ticket_id} for tenant {tenant_id}")
    
    # In a real implementation, this would send notifications
    await notify_support(ticket)
    
    return ticket_id

async def notify_support(ticket: Dict[str, Any]) -> None:
    """Notify support staff about a new ticket.
    
    In a real implementation, this would send emails, Slack messages, etc.
    
    Args:
        ticket: The ticket information.
    """
    # Log notification (in a real implementation, this would send actual notifications)
    logger.info(f"Support notification for ticket {ticket['ticket_id']}")
    
    # In a real implementation, this would:
    # 1. Send email to support staff
    # 2. Create a Slack/Teams notification
    # 3. Add to support dashboard
    # 4. Trigger on-call alerts if urgent
    
    # For MVP, we just log the notification
    pass

async def get_ticket(ticket_id: str) -> Optional[Dict[str, Any]]:
    """Get a ticket by ID.
    
    Args:
        ticket_id: The ticket ID.
        
    Returns:
        The ticket information, or None if not found.
    """
    # Try to get from memory first
    ticket = TICKET_STORE.get(ticket_id)
    
    if ticket:
        return ticket
    
    # Try to load from file
    ticket_file = os.path.join(TICKET_DIR, f"{ticket_id}.json")
    if os.path.exists(ticket_file):
        try:
            with open(ticket_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading ticket {ticket_id}: {e}")
    
    return None

async def update_ticket_status(ticket_id: str, status: str) -> bool:
    """Update a ticket's status.
    
    Args:
        ticket_id: The ticket ID.
        status: The new status.
        
    Returns:
        True if successful, False otherwise.
    """
    ticket = await get_ticket(ticket_id)
    
    if not ticket:
        return False
    
    # Update status
    ticket["status"] = status
    ticket["updated_at"] = datetime.now().isoformat()
    
    # Update in memory
    TICKET_STORE[ticket_id] = ticket
    
    # Update file
    ticket_file = os.path.join(TICKET_DIR, f"{ticket_id}.json")
    with open(ticket_file, "w", encoding="utf-8") as f:
        json.dump(ticket, f, default=str)
    
    # Log update
    logger.info(f"Updated ticket {ticket_id} status to {status}")
    
    return True

async def get_tenant_tickets(tenant_id: str) -> Dict[str, Dict[str, Any]]:
    """Get all tickets for a tenant.
    
    Args:
        tenant_id: The tenant ID.
        
    Returns:
        A dictionary of tickets keyed by ticket ID.
    """
    tenant_tickets = {}
    
    # Check memory store
    for ticket_id, ticket in TICKET_STORE.items():
        if ticket["tenant_id"] == tenant_id:
            tenant_tickets[ticket_id] = ticket
    
    # Check file store
    if os.path.exists(TICKET_DIR):
        for filename in os.listdir(TICKET_DIR):
            if filename.endswith(".json"):
                try:
                    with open(os.path.join(TICKET_DIR, filename), "r", encoding="utf-8") as f:
                        ticket = json.load(f)
                    
                    if ticket["tenant_id"] == tenant_id and ticket["ticket_id"] not in tenant_tickets:
                        tenant_tickets[ticket["ticket_id"]] = ticket
                except Exception as e:
                    logger.error(f"Error loading ticket file {filename}: {e}")
    
    return tenant_tickets