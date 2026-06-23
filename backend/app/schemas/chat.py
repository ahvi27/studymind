"""Chat and Q&A schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    note_id: Optional[int] = None


class SourceChunk(BaseModel):
    note_id: int
    note_title: str
    chunk_text: str
    score: float


class ChatAskResponse(BaseModel):
    question: str
    answer: str
    confidence: float
    sources: list[SourceChunk]


class ChatHistoryItem(BaseModel):
    id: int
    question: str
    answer: str
    confidence: float
    note_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
