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
    """Ensure required directories exist. Why: consistent environment."""
    for p in ["data/raw", "data/chroma", ".ctx", "templates"]:
        Path(p).mkdir(parents=True, exist_ok=True)
    con.print("Initialized directories.")

@app.command()
def ingest(directory: str = typer.Argument(..., help="Directory with .md/.txt"),
           rebuild: bool = typer.Option(False, help="Recreate collection")):
    s = load_settings()
    vs = VectorStore(s)
    if rebuild:
        vs.rebuild()
    total = vs.ingest_dir(Path(directory))
    con.print(f"Ingested chunks: [bold]{total}[/]")

@app.command()
def ask(q: str = typer.Argument(..., help="Your question"),
        show_context: bool = typer.Option(False, help="Print assembled context")):
    s = load_settings()
    text, info = answer(q, s, show_context=show_context)
    meta = Table(show_header=True, header_style="bold")
    meta.add_column("Key"); meta.add_column("Value")
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
    chroma_path = Path(s.store_path)
    if chroma_path.exists():
        shutil.rmtree(chroma_path)
    chroma_path.mkdir(parents=True, exist_ok=True)
    Memory(s).clear()
    con.print("Cleared vector store and memory.")

# Allow `python -m contextlab.cli`
if __name__ == "__main__":
    app()
