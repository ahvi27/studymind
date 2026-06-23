"""Note indexing: chunking and embedding pipeline."""

from pathlib import Path

from sqlalchemy.orm import Session

from app.models.note import Note, NoteChunk
from app.services.chunking import split_into_chunks
from app.services.embeddings import embed_texts, serialize_embedding
from app.services.text_extraction import extract_text_from_file


def index_note(db: Session, note: Note, file_path: Path) -> None:
    """
    Extract text, split into chunks, compute embeddings, and persist.
    Called after a note file is saved to disk.
    """
    text = extract_text_from_file(file_path, note.file_type)
    note.content_text = text

    # Remove existing chunks if re-indexing
    db.query(NoteChunk).filter(NoteChunk.note_id == note.id).delete()

    chunks = split_into_chunks(text)
    if not chunks:
        db.commit()
        return

    embeddings = embed_texts(chunks)
    for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(
            NoteChunk(
                note_id=note.id,
                chunk_index=idx,
                text=chunk_text,
                embedding=serialize_embedding(embedding),
            )
        )

    db.commit()
    db.refresh(note)
