"""LLM Client for the AI Assistant API.

This module provides a client for interacting with the local LLM via Ollama.
It handles prompt construction, response parsing, and error handling.
"""

import json
import httpx
from typing import Dict, Any, Optional, List
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMClient:
    """Client for interacting with the local LLM via Ollama."""
    
    def __init__(self, base_url: str = "http://localhost:11434", timeout: int = 30):
        """Initialize the LLM client.
        
        Args:
            base_url: The base URL of the Ollama API.
            timeout: The timeout for API requests in seconds.
        """
        self.base_url = base_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def generate_response(
        self,
        message: str,
        context: Dict[str, Any],
        tenant_id: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """Generate a response from the LLM.
        
        Args:
            message: The user message.
            context: The context information.
            tenant_id: The tenant ID.
            model: The model to use. If None, the default model for the tenant will be used.
            temperature: The temperature for sampling.
            max_tokens: The maximum number of tokens to generate.
            
        Returns:
            A dictionary containing the response and metadata.
        """
        try:
            # Get model for tenant (in a real implementation, this would be fetched from a database)
            model = model or self._get_model_for_tenant(tenant_id)
            
            # Construct prompt
            prompt = self._construct_prompt(message, context, tenant_id)
            
            # Call Ollama API
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": False,
                },
            )
            response.raise_for_status()
            
            # Parse response
            result = response.json()
            
            # Extract and parse the response
            raw_response = result.get("response", "")
            
            # Check if response contains JSON
            parsed_response = self._try_parse_json(raw_response)
            
            # Determine if response contains steps
            has_steps = False
            if isinstance(parsed_response, dict) and "steps" in parsed_response:
                has_steps = True
                response_text = parsed_response.get("response", "")
            else:
                response_text = raw_response
            
            # Determine if escalation is needed
            needs_escalation = "escalate" in raw_response.lower() or "support ticket" in raw_response.lower()
            
            return {
                "response": response_text,
                "raw_response": raw_response,
                "has_steps": has_steps,
                "needs_escalation": needs_escalation,
                "model": model,
                "usage": {
                    "prompt_tokens": result.get("prompt_tokens", 0),
                    "completion_tokens": result.get("completion_tokens", 0),
                    "total_tokens": result.get("prompt_tokens", 0) + result.get("completion_tokens", 0),
                },
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e}")
            return {
                "response": "I'm having trouble connecting to my knowledge base. Please try again later.",
                "error": str(e),
            }
        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            return {
                "response": "I'm having trouble processing your request. Please try again later.",
                "error": str(e),
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {
                "response": "I encountered an unexpected error. Please try again later.",
                "error": str(e),
            }
    
    def _get_model_for_tenant(self, tenant_id: str) -> str:
        """Get the model for a tenant.
        
        In a real implementation, this would be fetched from a database.
        
        Args:
            tenant_id: The tenant ID.
            
        Returns:
            The model name.
        """
        # Default to llama3 for all tenants in this MVP
        return "llama3"
    
    def _construct_prompt(self, message: str, context: Dict[str, Any], tenant_id: str) -> str:
        """Construct a prompt for the LLM.
        
        Args:
            message: The user message.
            context: The context information.
            tenant_id: The tenant ID.
            
        Returns:
            The constructed prompt.
        """
        # Extract context information
        current_page = context.get("currentPage", "")
        user_role = context.get("userRole", "")
        permissions = context.get("permissions", [])
        recent_api_errors = context.get("recentApiErrors", [])
        vector_results = context.get("vectorResults", [])
        
        # Format vector results
        vector_context = ""
        if vector_results:
            vector_context = "\n\nRelevant information from documentation:\n"
            for i, result in enumerate(vector_results, 1):
                vector_context += f"\n{i}. {result['content']}\n"
        
        # Format API errors
        api_errors_context = ""
        if recent_api_errors:
            api_errors_context = "\n\nRecent API errors:\n"
            for i, error in enumerate(recent_api_errors, 1):
                api_errors_context += f"\n{i}. {error['method']} {error['url']} - {error['status']}: {error['message']}\n"
        
        # Format permissions
        permissions_context = ""
        if permissions:
            permissions_context = f"\n\nUser permissions: {', '.join(permissions)}"
        
        # Construct system prompt
        system_prompt = f"""You are an AI Assistant for {tenant_id}. 
        You help users with their questions and guide them through tasks step-by-step when needed.
        
        Current context:
        - Page: {current_page}
        - User role: {user_role}{permissions_context}{api_errors_context}{vector_context}
        
        When providing step-by-step instructions, format your response as JSON with the following structure:
        {{"response": "Your conversational response here", "steps": [{{
            "id": "step1",
            "title": "Step 1 title",
            "description": "Detailed instructions for step 1",
            "completed": false
        }}, ...]}}
        
        If you don't need to provide steps, just respond conversationally.
        If you can't answer a question or help with a task, suggest escalating to support.
        """
        
        # Combine system prompt and user message
        return f"{system_prompt}\n\nUser: {message}\n\nAssistant:"
    
    def _try_parse_json(self, text: str) -> Any:
        """Try to parse JSON from text.
        
        Args:
            text: The text to parse.
            
        Returns:
            The parsed JSON if successful, None otherwise.
        """
        try:
            # Look for JSON-like structure
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx + 1]
                return json.loads(json_str)
            return None
        except json.JSONDecodeError:
            return None