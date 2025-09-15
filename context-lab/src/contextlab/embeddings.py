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
            # Why: managed embeddings when API keys are available.
            from openai import OpenAI  # lazy import
            client = OpenAI()
            model = self.settings.openai_embedding_model
            resp = client.embeddings.create(model=model, input=texts)
            return [d.embedding for d in resp.data]
        else:
            # Why: offline/local usage without API costs.
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(self.settings.sbert_model)
            vecs = model.encode(texts, normalize_embeddings=True)
            return [v.tolist() for v in vecs]
