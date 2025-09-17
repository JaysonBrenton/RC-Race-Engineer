#!/usr/bin/env bash
# filepath: scripts/context-engineering-setup.sh
# Purpose: Bootstrap a complete "context engineering" Python project with exact files, paths, and contents.
# Usage: bash scripts/context-engineering-setup.sh <PROJECT_NAME>

set -euo pipefail

PROJECT_NAME=${1:-context-lab}
PYTHON_BIN=${PYTHON_BIN:-python3}

banner() { printf "\n==== %s ====\n" "$1"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "Error: '$1' is required."; exit 1; }; }
mkdir_p() { mkdir -p "$1"; }

banner "Checking prerequisites"
need "$PYTHON_BIN"

# Python version check (>= 3.10)
PY_VER=$($PYTHON_BIN - <<'PY'
import sys
print(f"{sys.version_info.major}.{sys.version_info.minor}")
PY
)
REQ_MAJOR=3; REQ_MINOR=10
CUR_MAJOR=${PY_VER%.*}; CUR_MINOR=${PY_VER#*.}
if [ "$CUR_MAJOR" -lt "$REQ_MAJOR" ] || { [ "$CUR_MAJOR" -eq "$REQ_MAJOR" ] && [ "$CUR_MINOR" -lt "$REQ_MINOR" ]; }; then
  echo "Python >= 3.10 required. Found $PY_VER"; exit 1
fi

ROOT_DIR=$(pwd)
PROJECT_DIR="$ROOT_DIR/$PROJECT_NAME"

banner "Creating project directory: $PROJECT_DIR"
mkdir_p "$PROJECT_DIR"
cd "$PROJECT_DIR"

banner "Creating directories"
mkdir_p src/contextlab
mkdir_p templates
mkdir_p data/raw
mkdir_p data/chroma
mkdir_p .ctx
mkdir_p tests
mkdir_p scripts

banner "Writing files"

# .gitignore
cat > .gitignore <<'EOF'
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
.venv/

# OS
.DS_Store

# ChromaDB
data/chroma/

# Local data
.ctx/
.env

# Test cache
.pytest_cache/
EOF

# .env.example
cat > .env.example <<'EOF'
# Copy to .env and fill in values
OPENAI_API_KEY=
EOF

# ctx.yaml (project config)
cat > ctx.yaml <<'EOF'
project_name: context-lab
store_path: data/chroma
collection_name: contextlab
embedding_backend: sentence-transformers   # 'openai' or 'sentence-transformers'
sbert_model: all-MiniLM-L6-v2
openai_embedding_model: text-embedding-3-small
chat_model: gpt-4o-mini
max_context_tokens: 6000
response_reserve_tokens: 1000
retrieval_top_k: 6
chunk_tokens: 400
chunk_overlap: 40
memory_cap_tokens: 1500
EOF

# pyproject.toml
cat > pyproject.toml <<'EOF'
[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "contextlab"
version = "0.1.0"
description = "Context engineering toolkit: ingestion, retrieval, token budgeting, memory, CLI"
readme = "README.md"
requires-python = ">=3.10"
authors = [{ name = "You" }]
license = { text = "MIT" }
dependencies = [
  "openai>=1.40.2",
  "tiktoken>=0.7.0",
  "chromadb>=0.5.3",
  "sentence-transformers>=3.0.1",
  "typer>=0.12.3",
  "pydantic>=2.8.2",
  "pyyaml>=6.0.2",
  "rich>=13.7.1",
  "python-dotenv>=1.0.1",
  "pytest>=8.3.2"
]

[project.scripts]
contextlab = "contextlab.cli:app"

[tool.setuptools.package-data]
contextlab = ["../templates/*"]

[tool.pytest.ini_options]
minversion = "8.0"
addopts = "-q"
pythonpath = ["src"]
EOF

# README.md
cat > README.md <<'EOF'
# context-lab (Context Engineering Toolkit)

Exact, reproducible setup to ingest docs, assemble context within a token budget, retrieve+memory, and query an LLM via CLI.

## 0) Requirements
- Python \>= 3.10
- macOS/Linux or WSL

## 1) Create project from bootstrap script
```bash
# From the directory where this repo/script lives
bash scripts/context-engineering-setup.sh context-lab
```

## 2) Create & activate venv, install
```bash
cd context-lab
$PYTHON -V  # ensure >=3.10
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
pip install -e .
```

## 3) Configure API key (if using OpenAI)
```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY=...
```

Optionally switch to local embeddings by editing `ctx.yaml`:
```yaml
embedding_backend: sentence-transformers  # default
# or
embedding_backend: openai
```

## 4) Ingest sample docs (replace with your folder later)
```bash
contextlab ingest data/raw
```

## 5) Ask a question
```bash
contextlab ask "What does this project do?" --show-context
```

## 6) Useful commands
```bash
contextlab clear          # wipe memory + vector store
contextlab ingest <dir>   # re-ingest from a directory
contextlab show-context "<question>"
```

## Notes
- PDFs not parsed by default. Convert to .md/.txt first.
- Local embeddings will download a model on first use (~100MB+).
EOF

# src/contextlab/__init__.py
cat > src/contextlab/__init__.py <<'EOF'
__all__ = [
    "config",
    "tokenizer",
    "embeddings",
    "store",
    "memory",
    "assembler",
    "llm",
]
EOF

# src/contextlab/config.py
cat > src/contextlab/config.py <<'EOF'
from __future__ import annotations
import os
from pathlib import Path
from typing import Optional
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


def load_settings(config_path: Optional[os.PathLike[str] | str] = "ctx.yaml") -> Settings:
    """Load settings from .env and YAML. Why: centralizes configuration and supports overrides."""
    load_dotenv(override=False)
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    data = yaml.safe_load(path.read_text()) or {}
    settings = Settings(**data)
    return settings
EOF

# src/contextlab/tokenizer.py
cat > src/contextlab/tokenizer.py <<'EOF'
from __future__ import annotations
from typing import List

# tiktoken is model-aware; fall back to cl100k_base when unknown.
import tiktoken

_DEFAULT_MODEL = "gpt-4o-mini"


def _get_encoding(model: str):
    try:
        return tiktoken.encoding_for_model(model)
    except Exception:
        return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str, model: str = _DEFAULT_MODEL) -> int:
    enc = _get_encoding(model)
    return len(enc.encode(text or ""))


def trim_to_tokens(text: str, max_tokens: int, model: str = _DEFAULT_MODEL) -> str:
    if max_tokens <= 0:
        return ""
    enc = _get_encoding(model)
    ids = enc.encode(text or "")
    if len(ids) <= max_tokens:
        return text
    # Why: hard trim to respect token budgets under worst-case packing.
    return enc.decode(ids[:max_tokens])


def chunk_by_tokens(text: str, chunk_size: int, overlap: int, model: str = _DEFAULT_MODEL) -> List[str]:
    enc = _get_encoding(model)
    ids = enc.encode(text or "")
    if chunk_size <= 0:
        return [text]
    docs = []
    i = 0
    step = max(1, chunk_size - max(0, overlap))
    while i < len(ids):
        docs.append(enc.decode(ids[i : i + chunk_size]))
        i += step
    return docs
EOF

# src/contextlab/embeddings.py
cat > src/contextlab/embeddings.py <<'EOF'
from __future__ import annotations
from typing import Iterable, List
from dataclasses import dataclass
from .config import Settings


@dataclass
class Embeddings:
    settings: Settings

    def _use_openai(self) -> bool:
        return self.settings.embedding_backend.lower() == "openai"

    def embed_texts(self, texts: Iterable[str]) -> List[List[float]]:
        texts = [t or "" for t in texts]
        if self._use_openai():
            # Why: use managed embeddings when API keys are available.
            from openai import OpenAI  # lazy import

            client = OpenAI()
            model = self.settings.openai_embedding_model
            resp = client.embeddings.create(model=model, input=texts)
            return [d.embedding for d in resp.data]
        else:
            # Why: allow offline/local usage without API costs.
            from sentence_transformers import SentenceTransformer

            model = SentenceTransformer(self.settings.sbert_model)
            vecs = model.encode(texts, normalize_embeddings=True)
            return [v.tolist() for v in vecs]
EOF

# src/contextlab/store.py
cat > src/contextlab/store.py <<'EOF'
from __future__ import annotations
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple
import chromadb
from chromadb.api.types import Documents, Embeddings as Vectors, IDs, Metadatas
from .config import Settings
from .tokenizer import chunk_by_tokens
from .embeddings import Embeddings


def _hash(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:16]


def _collect_files(root: Path) -> List[Path]:
    return [p for p in root.rglob("*") if p.suffix.lower() in {".md", ".txt"} and p.is_file()]


class VectorStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client = chromadb.PersistentClient(path=str(Path(settings.store_path)))
        self.coll = self.client.get_or_create_collection(name=settings.collection_name)
        self.embedder = Embeddings(settings)

    def rebuild(self) -> None:
        try:
            self.client.delete_collection(self.settings.collection_name)
        except Exception:
            pass
        self.coll = self.client.get_or_create_collection(name=self.settings.collection_name)

    def ingest_dir(self, directory: Path) -> int:
        directory = Path(directory)
        files = _collect_files(directory)
        total_chunks = 0
        for f in files:
            text = f.read_text(encoding="utf-8", errors="ignore")
            chunks = chunk_by_tokens(text, self.settings.chunk_tokens, self.settings.chunk_overlap)
            if not chunks:
                continue
            ids: IDs = []
            docs: Documents = []
            metas: Metadatas = []
            for i, ch in enumerate(chunks):
                cid = f"{_hash(str(f))}_{i}"
                ids.append(cid)
                docs.append(ch)
                metas.append({"source": str(f), "chunk": i})
            vecs: Vectors = self.embedder.embed_texts(docs)  # precompute
            self.coll.add(ids=ids, documents=docs, metadatas=metas, embeddings=vecs)
            total_chunks += len(chunks)
        return total_chunks

    def query(self, query: str, top_k: int) -> Tuple[List[str], List[Dict], List[str]]:
        vec = self.embedder.embed_texts([query])[0]
        res = self.coll.query(query_embeddings=[vec], n_results=top_k, include=["documents", "metadatas", "distances", "embeddings", "ids"])
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        ids = res.get("ids", [[]])[0]
        return docs, metas, ids
EOF

# src/contextlab/memory.py
cat > src/contextlab/memory.py <<'EOF'
from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple
from .config import Settings
from .tokenizer import count_tokens, trim_to_tokens


@dataclass
class Memory:
    settings: Settings

    @property
    def path(self) -> Path:
        return Path(".ctx/memory.jsonl")

    def add(self, text: str) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        rec = {"text": text}
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    def recent(self, cap_tokens: int) -> Tuple[str, List[str]]:
        if not self.path.exists():
            return "", []
        lines = self.path.read_text(encoding="utf-8").splitlines()
        picked: List[str] = []
        total = 0
        # Why: prioritize recency for short-term conversational grounding.
        for line in reversed(lines):
            try:
                obj = json.loads(line)
                text = obj.get("text", "")
            except Exception:
                continue
            t = count_tokens(text)
            if total + t <= cap_tokens:
                picked.append(text)
                total += t
            else:
                break
        buff = "\n---\n".join(reversed(picked))
        return buff, picked

    def clear(self) -> None:
        if self.path.exists():
            self.path.unlink()
EOF

# src/contextlab/assembler.py
cat > src/contextlab/assembler.py <<'EOF'
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple
from .config import Settings
from .tokenizer import count_tokens, trim_to_tokens
from .memory import Memory
from .store import VectorStore


@dataclass
class Assembler:
    settings: Settings
    store: VectorStore
    memory: Memory

    def _read(self, path: str) -> str:
        p = Path(path)
        if not p.exists():
            return ""
        return p.read_text(encoding="utf-8", errors="ignore")

    def build(self, question: str) -> Tuple[str, Dict]:
        sys = self._read("templates/system.txt")
        rules = self._read("templates/rules.md")
        fewshot = self._read("templates/fewshot.jsonl")

        retrieved_docs, metas, ids = self.store.query(question, self.settings.retrieval_top_k)
        mem_text, _ = self.memory.recent(self.settings.memory_cap_tokens)

        blocks: List[Tuple[str, str]] = [
            ("system", sys),
            ("rules", rules),
            ("fewshot", fewshot),
            ("memory", mem_text),
        ]
        for doc, meta, id_ in zip(retrieved_docs, metas, ids):
            src = f"retrieved({meta.get('source','')}, chunk={meta.get('chunk','?')}, id={id_})"
            blocks.append((src, doc))

        # Budgeting
        q_tokens = count_tokens(question, self.settings.chat_model)
        budget = self.settings.max_context_tokens - q_tokens - self.settings.response_reserve_tokens
        budget = max(0, budget)

        packed: List[str] = []
        included: List[str] = []
        used = 0
        for name, text in blocks:
            if not text:
                continue
            tlen = count_tokens(text, self.settings.chat_model)
            if tlen <= (budget - used):
                packed.append(f"## {name}\n{text}")
                included.append(name)
                used += tlen
            else:
                remain = budget - used
                if remain <= 0:
                    break
                packed.append(f"## {name}\n{trim_to_tokens(text, remain, self.settings.chat_model)}")
                included.append(name + " (truncated)")
                used = budget
                break

        context = "\n\n".join(packed)
        info = {
            "question_tokens": q_tokens,
            "context_tokens": used,
            "budget": budget,
            "included": included,
        }
        return context, info
EOF

# src/contextlab/llm.py
cat > src/contextlab/llm.py <<'EOF'
from __future__ import annotations
from typing import Dict, Tuple
from openai import OpenAI
from .config import Settings
from .assembler import Assembler
from .store import VectorStore
from .memory import Memory


def answer(question: str, settings: Settings, show_context: bool = False) -> Tuple[str, Dict]:
    store = VectorStore(settings)
    memory = Memory(settings)
    asm = Assembler(settings, store, memory)

    context, info = asm.build(question)

    client = OpenAI()
    resp = client.chat.completions.create(
        model=settings.chat_model,
        messages=[
            {"role": "system", "content": context},
            {"role": "user", "content": question},
        ],
        temperature=0.2,
    )
    text = resp.choices[0].message.content

    # Persist a concise memory record.
    memory.add(f"Q: {question}\nA: {text[:1200]}")

    if show_context:
        return text, info | {"context": context}
    return text, info
EOF

# src/contextlab/cli.py
cat > src/contextlab/cli.py <<'EOF'
from __future__ import annotations
import shutil
from pathlib import Path
import typer
from rich.console import Console
from rich.table import Table
from .config import load_settings
from .store import VectorStore
from .llm import answer
from .memory import Memory

app = typer.Typer(add_completion=False, help="Context Engineering CLI")
con = Console()


@app.command()
def init():
    """Ensure required directories exist."""
    for p in ["data/raw", "data/chroma", ".ctx", "templates"]:
        Path(p).mkdir(parents=True, exist_ok=True)
    con.print("Initialized directories.")


@app.command()
def ingest(directory: str = typer.Argument(..., help="Directory with .md/.txt"), rebuild: bool = typer.Option(False, help="Recreate collection")):
    s = load_settings()
    vs = VectorStore(s)
    if rebuild:
        vs.rebuild()
    total = vs.ingest_dir(Path(directory))
    con.print(f"Ingested chunks: [bold]{total}[/]")


@app.command()
def ask(q: str = typer.Argument(..., help="Your question"), show_context: bool = typer.Option(False, help="Print assembled context")):
    s = load_settings()
    text, info = answer(q, s, show_context=show_context)

    meta = Table(show_header=True, header_style="bold")
    meta.add_column("Key")
    meta.add_column("Value")
    for k in ["question_tokens", "context_tokens", "budget", "included"]:
        meta.add_row(k, str(info.get(k)))
    con.print(meta)

    if show_context:
        con.rule("Context")
        con.print(info.get("context", ""))

    con.rule("Answer")
    con.print(text)


@app.command("show-context")
def show_context(q: str = typer.Argument(..., help="Question to assemble context for")):
    from .assembler import Assembler

    s = load_settings()
    vs = VectorStore(s)
    mem = Memory(s)
    asm = Assembler(s, vs, mem)
    ctx, info = asm.build(q)
    con.print(f"Budget: {info['budget']}, used: {info['context_tokens']}")
    con.rule("Context")
    con.print(ctx)


@app.command()
def clear():
    s = load_settings()
    # wipe chroma
    chroma_path = Path(s.store_path)
    if chroma_path.exists():
        shutil.rmtree(chroma_path)
    chroma_path.mkdir(parents=True, exist_ok=True)
    # wipe memory
    Memory(s).clear()
    con.print("Cleared vector store and memory.")


if __name__ == "__main__":
    app()
EOF

# templates/system.txt
cat > templates/system.txt <<'EOF'
You are a focused assistant. Build concise, accurate answers. Include sources only when asked. Respect token budgets.
EOF

# templates/rules.md
cat > templates/rules.md <<'EOF'
- Keep answers concise and actionable.
- If uncertain, state assumptions.
- Prefer bullet points.
- No hallucinations; say "I don't know" when unsure.
EOF

# templates/fewshot.jsonl
cat > templates/fewshot.jsonl <<'EOF'
{"role":"user","content":"Explain context engineering briefly."}
{"role":"assistant","content":"Context engineering: curate and budget system/rules/examples/memory/retrieval so the model sees the most useful information within a token cap."}
EOF

# tests/test_budget.py
cat > tests/test_budget.py <<'EOF'
from contextlab.config import load_settings
from contextlab.assembler import Assembler
from contextlab.store import VectorStore
from contextlab.memory import Memory


def test_budget_packing(tmp_path, monkeypatch):
    # Use a temporary store path
    s = load_settings()
    s = s.model_copy(update={"store_path": str(tmp_path / "chroma")})
    vs = VectorStore(s)
    mem = Memory(s)
    asm = Assembler(s, vs, mem)
    ctx, info = asm.build("What is this?")
    assert info["context_tokens"] <= info["budget"]
EOF

# tests/test_cli_smoke.py
cat > tests/test_cli_smoke.py <<'EOF'
import subprocess, sys, os


def test_cli_help():
    out = subprocess.check_output([sys.executable, "-m", "contextlab.cli", "--help"]).decode()
    assert "Context Engineering CLI" in out
EOF

# Sample data
cat > data/raw/sample.md <<'EOF'
# Context Lab Sample

This project demonstrates a practical context engineering workflow:
- Ingest markdown/txt files
- Chunk with token-aware windowing
- Embed (OpenAI or Sentence Transformers)
- Retrieve top-k relevant chunks
- Assemble with system/rules/fewshot/memory
- Ask questions via CLI
EOF

banner "Done"
cat <<MSG
Project created at: $PROJECT_DIR

NEXT STEPS (exact commands):
  cd "$PROJECT_DIR"
  $PYTHON_BIN -m venv .venv
  source .venv/bin/activate
  python -m pip install -U pip
  pip install -e .
  cp .env.example .env   # and set OPENAI_API_KEY if using OpenAI
  contextlab ingest data/raw
  contextlab ask "What is this project about?" --show-context
MSG

