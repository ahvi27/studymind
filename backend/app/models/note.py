"""Note and chunk models for uploaded study materials."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    owner: Mapped["User"] = relationship("User", back_populates="notes")
    chunks: Mapped[list["NoteChunk"]] = relationship(
        "NoteChunk", back_populates="note", cascade="all, delete-orphan", order_by="NoteChunk.chunk_index"
    )


class NoteChunk(Base):
    """Text chunk with locally stored embedding vector (JSON)."""

    __tablename__ = "note_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Embedding stored as comma-separated floats for SQLite simplicity
    embedding: Mapped[str] = mapped_column(Text, nullable=False, default="")

    note: Mapped["Note"] = relationship("Note", back_populates="chunks")
