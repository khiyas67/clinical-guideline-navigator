import logging
from typing import List, Optional, Any
from app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingModelUnavailableError(RuntimeError):
    """Raised when the local embedding model is blocked or cannot be loaded."""
    pass

_model: Optional[Any] = None
_model_error: Optional[str] = None

def get_embedding_model() -> Any:
    """
    Lazy initialization singleton for the local embedding model.
    """
    global _model, _model_error
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading local embedding model: {settings.EMBEDDING_MODEL}...")
        try:
            _model = SentenceTransformer(settings.EMBEDDING_MODEL, local_files_only=True)
        except Exception:
            _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        _model_error = None
        logger.info("Local embedding model loaded successfully.")
        return _model
    except Exception as e:
        _model_error = f"Local embedding model unavailable: {e}"
        logger.warning(_model_error)
        raise EmbeddingModelUnavailableError(_model_error) from e

def embed_query(query: str) -> List[float]:
    """
    Generate normalized dense embedding for a search query.
    Fails safely if the embedding model is blocked; never returns fake zero vectors.
    """
    model = get_embedding_model()
    if "bge" in settings.EMBEDDING_MODEL.lower():
        text = f"Represent this sentence for searching relevant clinical passages: {query}"
    else:
        text = query
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def embed_documents(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """
    Generate normalized 384-dimensional embeddings for a batch of document chunks.
    Fails safely if the embedding model is blocked; never returns fabricated embeddings.
    """
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = model.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False)
    return [e.tolist() for e in embeddings]
