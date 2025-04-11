# AI Assistant Vector Data

This directory contains scripts and utilities for ingesting and managing vector data for the AI Assistant.

## Structure

- `ingest_docs.py`: Script to embed and index documents
- `docs/`: Directory for storing raw documents to be ingested
- `embeddings/`: Directory for storing embedded data

## Usage

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run ingestion script
python ingest_docs.py
```

## Supported Document Types

- Markdown (.md)
- PDF (.pdf)
- OpenAPI specifications (.json, .yaml)
- Plain text (.txt)

## Embedding Models

The ingestion script uses one of the following embedding models:

- `Instructor-XL`
- `all-MiniLM-L6-v2`

The embedded data is stored in a local ChromaDB instance.