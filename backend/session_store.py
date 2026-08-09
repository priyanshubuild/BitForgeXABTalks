"""
session_store.py — SQLite-backed session persistence.

Replaces the bare module-scope `sessions: Dict[str, Any] = {}` which was wiped
on every hot-reload (nodemon/uvicorn --reload) and on every cold serverless
invocation.  SQLite stores the session as a JSON blob keyed by sessionId so it
survives across process restarts within the same host, and can be swapped for
Redis/Postgres later with a 1-line change.

The store is intentionally simple:
  - get_session(sid)   → dict | None
  - set_session(sid, data) → None
  - delete_session(sid) → None
  - list_sessions()    → [sid, ...]   (for debugging)
"""
import json
import os
import sqlite3
import threading
import tempfile
from typing import Any, Dict, List, Optional

# Vercel's deployment bundle is read-only; its temporary directory is writable
# for the lifetime of a warm function instance. Other hosts keep the local DB
# beside this module unless SESSION_DB_PATH is explicitly configured.
_DB_PATH = os.getenv("SESSION_DB_PATH") or (
    os.path.join(tempfile.gettempdir(), "bitforge-sessions.db")
    if os.getenv("VERCEL")
    else os.path.join(os.path.dirname(__file__), "sessions.db")
)

# One lock per process — sqlite3 is not thread-safe for concurrent writes
_lock = threading.Lock()


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    """Create the sessions table if it doesn't already exist."""
    with _lock:
        with _get_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    data       TEXT NOT NULL,
                    updated_at REAL NOT NULL DEFAULT (strftime('%s', 'now'))
                )
                """
            )
            conn.commit()


# Initialise on import
_init_db()


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Return the session dict, or None if it doesn't exist."""
    with _lock:
        with _get_conn() as conn:
            row = conn.execute(
                "SELECT data FROM sessions WHERE session_id = ?", (session_id,)
            ).fetchone()
    if row is None:
        return None
    raw = json.loads(row["data"])
    # sets are serialised as lists — restore days_covered
    if "days_covered" in raw and isinstance(raw["days_covered"], list):
        raw["days_covered"] = set(raw["days_covered"])
    return raw


def set_session(session_id: str, data: Dict[str, Any]) -> None:
    """Upsert session data.  Sets are converted to lists for JSON compatibility."""
    serialisable = {**data}
    if "days_covered" in serialisable and isinstance(serialisable["days_covered"], set):
        serialisable["days_covered"] = list(serialisable["days_covered"])
    blob = json.dumps(serialisable, ensure_ascii=False)
    with _lock:
        with _get_conn() as conn:
            conn.execute(
                """
                INSERT INTO sessions (session_id, data, updated_at)
                VALUES (?, ?, strftime('%s', 'now'))
                ON CONFLICT(session_id) DO UPDATE SET
                    data       = excluded.data,
                    updated_at = excluded.updated_at
                """,
                (session_id, blob),
            )
            conn.commit()


def delete_session(session_id: str) -> None:
    with _lock:
        with _get_conn() as conn:
            conn.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
            conn.commit()


def list_sessions() -> List[str]:
    """Return all active session IDs (for debugging only)."""
    with _lock:
        with _get_conn() as conn:
            rows = conn.execute("SELECT session_id FROM sessions ORDER BY updated_at DESC").fetchall()
    return [r["session_id"] for r in rows]
