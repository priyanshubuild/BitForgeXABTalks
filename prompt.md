# AI Interview Agent — Prompt History & AI Usage Log 📜

This file maintains the prompt history and AI agent usage log for the **AI Interview Agent** hackathon submission.

> For full details, see [`PROMPTS.md`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/PROMPTS.md).

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

