"""Local embedding generation and storage using sentence-transformers."""

import json
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import get_settings

settings = get_settings()


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Load the sentence-transformer model once and cache it."""
    return SentenceTransformer(settings.embedding_model)


def embed_texts(texts: list[str]) -> list[np.ndarray]:
    """Generate embedding vectors for a list of text chunks."""
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return [np.asarray(vec, dtype=np.float32) for vec in embeddings]


def embed_query(query: str) -> np.ndarray:
    """Generate a single embedding vector for a search query."""
    model = get_embedding_model()
    return np.asarray(model.encode([query], convert_to_numpy=True)[0], dtype=np.float32)


def serialize_embedding(vector: np.ndarray) -> str:
    """Store embedding as JSON string in SQLite."""
    return json.dumps(vector.tolist())


def deserialize_embedding(data: str) -> np.ndarray:
    """Load embedding from JSON string."""
    return np.asarray(json.loads(data), dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
