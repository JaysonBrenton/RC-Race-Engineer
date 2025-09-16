# filepath: src/contextlab/llm.py
from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

from openai import OpenAI

from .config import Settings
from .assembler import Assembler
from .store import VectorStore
from .memory import Memory


def _load_session_rules(settings: Settings) -> str:
    """Why: inject your session rules into the system prompt for consistent behavior."""
    import os
    root = Path(getattr(settings, "root_dir", Path.cwd()))
    env_path = os.getenv("CTX_SESSION_RULES")
    p = Path(env_path) if env_path else root / ".ctx" / "session-rules.md"
    try:
        return p.read_text(encoding="utf-8").strip()
    except Exception:
        return ""


def _chat_with_backoff(system_text: str, user_text: str, model: str) -> str:
    """Why: smooth transient 429s without manual retries."""
    import time

    client = OpenAI()
    delay = 1.0
    for attempt in range(5):
        try:
            r = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_text},
                    {"role": "user", "content": user_text},
                ],
                temperature=0.2,
            )
            return r.choices[0].message.content or ""
        except Exception as e:
            msg = str(e).lower()
            if "insufficient_quota" in msg or "authentication" in msg:
                raise
            if attempt == 4:
                raise
            time.sleep(delay)
            delay = min(delay * 2.0, 16.0)


def answer(question: str, settings: Settings, show_context: bool = False) -> Tuple[str, Dict]:
    store = VectorStore(settings)
    memory = Memory(settings)
    asm = Assembler(settings, store, memory)

    context, info = asm.build(question)

    rules = _load_session_rules(settings)
    system_prompt = (
        f"SESSION RULES (must-follow):\n{rules}\n\nCONTEXT:\n{context}"
        if rules else
        f"CONTEXT:\n{context}"
    )

    text = _chat_with_backoff(system_prompt, question, settings.chat_model)

    memory.add(f"Q: {question}\nA: {text[:1200]}")
    if show_context:
        return text, {**info, "context": context, "session_rules_injected": bool(rules)}
    return text, info

