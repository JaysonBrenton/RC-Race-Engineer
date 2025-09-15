# filepath: src/contextlab/store.py
from __future__ import annotations
"""
Wrapper that re-exports `VectorStore` from the NumPy backend to avoid SQLite/Chroma issues.
"""

try:
    # Prefer absolute import when package is installed/editable
    from contextlab.store_numpy import VectorStore  # type: ignore  # noqa: F401
except Exception:  # pragma: no cover
    # Fallback for package-relative execution
    from .store_numpy import VectorStore  # type: ignore  # noqa: F401

