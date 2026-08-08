# AI Interview Agent — Prompt History & AI Usage Log 📜

This file maintains the prompt history and AI agent usage log for the **AI Interview Agent** hackathon submission.



---

## 📑 Prompts Log Summary

### Prompt 1: Initial Setup
- Run `git pull`
- Explore repository and prepare project context

### Prompt 2: Technical Spec & Scaffolding
- Read `curriculum.json`, `candidates.json`, `technical-spec.md`
- Scaffold `/backend` (FastAPI, health route `GET /health`, CORS, Pydantic schemas)
- Scaffold `/frontend` (React + Vite chat UI)
- `requirements.txt`, `.env.example`, `README.md`
- Confirm `technical-spec.md` contract understanding

### Prompt 3: Interview Engine & Anthropic LLM Integration
- Build `backend/llm_client.py` using Anthropic SDK (`claude-sonnet-4-6`)
- Build `backend/interview_engine.py` (In-memory session state, mission analyzer, curriculum selection)
- Enforce hard minimum rules: At least 8 questions asked AND at least 4 distinct curriculum days touched
- Output structured evaluation feedback (`summary`, `strengths[]`, `gaps[]`, `next[]`)

### Prompt 4: React Application & UX Design
- Build React 18 + Vite frontend with glassmorphism design system
- Components: `Header`, `CandidateSidebar` (mission radar & requirement counters), `ChatStream`, `FeedbackModal` (confetti & copy markdown report)
- Hybrid connectivity: Live API calls to FastAPI + static client evaluation fallbacks for Vercel/Netlify hosting

### Prompt 5: Hackathon Submission & AI Usage Log
- Maintain `PROMPTS.md` and `prompt.md` log throughout codebase for submission verification

### Prompt 6: Project Setup, Port Resolution & End-of-Interview Refactoring
- Set up React frontend packages and Python backend virtual environment
- Resolved port 8000 conflict by switching default backend port to 8001
- Implemented the dedicated final feedback LLM call with shape validation, retries, and fallback objects to prevent API crashes.

### Prompt 7: Breeth API Client Scaffolding
- Added `BREETH_API_KEY` to `.env` and `.env.example`
- Implemented robust `backend/breeth_client.py` client wrapper for Breeth API v1
- Implemented `write_episode` and `search` methods with graceful `429` (rate limit/quota exceeded) error tolerance returning `None` instead of throwing exceptions
- Created and executed a standalone test client `test_breeth.py` to verify API key connectivity

### Prompt 8: Breeth Ingestion & Semantic Search Integration
- Integrated `BreethClient` into `process_turn()` inside `backend/interview_engine.py`
- Implemented smart substantive answer analysis (`is_substantive_answer()`) to filter out trivial replies and skips to preserve intent budget
- Enabled dynamic context injection: queries Breeth search each turn and appends retrieved facts to the LLM system prompt for guided follow-up questions

### Prompt 9: Candidate Memory Graph UI Panel
- Updated the FastAPI backend `/api/interview` response schema to optionally return search memories containing source/target nodes, facts, and cognitive patterns
- Implemented Candidate Memory Graph sidebar panels in both the primary dashboard (`src/App.jsx`) and local test client (`frontend/src/App.jsx`) to display learned candidate facts in real-time

### Prompt 10: Apple-Inspired UI Overhaul & Contrast Refinement
- Redesigned visual styles across the dashboard and test client with clean Apple SF Pro system fonts, OLED dark rules, and crisp minimalist spacing.
- Implemented global Light/Dark mode switcher buttons that synchronize theme states dynamically using custom CSS variables.
- Fixed glass card background opacities and high contrast colors in light theme to resolve text readability, button disabled states, and memory panel layout issues.
- Successfully ran turn-by-turn simulated validation tests confirming clean execution.

### Prompt 11: Backend Hardening & Contract Verification
- Tightened the backend interview flow so fallback questions stay tied to the selected curriculum days instead of feeling generic.
- Normalized the `/api/interview` response contract to always return `reply`, `done`, `feedback`, and `memories` in a consistent shape.
- Verified the behavior with local regression tests and a live health check against the running FastAPI server.



