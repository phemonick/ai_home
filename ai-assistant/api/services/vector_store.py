"""Vector Store for the AI Assistant API.

This module provides functionality to store and retrieve document embeddings
from a vector database for semantic search capabilities.
"""

import os
import json
import uuid
from typing import Dict, List, Any, Optional
import logging
import numpy as np
from tenacity import retry, stop_after_attempt, wait_exponential

# For document processing
import PyPDF2
import markdown
from bs4 import BeautifulSoup

# For embeddings
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorStore:
    """Vector store for document embeddings and retrieval."""
    
    def __init__(self, 
                 embedding_model: str = "llama3",
                 vector_db_path: str = "./vector-data/embeddings",
                 chunk_size: int = 1000,
                 chunk_overlap: int = 200):
        """Initialize the vector store.
        
        Args:
            embedding_model: The model to use for embeddings.
            vector_db_path: The path to store vector embeddings.
            chunk_size: The size of text chunks for embedding.
            chunk_overlap: The overlap between chunks.
        """
        self.embedding_model = embedding_model
        self.vector_db_path = vector_db_path
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.http_client = httpx.AsyncClient(timeout=60.0)
        
        # Create vector DB directory if it doesn't exist
        os.makedirs(vector_db_path, exist_ok=True)
        os.makedirs(os.path.join(vector_db_path, "metadata"), exist_ok=True)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def ingest_document(self, 
                             file_path: str, 
                             document_id: str,
                             document_type: str,
                             tenant_id: str,
                             metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process a document and store its embeddings.
        
        Args:
            file_path: Path to the document file.
            document_id: Unique ID for the document.
            document_type: Type of document (e.g., "api_docs", "help_guide").
            tenant_id: The tenant ID.
            metadata: Additional metadata for the document.
            
        Returns:
            A dictionary with processing results.
        """
        try:
            # Extract text from document
            text = self._extract_text(file_path)
            
            # Split text into chunks
            chunks = self._split_text(text)
            
            # Generate embeddings for chunks
            chunk_embeddings = []
            chunk_texts = []
            errors = []
            
            for i, chunk in enumerate(chunks):
                try:
                    # Generate embedding
                    embedding = await self._generate_embedding(chunk)
                    
                    # Store chunk and embedding
                    chunk_id = f"{document_id}_{i}"
                    self._store_chunk(chunk_id, chunk, embedding, document_id, tenant_id, metadata, document_type)
                    
                    chunk_embeddings.append(embedding)
                    chunk_texts.append(chunk)
                except Exception as e:
                    logger.error(f"Error processing chunk {i}: {e}")
                    errors.append(f"Chunk {i}: {str(e)}")
            
            # Store document metadata
            self._store_document_metadata(document_id, tenant_id, document_type, metadata, len(chunks))
            
            return {
                "success": True,
                "document_id": document_id,
                "chunk_count": len(chunks),
                "errors": errors if errors else None
            }
        except Exception as e:
            logger.error(f"Error ingesting document: {e}")
            raise
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def search(self, 
                    query: str, 
                    tenant_id: str, 
                    limit: int = 5,
                    document_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for relevant document chunks based on a query.
        
        Args:
            query: The search query.
            tenant_id: The tenant ID.
            limit: Maximum number of results to return.
            document_type: Optional filter for document type.
            
        Returns:
            A list of relevant document chunks with metadata.
        """
        try:
            # Generate embedding for query
            query_embedding = await self._generate_embedding(query)
            
            # Get all chunks for tenant
            chunks = self._get_tenant_chunks(tenant_id, document_type)
            
            if not chunks:
                return []
            
            # Calculate similarity scores
            results = []
            for chunk in chunks:
                # Calculate cosine similarity
                similarity = self._cosine_similarity(query_embedding, chunk["embedding"])
                
                results.append({
                    "chunk_id": chunk["chunk_id"],
                    "document_id": chunk["document_id"],
                    "content": chunk["text"],
                    "similarity": similarity,
                    "metadata": chunk["metadata"]
                })
            
            # Sort by similarity (descending) and limit results
            results.sort(key=lambda x: x["similarity"], reverse=True)
            return results[:limit]
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []
    
    def _extract_text(self, file_path: str) -> str:
        """Extract text from a document file.
        
        Args:
            file_path: Path to the document file.
            
        Returns:
            Extracted text content.
        """
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == ".pdf":
            # Extract text from PDF
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
        elif file_ext == ".md":
            # Convert Markdown to HTML, then extract text
            with open(file_path, "r", encoding="utf-8") as f:
                md_text = f.read()
                html = markdown.markdown(md_text)
                soup = BeautifulSoup(html, "html.parser")
                return soup.get_text()
        elif file_ext in [".txt", ".json", ".yaml", ".yml"]:
            # Read text file directly
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
    
    def _split_text(self, text: str) -> List[str]:
        """Split text into chunks for embedding.
        
        Args:
            text: The text to split.
            
        Returns:
            A list of text chunks.
        """
        # Simple splitting by character count
        chunks = []
        start = 0
        
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            
            # Try to find a natural break point (newline or period)
            if end < len(text):
                # Look for newline
                newline_pos = text.rfind("\n", start, end)
                period_pos = text.rfind(".", start, end)
                
                if newline_pos > start + self.chunk_size // 2:
                    end = newline_pos + 1
                elif period_pos > start + self.chunk_size // 2:
                    end = period_pos + 1
            
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
        
        return chunks
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate an embedding for a text chunk.
        
        In a production environment, this would call a proper embedding API.
        For this MVP, we'll use a simple mock implementation.
        
        Args:
            text: The text to embed.
            
        Returns:
            A vector embedding.
        """
        # For MVP: Generate a simple mock embedding based on text hash
        # In production, this would call an embedding API like OpenAI's
        
        # Simple deterministic embedding based on text hash
        text_hash = hash(text) % 10000
        np.random.seed(text_hash)
        
        # Generate a 384-dimensional embedding (common size)
        embedding = np.random.normal(0, 1, 384).tolist()
        
        # Normalize the embedding
        norm = sum(x**2 for x in embedding) ** 0.5
        embedding = [x / norm for x in embedding]
        
        return embedding
    
    def _store_chunk(self, 
                     chunk_id: str, 
                     text: str, 
                     embedding: List[float],
                     document_id: str,
                     tenant_id: str,
                     metadata: Dict[str, Any],
                     document_type: str) -> None:
        """Store a chunk and its embedding.
        
        Args:
            chunk_id: Unique ID for the chunk.
            text: The chunk text.
            embedding: The chunk embedding.
            document_id: The document ID.
            tenant_id: The tenant ID.
            metadata: Additional metadata.
            document_type: Type of document.
        """
        # Create tenant directory if it doesn't exist
        tenant_dir = os.path.join(self.vector_db_path, tenant_id)
        os.makedirs(tenant_dir, exist_ok=True)
        
        # Store chunk data
        chunk_data = {
            "chunk_id": chunk_id,
            "text": text,
            "embedding": embedding,
            "document_id": document_id,
            "tenant_id": tenant_id,
            "document_type": document_type,
            "metadata": metadata
        }
        
        # Write to file
        chunk_file = os.path.join(tenant_dir, f"{chunk_id}.json")
        with open(chunk_file, "w", encoding="utf-8") as f:
            json.dump(chunk_data, f)
    
    def _store_document_metadata(self, 
                               document_id: str,
                               tenant_id: str,
                               document_type: str,
                               metadata: Dict[str, Any],
                               chunk_count: int) -> None:
        """Store document metadata.
        
        Args:
            document_id: The document ID.
            tenant_id: The tenant ID.
            document_type: Type of document.
            metadata: Additional metadata.
            chunk_count: Number of chunks in the document.
        """
        # Create metadata directory if it doesn't exist
        metadata_dir = os.path.join(self.vector_db_path, "metadata", tenant_id)
        os.makedirs(metadata_dir, exist_ok=True)
        
        # Store metadata
        doc_metadata = {
            "document_id": document_id,
            "tenant_id": tenant_id,
            "document_type": document_type,
            "metadata": metadata,
            "chunk_count": chunk_count,
            "created_at": int(os.path.getctime(metadata_dir)) if os.path.exists(metadata_dir) else 0
        }
        
        # Write to file
        metadata_file = os.path.join(metadata_dir, f"{document_id}.json")
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(doc_metadata, f)
    
    def _get_tenant_chunks(self, 
                          tenant_id: str, 
                          document_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all chunks for a tenant.
        
        Args:
            tenant_id: The tenant ID.
            document_type: Optional filter for document type.
            
        Returns:
            A list of chunks with embeddings.
        """
        tenant_dir = os.path.join(self.vector_db_path, tenant_id)
        
        if not os.path.exists(tenant_dir):
            return []
        
        chunks = []
        for filename in os.listdir(tenant_dir):
            if filename.endswith(".json"):
                file_path = os.path.join(tenant_dir, filename)
                
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        chunk_data = json.load(f)
                    
                    # Filter by document type if specified
                    if document_type and chunk_data.get("document_type") != document_type:
                        continue
                    
                    chunks.append(chunk_data)
                except Exception as e:
                    logger.error(f"Error loading chunk {filename}: {e}")
        
        return chunks
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors.
        
        Args:
            vec1: First vector.
            vec2: Second vector.
            
        Returns:
            Cosine similarity score.
        """
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = sum(a * a for a in vec1) ** 0.5
        norm_b = sum(b * b for b in vec2) ** 0.5
        
        if norm_a == 0 or norm_b == 0:
            return 0
        
        return dot_product / (norm_a * norm_b)