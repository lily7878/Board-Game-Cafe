"""Settings read from environment variables (or a local, git-ignored .env file)."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Shared secret with Core; every /internal call must send it in X-Internal-Token.
    internal_token: str = Field(alias="BGC_AI_INTERNAL_TOKEN", min_length=16)

    # Any OpenAI-compatible server. Default: Ollama running locally (free, no API key).
    llm_base_url: str = Field(default="http://127.0.0.1:11434/v1", alias="LLM_BASE_URL")
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_model: str = Field(default="qwen2.5:7b", alias="LLM_MODEL")
    embed_model: str = Field(default="bge-m3", alias="EMBED_MODEL")
    llm_timeout_seconds: float = Field(default=30.0, alias="LLM_TIMEOUT_SECONDS")

    # SQLite index of the rule manuals (chunks + embeddings); kept outside the repository.
    data_dir: Path = Field(default=Path.home() / ".bgc-local" / "ai-data", alias="AI_DATA_DIR")


@lru_cache
def get_settings() -> Settings:
    return Settings()
