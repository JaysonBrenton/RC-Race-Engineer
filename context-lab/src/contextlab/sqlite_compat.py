# filepath: src/contextlab/sqlite_compat.py
"""
Shim to supply a modern sqlite3 via pysqlite3 on systems with old SQLite (< 3.35).
Import this module **before** importing packages that require sqlite3>=3.35 (e.g., chromadb).
Why: CentOS/RHEL/Fedora LTS often ship Python linked against an old libsqlite.
"""
from __future__ import annotations


try:
import sys # noqa: F401
import pysqlite3 as _pysqlite3 # type: ignore
# Make imports of `sqlite3` resolve to `pysqlite3` at runtime
sys.modules.setdefault("sqlite3", _pysqlite3)
except Exception:
# If pysqlite3 is not installed, we do nothing; importing chromadb will then error clearly.
pass
