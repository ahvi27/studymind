"""Hybrid retrieval: 0.5 * BM25 + 0.5 * cosine similarity."""

from dataclasses import dataclass

import numpy as np
from rank_bm25 import BM25Okapi
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.note import Note, NoteChunk
from app.services.embeddings import cosine_similarity, deserialize_embedding, embed_query

settings = get_settings()


@dataclass
class RetrievalResult:
    note_id: int
    note_title: str
    chunk_id: int
    chunk_text: str
    bm25_score: float
    cosine_score: float
    combined_score: float


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def _normalize_scores(scores: list[float]) -> list[float]:
    """Min-max normalize scores to [0, 1]."""
    if not scores:
        return []
    arr = np.array(scores, dtype=np.float32)
    min_val, max_val = arr.min(), arr.max()
    if max_val - min_val < 1e-9:
        return [1.0 if s > 0 else 0.0 for s in scores]
    return ((arr - min_val) / (max_val - min_val)).tolist()


def retrieve_relevant_chunks(
    db: Session,
    user_id: int,
    question: str,
    note_id: int | None = None,
    top_k: int | None = None,
) -> list[RetrievalResult]:
    """
    Retrieve top-k chunks using hybrid BM25 + cosine similarity scoring.
    score = 0.5 * BM25_norm + 0.5 * cosine_sim
    """
    top_k = top_k or settings.top_k_results

    query = db.query(NoteChunk).join(Note).filter(Note.user_id == user_id)
    if note_id is not None:
        query = query.filter(Note.id == note_id)

    chunks: list[NoteChunk] = query.all()
    if not chunks:
        return []

    # Build note title lookup
    note_titles: dict[int, str] = {}
    for chunk in chunks:
        if chunk.note_id not in note_titles:
            note_titles[chunk.note_id] = chunk.note.title

    corpus = [c.text for c in chunks]
    tokenized_corpus = [_tokenize(t) for t in corpus]
    bm25 = BM25Okapi(tokenized_corpus)
    bm25_raw = bm25.get_scores(_tokenize(question)).tolist()

    query_embedding = embed_query(question)
    cosine_raw: list[float] = []
    for chunk in chunks:
        if chunk.embedding:
            vec = deserialize_embedding(chunk.embedding)
            cosine_raw.append(cosine_similarity(query_embedding, vec))
        else:
            cosine_raw.append(0.0)

    bm25_norm = _normalize_scores(bm25_raw)
    cosine_norm = _normalize_scores(cosine_raw)

    results: list[RetrievalResult] = []
    for i, chunk in enumerate(chunks):
        combined = 0.5 * bm25_norm[i] + 0.5 * cosine_norm[i]
        results.append(
            RetrievalResult(
                note_id=chunk.note_id,
                note_title=note_titles[chunk.note_id],
                chunk_id=chunk.id,
                chunk_text=chunk.text,
                bm25_score=bm25_norm[i],
                cosine_score=cosine_norm[i],
                combined_score=combined,
            )
        )

    results.sort(key=lambda r: r.combined_score, reverse=True)
    return results[:top_k]


def build_answer_from_results(results: list[RetrievalResult], question: str) -> tuple[str, float]:
    """
    Build a retrieval-based answer from top chunks.
    Returns (answer_text, confidence_score).
    """
    if not results:
        return (
            "I couldn't find relevant information in your notes to answer this question. "
            "Try uploading more notes or rephrasing your question.",
            0.0,
        )

    top = results[0]
    confidence = round(top.combined_score, 4)

    # Synthesize answer from top matching chunks
    if len(results) == 1:
        answer = (
            f"Based on your notes ({top.note_title}), here's what I found:\n\n"
            f"{top.chunk_text}"
        )
    else:
        parts = [f"Based on your notes, here are the most relevant excerpts for: \"{question}\"\n"]
        for i, r in enumerate(results[:3], 1):
            parts.append(f"\n**Source {i}** — {r.note_title} (confidence: {r.combined_score:.0%})\n{r.chunk_text}")
        answer = "\n".join(parts)

    return answer, confidence
