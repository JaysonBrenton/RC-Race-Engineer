# filepath: src/contextlab/llm.py
"""High-level question answering pipeline built on top of OpenAI chat."""

from __future__ import annotations

from typing import Dict, Tuple

from openai import OpenAI

from .config import Settings
from .assembler import Assembler
from .store import VectorStore
from .memory import Memory


def answer(question: str, settings: Settings, show_context: bool = False) -> Tuple[str, Dict]:
    """Generate an answer and optionally return the assembled context."""
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

    # Store a clipped version of the exchange for follow-up conversations.
    memory.add(f"Q: {question}\nA: {text[:1200]}")

    if show_context:
        info_with_ctx = dict(info)
        info_with_ctx["context"] = context
        return text, info_with_ctx
    return text, info
