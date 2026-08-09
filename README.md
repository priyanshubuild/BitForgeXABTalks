# AI Interview Agent 🤖⚡

> **Intelligent Technical Candidate Evaluation Platform** — Vicodathon, Problem Statement 2.
> Built by **Team BitForge** using Gemini 2.0 Flash, FastAPI, Breeth Memory, and React + Vite.

---

## 🌟 What It Does

The AI Interview Agent conducts **personalized, multi-turn technical interviews** based on each candidate's learning journey through the 31-day AI Cohort curriculum. It doesn't ask scripted questions — it adapts in real-time.

### Core Capabilities
- **Curriculum-Aware Questioning** — Targets specific days the candidate passed, skipped, or failed
- **Adaptive Follow-Ups** — Evaluates every answer for topical relevance, depth, and correctness before deciding the next move
- **Topic State Machine** — Only advances topics when the candidate demonstrates mastery or hits a retry cap (2 attempts max per topic)
- **Verified Coverage** — A curriculum day counts only after the candidate has answered it; merely asking the next question cannot satisfy the completion gate
- **Evaluator Guardrails** — Model verdicts and next actions are normalized before they can change interview state
- **Real Answer Evaluation** — Both LLM-powered and heuristic pipelines that can actually **fail** weak, off-topic, or skipped answers
- **Breeth Memory Graph** — Persistent memory layer tracks candidate facts across turns for deeper context augmentation
- **Structured Feedback** — Generates detailed evaluation reports with summary, strengths, gaps, and actionable next steps
- **Reliable Fallback** — Gemini 2.0 Flash → Gemini 1.5 Flash → offline simulation with real evaluation
- **20 Candidate Profiles** — All Vicodathon-provided candidates loaded with full mission history
- **Apple-Pure Design** — Minimal, monochrome dark/light themes with glassmorphism and smooth transitions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                     │
│  Landing Page → Candidate Selection → Interview Dashboard    │
│  (Apple-pure Dark/Light theme, Markdown chat, Score tracker) │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP POST /api/interview
┌──────────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend (:8001)                     │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Interview Engine│  │  LLM Client  │  │  Breeth Client   │ │
│  │ (State Machine) │  │ (Gemini +    │  │ (Memory Graph)   │ │
│  │                 │  │  Simulator)  │  │                  │ │
│  └────────────────┘  └──────────────┘  └──────────────────┘ │
│  ┌────────────────┐  ┌──────────────┐                       │
│  │ Session Store   │  │  Curriculum  │                       │
│  │   (SQLite)     │  │    (JSON)    │                       │
│  └────────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Running Locally

### 1. Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys:
# GEMINI_API_KEY=your_key_here
# BREETH_API_KEY=your_key_here
```

### 2. Backend
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
```

### 3. Frontend
```bash
npm install
npm run dev
```
Open `http://localhost:3000`

### Deploying live AI evaluation on Vercel

This repository includes `api/index.py` and `vercel.json`, which together
expose the FastAPI `app` as a Vercel Python Serverless Function. The
`vercel.json` file **must be committed to git** — it defines the rewrite rules
that route `/api/*` requests to the Python function. Without it, the backend
returns 404 and the frontend falls back to offline simulation mode.

When deployed, the React frontend calls the same origin at `/api/interview`
and `/api/health`; no `localhost` or separate backend URL is needed.

**Required: Vercel Environment Variables**

In Vercel Project Settings → Environment Variables, add:

```env
GEMINI_API_KEY=your_key
BREETH_API_KEY=your_optional_key
```

Redeploy after adding the values. Verify live AI API availability at:

```text
https://vicodathon.priyanshugupta.com/api/health
```

The response should include `"ai_enabled": true` and `"status": "ok"`.
The frontend header shows **Live AI** (green dot) when the backend is
reachable and Gemini is configured, **Backend Only** (amber) when the
backend works but Gemini is missing, or **Simulation** (grey) when the
backend is unreachable.

**Alternative: Separately hosted backend**

For a separately hosted backend, set the frontend build-time variable:

```env
VITE_BACKEND_URL=https://api.your-domain.com
```

On that backend host, configure the same Gemini key and deployed frontend
origin before starting Uvicorn:

```env
GEMINI_API_KEY=your_key
CORS_ORIGINS=https://your-frontend-domain.com
```

Then verify `https://api.your-domain.com/api/health` returns `{"status":"ok"}`
and rebuild/redeploy the frontend. Never put `GEMINI_API_KEY` in a
`VITE_*` variable or commit `.env`.

### Validation
```bash
python3 -m compileall -q backend
npm run build
npm run lint
```

`backend/sessions.db` is local runtime state. It is ignored by Git and should
never be committed or included in a deployment artifact.

---

## 🌐 API Contract (`POST /api/interview`)

### Start Interview
```json
{ "sessionId": "abc-123", "candidate": { ...candidate object } }
→ { "reply": "Welcome...", "done": false }
```

### Conversation Turn
```json
{ "sessionId": "abc-123", "message": "..." }
→ { "reply": "...", "done": false, "answer_judgment": "strong", "memories": [...] }
```

### End Interview
```json
→ { "reply": "...", "done": true, "feedback": { "summary": "...", "strengths": [], "gaps": [], "next": [] } }
```

---

## 📋 Vicodathon Requirements Met

| Requirement | Status |
|---|---|
| Conversational technical interview | ✅ |
| Minimum 8 questions | ✅ Enforced by backend |
| At least 4 curriculum days covered | ✅ Enforced by backend |
| Follow-up questions based on responses | ✅ LLM evaluation pipeline |
| Conversation context maintained | ✅ SQLite session persistence |
| Structured feedback at end | ✅ summary/strengths/gaps/next |
| HTTP endpoint per technical spec | ✅ POST /api/interview |
| AI Usage Log | ✅ PROMPTS.md |

### Interview progression guarantees

For every candidate response, the backend evaluates the answer against the
topic that was actually asked before changing the current topic. Off-topic,
incorrect, insufficient, and vague answers receive a focused re-ask or
cross-examination. A topic moves forward only after a strong `advance` verdict
or the two-attempt cap, which records that topic as a feedback gap. The offline
UI fallback follows the same retry behavior.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18, Vite, Lucide Icons, react-markdown, remark-gfm |
| **Backend** | Python, FastAPI, Pydantic, SQLite |
| **AI/LLM** | Google Gemini 2.0 Flash (primary), Gemini 1.5 Flash, offline simulation fallback |
| **Memory** | Breeth Pro (persistent memory graph) |
| **Styling** | Vanilla CSS, Apple-pure design system, Glassmorphism, Dark/Light themes |
| **Design** | Inter + JetBrains Mono fonts, monochrome accent palette, CSS custom properties |

---

## 📂 Project Structure

```
bitforge/
├── api/
│   └── index.py             # Vercel Python Function entrypoint
├── backend/
│   ├── main.py              # FastAPI server, CORS, routes
│   ├── interview_engine.py  # Core interview logic & state machine
│   ├── llm_client.py        # Gemini/simulation LLM calls
│   ├── breeth_client.py     # Breeth memory API integration
│   ├── session_store.py     # SQLite session persistence
│   ├── test_evaluator.py    # Evaluator regression checks
│   └── test_interview_fallback.py # Offline-question regression check
├── src/
│   ├── App.jsx              # Main app — 3-page navigation
│   ├── index.css            # Full design system (Apple-pure)
│   ├── data/candidates.js   # All 20 candidate profiles
│   └── components/
│       ├── LandingPage.jsx      # Hero, features, tech badges
│       ├── CandidateSelect.jsx  # Searchable 20-candidate grid
│       ├── Header.jsx           # Compact interview header
│       ├── CandidateSidebar.jsx # SVG progress rings, live scores
│       ├── ChatStream.jsx       # Markdown chat with topic hints
│       └── FeedbackModal.jsx    # Evaluation report modal
├── vercel.json              # Vercel deployment config (API routing)
├── curriculum.json          # 31-day AI Cohort curriculum
├── PROMPTS.md              # AI usage & development log
└── README.md               # This file
```

---

*Built with ❤️ by Team BitForge for Vicodathon 2026, Problem Statement 2*
