# AI Interview Agent 🤖⚡

> **Intelligent Technical Candidate Evaluation Platform** — AI Cohort Hackathon, Problem Statement 1.  
> Built by **Team BitForge** using Gemini 2.0 Flash, FastAPI, Breeth Memory, and React + Vite.

---

## 🌟 What It Does

The AI Interview Agent conducts **personalized, multi-turn technical interviews** based on each candidate's learning journey through the 31-day AI Cohort curriculum. It doesn't ask scripted questions — it adapts.

### Core Capabilities
- **Curriculum-Aware Questioning** — Targets specific days the candidate passed, skipped, or failed
- **Adaptive Follow-Ups** — Evaluates every answer for relevance, depth, and correctness before deciding the next move
- **Topic State Machine** — Only advances topics when the candidate demonstrates mastery or hits a retry cap
- **Breeth Memory Graph** — Persistent memory layer tracks facts across turns for deeper context
- **Structured Feedback** — Generates detailed evaluation reports with strengths, gaps, and actionable next steps
- **Multi-LLM Fallback** — Gemini 2.0 Flash primary → Anthropic Claude fallback → offline simulation
- **20 Candidate Profiles** — All hackathon-provided candidates loaded with full mission history

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                     │
│  Landing Page → Candidate Selection → Interview Dashboard    │
│  (Dark/Light theme, Markdown rendering, Memory graph panel)  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP POST /api/interview
┌──────────────────────────▼──────────────────────────────────┐
│                   FastAPI Backend (:8001)                     │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Interview Engine│  │  LLM Client  │  │  Breeth Client   │ │
│  │ (State Machine) │  │(Gemini/Claude│  │ (Memory Graph)   │ │
│  │                 │  │  /Simulator) │  │                  │ │
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
→ { "reply": "...", "done": false, "memories": [...] }
```

### End Interview
```json
→ { "reply": "...", "done": true, "feedback": { "summary": "...", "strengths": [], "gaps": [], "next": [] } }
```

---

## 📋 Hackathon Requirements Met

| Requirement | Status |
|---|---|
| Conversational technical interview | ✅ |
| Minimum 8 questions | ✅ Enforced by backend |
| At least 4 curriculum days covered | ✅ Enforced by backend |
| Follow-up questions based on responses | ✅ Evaluation pipeline |
| Conversation context maintained | ✅ SQLite session persistence |
| Structured feedback at end | ✅ summary/strengths/gaps/next |
| HTTP endpoint per technical spec | ✅ POST /api/interview |
| AI Usage Log | ✅ PROMPTS.md + AI_USAGE_LOG.md |

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18, Vite, Lucide Icons, react-markdown |
| **Backend** | Python, FastAPI, Pydantic, SQLite |
| **AI/LLM** | Google Gemini 2.0 Flash (primary), Anthropic Claude (fallback) |
| **Memory** | Breeth Pro (persistent memory graph) |
| **Styling** | Vanilla CSS, Glassmorphism, Dark/Light themes |

---

*Built with ❤️ by Team BitForge for the AI Cohort Hackathon 2026*
