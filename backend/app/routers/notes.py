"""Notes routes: upload, list, delete, search."""

import re
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteDeleteResponse, NoteListResponse, NoteResponse, NoteUploadResponse
from app.services.note_indexer import index_note

router = APIRouter(prefix="/notes", tags=["notes"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".txt", ".pdf"}


def _content_preview(text: str, max_len: int = 200) -> str:
    preview = text[:max_len].strip()
    if len(text) > max_len:
        preview += "..."
    return preview


def _note_to_response(note: Note) -> NoteResponse:
    return NoteResponse(
        id=note.id,
        title=note.title,
        filename=note.filename,
        file_type=note.file_type,
        content_preview=_content_preview(note.content_text),
        created_at=note.created_at,
    )


@router.post("/upload", response_model=NoteUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_note(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
):
    """Upload a .txt or .pdf note, extract text, and index for retrieval."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .txt and .pdf files are supported",
        )

    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB",
        )
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")

    file_type = ext.lstrip(".")
    title = Path(file.filename).stem
    safe_name = f"{uuid.uuid4().hex}_{re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)}"

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / safe_name
    file_path.write_bytes(content)

    note = Note(
        user_id=current_user.id,
        title=title,
        filename=file.filename,
        file_type=file_type,
        content_text="",
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    try:
        index_note(db, note, file_path)
    except HTTPException:
        db.delete(note)
        db.commit()
        file_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        db.delete(note)
        db.commit()
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process note: {exc}",
        ) from exc

    return NoteUploadResponse(message="Note uploaded and indexed successfully", note=_note_to_response(note))


@router.get("/list", response_model=NoteListResponse)
def list_notes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = Query(None, max_length=200),
):
    """List all notes for the current user, optionally filtered by search query."""
    query = db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.created_at.desc())

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Note.title.ilike(pattern)) | (Note.content_text.ilike(pattern)) | (Note.filename.ilike(pattern))
        )

    notes = query.all()
    return NoteListResponse(notes=[_note_to_response(n) for n in notes], total=len(notes))


@router.delete("/delete/{note_id}", response_model=NoteDeleteResponse)
def delete_note(
    note_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Delete a note and its associated chunks."""
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    # Remove uploaded file if it exists
    upload_dir = Path(settings.upload_dir)
    for file_path in upload_dir.glob(f"*_{note.filename}"):
        file_path.unlink(missing_ok=True)

    db.delete(note)
    db.commit()
    return NoteDeleteResponse(message="Note deleted successfully", note_id=note_id)
