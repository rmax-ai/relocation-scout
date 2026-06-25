from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/relocation_scout.db"
    agent_runtime: str = "mock"
    host: str = "0.0.0.0"
    port: int = 8000
    max_concurrent_enrichments: int = 4
    log_level: str = "INFO"
    google_api_key: str | None = None

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
