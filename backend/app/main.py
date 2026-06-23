"""StudyMind FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import get_settings
from app.database import Base, engine
from app.routers import auth, chat, notes

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables and upload directory on startup."""
    Base.metadata.create_all(bind=engine)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-powered study notes application with hybrid retrieval",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(chat.router)


@app.get("/", include_in_schema=False)
def root():
    """Redirect browser visits to interactive API docs."""
    return RedirectResponse(url="/docs")


@app.get("/health")
def health_check():
    """Health check endpoint for Docker and load balancers."""
    return {"status": "healthy", "app": settings.app_name}
