"""Note-related schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class NoteResponse(BaseModel):
    id: int
    title: str
    filename: str
    file_type: str
    content_preview: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]
    total: int


class NoteDeleteResponse(BaseModel):
    message: str
    note_id: int


class NoteUploadResponse(BaseModel):
    message: str
    note: NoteResponse


class NoteSearchQuery(BaseModel):
    q: str = Field(min_length=1, max_length=200)
