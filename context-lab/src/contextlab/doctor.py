# filepath: src/contextlab/doctor.py
from __future__ import annotations
"""
Diagnostics helpers for the Context Lab CLI.

Reports:
- Config (chat/embedding models, backend)
- Session rules presence (loaded from .ctx/session-rules.md or CTX_SESSION_RULES)
- Web index stats (data/web/index.jsonl)
- Markdown corpus size under data/raw/
- Vector store shape (embeddings.npy)
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np

from .config import Settings
from .llm import _load_session_rules

INDEX_DIRNAME = "index"
EMB_FILE = "embeddings.npy"


@dataclass
class Diagnostics:
    root_dir: Path
    store_path: Path
    chat_model: str
    embedding_backend: str
    embedding_model: str
    session_rules_present: bool
    web_index_rows: int
    md_files: int
    emb_exists: bool
    emb_shape: Optional[Tuple[int, int]]  # (N, D) if available

    def as_dict(self) -> Dict[str, object]:
        return {
            "root_dir": str(self.root_dir),
            "store_path": str(self.store_path),
            "chat_model": self.chat_model,
            "embedding_backend": self.embedding_backend,
            "embedding_model": self.embedding_model,
            "session_rules_present": self.session_rules_present,
            "web_index_rows": self.web_index_rows,
            "md_files": self.md_files,
            "emb_exists": self.emb_exists,
            "emb_shape": self.emb_shape,
        }


def _count_web_index(root: Path) -> int:
    idx = root / "data" / "web" / "index.jsonl"
    if not idx.exists():
        return 0
    try:
        with idx.open("r", encoding="utf-8") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def _count_md(root: Path) -> int:
    base = root / "data" / "raw"
    if not base.exists():
        return 0
    return sum(1 for p in base.rglob("*.md") if p.is_file())


def _embeddings_shape(store_path: Path) -> (bool, Optional[Tuple[int, int]]):
    emb = store_path / INDEX_DIRNAME / EMB_FILE
    if not emb.exists():
        return False, None
    try:
        arr = np.load(emb, mmap_mode="r")
        return True, (int(arr.shape[0]), int(arr.shape[1]))
    except Exception:
        return False, None


def get_diagnostics(settings: Settings) -> Diagnostics:
    root = Path(getattr(settings, "root_dir", Path.cwd()))
    store = root / settings.store_path
    rules = bool(_load_session_rules(settings))
    emb_exists, emb_shape = _embeddings_shape(store)
    emb_model = (
        settings.openai_embedding_model
        if (settings.embedding_backend or "").lower() == "openai"
        else settings.sbert_model
    )
    return Diagnostics(
        root_dir=root,
        store_path=store,
        chat_model=settings.chat_model,
        embedding_backend=settings.embedding_backend,
        embedding_model=emb_model,
        session_rules_present=rules,
        web_index_rows=_count_web_index(root),
        md_files=_count_md(root),
        emb_exists=emb_exists,
        emb_shape=emb_shape,
    )

