# AI Assistant API

This directory contains the FastAPI middleware server for the AI Assistant.

## Structure

- `main.py`: Entry point for the FastAPI application
- `routes/`: API route handlers
- `services/`: Business logic and service classes
- `llm/`: LLM client wrappers
- `vector/`: Vector database query logic
- `tenants/`: Tenant-specific configuration handling

## Development

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload

# Run tests
pytest
```

## API Endpoints

- `/chat`: Process chat messages with context enrichment
- `/ingest-docs`: Upload and process documents for vector storage
- `/health`: Service health check
- `/metrics`: Service metrics