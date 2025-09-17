# filepath: src/contextlab/tokenizer.py
"""Utility helpers that wrap ``tiktoken`` for token counting and slicing."""

from __future__ import annotations

from typing import List

import tiktoken

_DEFAULT_MODEL = "gpt-4o-mini"


def _get_encoding(model: str):
    """Return a ``tiktoken`` encoding instance for *model* with fallback."""
    try:
        return tiktoken.encoding_for_model(model)
    except Exception:
        return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str, model: str = _DEFAULT_MODEL) -> int:
    """Count how many tokens *text* would use for the supplied model."""
    enc = _get_encoding(model)
    return len(enc.encode(text or ""))


def trim_to_tokens(text: str, max_tokens: int, model: str = _DEFAULT_MODEL) -> str:
    """Trim *text* to at most *max_tokens* tokens, preserving order."""
    if max_tokens <= 0:
        return ""
    enc = _get_encoding(model)
    ids = enc.encode(text or "")
    if len(ids) <= max_tokens:
        return text
    return enc.decode(ids[:max_tokens])


def chunk_by_tokens(text: str, chunk_size: int, overlap: int, model: str = _DEFAULT_MODEL) -> List[str]:
    """Split *text* into overlapping token windows of size *chunk_size*."""
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
