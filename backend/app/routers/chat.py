"""Chat routes: ask questions about notes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat_history import ChatHistory
from app.models.note import Note
from app.models.user import User
from app.schemas.chat import ChatAskRequest, ChatAskResponse, ChatHistoryItem, SourceChunk
from app.services.retrieval import build_answer_from_results, retrieve_relevant_chunks

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/ask", response_model=ChatAskResponse)
def ask_question(
    payload: ChatAskRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Ask a question about uploaded notes.
    Uses hybrid BM25 + cosine similarity retrieval and returns top matches with confidence.
    """
    if payload.note_id is not None:
        note = (
            db.query(Note)
            .filter(Note.id == payload.note_id, Note.user_id == current_user.id)
            .first()
        )
        if not note:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    results = retrieve_relevant_chunks(
        db=db,
        user_id=current_user.id,
        question=payload.question,
        note_id=payload.note_id,
    )

    answer, confidence = build_answer_from_results(results, payload.question)

    sources = [
        SourceChunk(
            note_id=r.note_id,
            note_title=r.note_title,
            chunk_text=r.chunk_text,
            score=round(r.combined_score, 4),
        )
        for r in results
    ]

    # Persist chat history
    history = ChatHistory(
        user_id=current_user.id,
        note_id=payload.note_id,
        question=payload.question,
        answer=answer,
        confidence=confidence,
    )
    db.add(history)
    db.commit()

    return ChatAskResponse(
        question=payload.question,
        answer=answer,
        confidence=confidence,
        sources=sources,
    )


@router.get("/history", response_model=list[ChatHistoryItem])
def get_chat_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = 50,
):
    """Return recent chat history for the current user."""
    items = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.desc())
        .limit(min(limit, 100))
        .all()
    )
    return items
