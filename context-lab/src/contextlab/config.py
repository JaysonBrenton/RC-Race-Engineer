from __future__ import annotations
import os
from pathlib import Path
from typing import Optional, Union
import yaml
from pydantic import BaseModel, Field
from dotenv import load_dotenv

class Settings(BaseModel):
    project_name: str = Field(default="context-lab")
    store_path: str = Field(default="data/chroma")
    collection_name: str = Field(default="contextlab")

    embedding_backend: str = Field(default="sentence-transformers")  # 'openai'|'sentence-transformers'
    sbert_model: str = Field(default="all-MiniLM-L6-v2")
    openai_embedding_model: str = Field(default="text-embedding-3-small")

    chat_model: str = Field(default="gpt-4o-mini")
    max_context_tokens: int = Field(default=6000)
    response_reserve_tokens: int = Field(default=1000)
    retrieval_top_k: int = Field(default=6)
    chunk_tokens: int = Field(default=400)
    chunk_overlap: int = Field(default=40)
    memory_cap_tokens: int = Field(default=1500)

    root_dir: Path = Field(default_factory=lambda: Path.cwd())

    class Config:
        frozen = True

def load_settings(config_path: Union[os.PathLike, str] = "ctx.yaml") -> Settings:
    """Centralized config from YAML + .env (why: single source of truth)."""
    load_dotenv(override=False)
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    data = yaml.safe_load(path.read_text()) or {}
    settings = Settings(**data)
    return settings
