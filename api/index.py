"""Vercel entrypoint for the live FastAPI interview API.

Vercel treats ``api/index.py`` as the catch-all Python function for ``/api/*``.
The frontend can therefore call the same deployed origin instead of localhost.
"""

from backend.main import app

