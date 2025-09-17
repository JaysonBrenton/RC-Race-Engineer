# filepath: src/contextlab/store_numpy.py
from __future__ import annotations
"""
NumPy-based vector store (no SQLite/Chroma dependency).

- Uses absolute imports so it runs clean under `python -m contextlab.cli ...`.
- Py3.9-safe nested `with` statements for appending text files.
"""

import hashlib
import json
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

from contextlab.config import Settings
from contextlab.tokenizer import chunk_by_tokens
from contextlab.embeddings import Embeddings

INDEX_DIRNAME = "index"  # lives under settings.store_path
EMB_FILE = "embeddings.npy"
DOCS_FILE = "docs.jsonl"
METAS_FILE = "metas.jsonl"
IDS_FILE = "ids.txt"


def _hash(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:16]


def _collect_files(root: Path) -> List[Path]:
    return [p for p in root.rglob("*") if p.suffix.lower() in {".md", ".txt"} and p.is_file()]


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _normalize_rows(x: np.ndarray) -> np.ndarray:
    x = x.astype(np.float32, copy=False)
    n = np.linalg.norm(x, axis=1, keepdims=True)
    n[n == 0] = 1.0
    return x / n


class VectorStore:
    """SQLite-free vector store using NumPy files.

    Data layout under `{store_path}/index/`:
      - embeddings.npy: (N, D) float32, L2-normalized
      - docs.jsonl:     N lines, raw chunk text
      - metas.jsonl:    N lines, metadata dict per line
      - ids.txt:        N lines, stable string IDs
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        base = Path(settings.store_path)
        self.index_dir = base / INDEX_DIRNAME
        _ensure_dir(self.index_dir)
        self.embedder = Embeddings(settings)

    def rebuild(self) -> None:
        if self.index_dir.exists():
            for f in (
                self.index_dir / EMB_FILE,
                self.index_dir / DOCS_FILE,
                self.index_dir / METAS_FILE,
                self.index_dir / IDS_FILE,
            ):
                try:
                    f.unlink()
                except FileNotFoundError:
                    pass
        _ensure_dir(self.index_dir)

    def ingest_dir(self, directory: Path) -> int:
        directory = Path(directory)
        files = _collect_files(directory)
        if not files:
            return 0

        new_docs: List[str] = []
        new_metas: List[Dict] = []
        new_ids: List[str] = []

        for f in files:
            text = f.read_text(encoding="utf-8", errors="ignore")
            chunks = chunk_by_tokens(
                text, self.settings.chunk_tokens, self.settings.chunk_overlap
            )
            for i, ch in enumerate(chunks):
                new_docs.append(ch)
                new_metas.append({"source": str(f), "chunk": i})
                new_ids.append(f"{_hash(str(f))}_{i}")

        vecs = np.asarray(self.embedder.embed_texts(new_docs), dtype=np.float32)
        vecs = _normalize_rows(vecs)

        emb_path = self.index_dir / EMB_FILE
        if emb_path.exists():
            old = np.load(emb_path)
            if old.shape[1] != vecs.shape[1]:
                raise RuntimeError(
                    f"Embedding dimension mismatch: existing {old.shape[1]} vs new {vecs.shape[1]}. "
                    "Clear the index: `contextlab clear`."
                )
            all_vecs = np.vstack([old, vecs])
        else:
            all_vecs = vecs

        np.save(emb_path, all_vecs)

        docs_path = self.index_dir / DOCS_FILE
        metas_path = self.index_dir / METAS_FILE
        ids_path = self.index_dir / IDS_FILE
        with docs_path.open("a", encoding="utf-8") as fd:
            with metas_path.open("a", encoding="utf-8") as fm:
                with ids_path.open("a", encoding="utf-8") as fi:
                    for d, m, i in zip(new_docs, new_metas, new_ids):
                        fd.write(d.replace("\n", "\\n") + "\n")
                        fm.write(json.dumps(m, ensure_ascii=False) + "\n")
                        fi.write(i + "\n")

        return len(new_docs)

    def query(self, query: str, top_k: int) -> Tuple[List[str], List[Dict], List[str]]:
        emb_path = self.index_dir / EMB_FILE
        if not emb_path.exists():
            return [], [], []

        V = np.load(emb_path)  # (N, D), normalized
        if V.size == 0:
            return [], [], []

        qv = np.asarray(self.embedder.embed_texts([query])[0], dtype=np.float32)[None, :]
        qv = _normalize_rows(qv)

        sims = (V @ qv.T).ravel()  # cosine == dot (normalized)
        if top_k <= 0:
            top_k = 1
        top_k = int(min(top_k, sims.size))
        idx = np.argpartition(-sims, top_k - 1)[:top_k]
        idx = idx[np.argsort(-sims[idx])]

        docs_path = self.index_dir / DOCS_FILE
        metas_path = self.index_dir / METAS_FILE
        ids_path = self.index_dir / IDS_FILE

        with docs_path.open("r", encoding="utf-8") as fd:
            docs_lines = [l.rstrip("\n").replace("\\n", "\n") for l in fd]
        with metas_path.open("r", encoding="utf-8") as fm:
            metas_lines = [json.loads(l) for l in fm]
        with ids_path.open("r", encoding="utf-8") as fi:
            ids_lines = [l.strip() for l in fi]

        N = min(len(docs_lines), len(metas_lines), len(ids_lines), V.shape[0])
        if N == 0:
            return [], [], []

        docs = [docs_lines[i] for i in idx[:N]]
        metas = [metas_lines[i] for i in idx[:N]]
        ids = [ids_lines[i] for i in idx[:N]]
        return docs, metas, ids

