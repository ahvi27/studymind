"""Extract plain text from uploaded .txt and .pdf files."""

from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader


def extract_text_from_file(file_path: Path, file_type: str) -> str:
    """Read and return text content based on file extension."""
    try:
        if file_type == "txt":
            return file_path.read_text(encoding="utf-8", errors="replace").strip()
        if file_type == "pdf":
            reader = PdfReader(str(file_path))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages).strip()
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not extract text from PDF. The file may be scanned or empty.",
                )
            return text
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported file type: {file_type}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from file: {exc}",
        ) from exc
