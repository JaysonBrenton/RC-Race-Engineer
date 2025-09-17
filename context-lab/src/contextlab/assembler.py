# filepath: src/contextlab/assembler.py
"""Builds the full language model context for a question.

This module gathers prompt templates, long-term memory, and retrieved
documents from the vector store. The :class:`Assembler` focuses purely on
assembling a text buffer that respects the caller's token budget, keeping the
rest of the system agnostic to how context is constructed.
"""

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
    """Combine templates, retrieval results, and memory into one context."""

    settings: Settings
    store: VectorStore
    memory: Memory

    def _read(self, path: str) -> str:
        """Best-effort text loader used for template and rules files."""
        p = Path(path)
        if not p.exists():
            return ""
        return p.read_text(encoding="utf-8", errors="ignore")

    def build(self, question: str) -> Tuple[str, Dict]:
        """Return a context string and metadata for the provided *question*.

        The assembler reads static prompt assets, retrieves relevant documents
        from the vector store, and blends them with the user's memory. It then
        ensures everything fits within the allowed token budget.
        """
        sys = self._read("templates/system.txt")
        rules = self._read("templates/rules.md")
        fewshot = self._read("templates/fewshot.jsonl")

        retrieved_docs, metas, ids = self.store.query(question, self.settings.retrieval_top_k)
        mem_text, _ = self.memory.recent(self.settings.memory_cap_tokens)

        # Ordered blocks represent the context sections fed to the model.
        blocks: List[Tuple[str, str]] = [
            ("system", sys),
            ("rules", rules),
            ("fewshot", fewshot),
            ("memory", mem_text),
        ]
        for doc, meta, id_ in zip(retrieved_docs, metas, ids):
            src = f"retrieved({meta.get('source','')}, chunk={meta.get('chunk','?')}, id={id_})"
            blocks.append((src, doc))

        q_tokens = count_tokens(question, self.settings.chat_model)
        budget = self.settings.max_context_tokens - q_tokens - self.settings.response_reserve_tokens
        budget = max(0, budget)

        # Build the final context while respecting the remaining token budget.
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
