# AI Interview Agent 🤖⚡

> **Intelligent Technical Candidate Evaluation Platform for the AI Cohort Hackathon.**
> Combines a **Python FastAPI backend** with an **Anthropic Claude LLM engine** and a **Stunning React + Vite Web Interface**.

---

## 🌟 Overview & Architecture

- **Backend (`/backend`)**: FastAPI app exposing `POST /api/interview` (and health check `GET /health`). Maintains in-memory interview sessions, dynamically selects 4–5 target curriculum days from [`candidates.json`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/candidates.json) & [`curriculum.json`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/curriculum.json), conducts interactive technical questioning, and enforces hard minimum constraints (8+ questions across 4+ curriculum days) before generating structured evaluation feedback.
- **LLM Client (`backend/llm_client.py`)**: Anthropic SDK integration (`claude-sonnet-4-6`), reading `ANTHROPIC_API_KEY` from environment variables, with offline simulation fallbacks.
- **React Frontend (`/src`)**: Built with **React 18 + Vite + Lucide Icons + Canvas Confetti**. Features candidate profile switching, live mission radar, evaluation progress counters, real-time message stream, and animated feedback modal reports.

---

## 🚀 How to Run & Preview

### 1. Run FastAPI Backend
```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```
- Health Check: `http://localhost:8000/health`
- Single API Endpoint: `POST http://localhost:8000/api/interview`

### 2. Run React Web Interface
```bash
# In the project root
npm run dev
```
- Open `http://localhost:3000` (or `http://localhost:5173`) in your browser to interact with the full web app.

---

## 🌐 Deploying the Website

- **Frontend Deployment (Vercel / Netlify / GitHub Pages)**:
  Run `npm run build` to generate the static `/dist` bundle. The React frontend is designed with client fallbacks so it runs smoothly both locally with FastAPI and when deployed statically!
- **Backend Deployment (Render / Railway / Docker)**:
  Deploy the `/backend` FastAPI service with environment variable `ANTHROPIC_API_KEY`.
