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
