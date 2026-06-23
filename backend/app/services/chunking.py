"""Split note text into overlapping chunks for retrieval."""

import re

from app.config import get_settings

settings = get_settings()


def split_into_chunks(text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
    """
    Split text into chunks of approximately `chunk_size` characters.
    Tries to break on sentence boundaries when possible.
    """
    chunk_size = chunk_size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap

    if not text.strip():
        return []

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text.strip())

    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        # Prefer breaking at sentence boundary within the last 20% of chunk
        if end < text_len:
            search_start = start + int(chunk_size * 0.8)
            boundary = -1
            for sep in [". ", "? ", "! ", "; ", ", "]:
                pos = text.rfind(sep, search_start, end)
                if pos > boundary:
                    boundary = pos + len(sep)
            if boundary > start:
                end = boundary

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_len:
            break

        start = max(end - overlap, start + 1)

    return chunks
