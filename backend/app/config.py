"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings for the StudyMind API."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "StudyMind"
    debug: bool = False
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 1440
    database_url: str = "sqlite:///./studymind.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 500
    chunk_overlap: int = 50
    top_k_results: int = 5
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
