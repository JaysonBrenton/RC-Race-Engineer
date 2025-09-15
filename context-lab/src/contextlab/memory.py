from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple
from .config import Settings
from .tokenizer import count_tokens

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
