"""Seed database with test accounts and sample notes."""

import sys
from pathlib import Path

# Allow running as script from backend directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models.note import Note
from app.models.user import User
from app.services.auth import create_user, get_user_by_email
from app.services.note_indexer import index_note

settings = get_settings()
SAMPLE_DIR = Path(__file__).parent / "sample_data"

TEST_USERS = [
    {"email": "demo@studymind.app", "username": "demo", "password": "demo1234"},
    {"email": "student@studymind.app", "username": "student", "password": "student123"},
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        for user_data in TEST_USERS:
            if not get_user_by_email(db, user_data["email"]):
                create_user(db, user_data["email"], user_data["username"], user_data["password"])
                print(f"Created user: {user_data['email']} / {user_data['password']}")

        demo_user = get_user_by_email(db, "demo@studymind.app")
        if demo_user and SAMPLE_DIR.exists():
            for sample_file in SAMPLE_DIR.glob("*.txt"):
                existing = (
                    db.query(Note)
                    .filter(Note.user_id == demo_user.id, Note.filename == sample_file.name)
                    .first()
                )
                if existing:
                    print(f"Sample note already exists: {sample_file.name}")
                    continue

                note = Note(
                    user_id=demo_user.id,
                    title=sample_file.stem.replace("_", " ").title(),
                    filename=sample_file.name,
                    file_type="txt",
                    content_text="",
                )
                db.add(note)
                db.commit()
                db.refresh(note)

                dest = Path(settings.upload_dir) / f"sample_{sample_file.name}"
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(sample_file.read_text(encoding="utf-8"))
                index_note(db, note, dest)
                print(f"Indexed sample note: {sample_file.name}")

        print("\nSeed complete!")
        print("Test accounts:")
        for u in TEST_USERS:
            print(f"  - {u['email']} / {u['password']}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
