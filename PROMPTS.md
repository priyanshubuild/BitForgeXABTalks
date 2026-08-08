# AI Interview Agent — AI Usage & Prompt Log 📜🤖

> **Hackathon Submission Requirement**: Full log of prompts and AI interactions used to build the **AI Interview Agent** for the AI Cohort Hackathon.

---

## 📌 Project Overview
- **Project Name**: AI Technical Interview Agent
- **Backend Stack**: Python, FastAPI, Pydantic, Anthropic Claude SDK (`claude-sonnet-4-6`), Uvicorn
- **Frontend Stack**: React 18, Vite, Lucide React, Canvas Confetti, Glassmorphism CSS Design System
- **Single API Contract**: `POST /api/interview` per `technical-spec.md`

---

## 📑 Chronological Prompt Log

### Phase 1: Environment Initialization & Git Workflow
**Prompt:**
> `run thsi git pull`
> `# run the Antigravity prompt`
> `# test that it actually works locally`
> `git add -A`
> `git commit -m "short honest description of what this prompt did"`
> `git push`

**Actions & Results:**
- Pulled latest changes from GitHub repository `BitForgeXABTalks`.
- Inspected repository structure and initial README.

---

### Phase 2: Requirements Analysis & Project Scaffolding
**Prompt:**
> I'm building an AI Interview Agent for a hackathon. I've attached curriculum.json, candidates.json, and technical-spec.md in the project root — read all three fully before doing anything.
> Requirements:
> - Backend: Python + FastAPI
> - Single endpoint: POST /api/interview
> - State kept in-memory per sessionId
> - Ask at least 8 questions covering at least 4 curriculum days based on candidate's completed missions
> - Dynamic follow-up questions based on candidate answers
> - Final response with structured feedback: summary, strengths[], gaps[], next[]
> Set up the project structure first: /backend, /frontend, requirements.txt, .env.example, README.md. Don't write the interview logic yet — scaffold the project, set up FastAPI health check, and confirm technical-spec.md contract by summarizing it back to me.

**Actions & Results:**
- Inspected [`technical-spec.md`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/technical-spec.md), [`curriculum.json`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/curriculum.json), and [`candidates.json`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/candidates.json).
- Created [`requirements.txt`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/requirements.txt) with `fastapi`, `uvicorn`, `pydantic`, `python-dotenv`, `anthropic`.
- Created [`.env.example`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/.env.example) for `ANTHROPIC_API_KEY`.
- Created [`backend/main.py`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/backend/main.py) with CORS middleware, health routes (`GET /health`), and data model schemas.
- Scaffolded [`frontend/index.html`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/frontend/index.html) test UI.
- Summarized the API contract back to the user.

---

### Phase 3: Core Interview Engine & LLM Logic Implementation
**Prompt:**
> Now implement the core interview logic in the backend.
> Design:
> 1. On the first request (no "message" field, just sessionId + candidate object), create a new in-memory session: store full candidate object, pick target list of curriculum days (4-5 days from curriculum.json based on completed missions), initialize empty conversation history.
> 2. Build system prompt for LLM including candidate name/role, specific days/topics, and instructions to behave like a real technical interviewer (one question at a time, natural follow-ups for vague answers).
> 3. On every subsequent request, append candidate message, call LLM with full history + system prompt, return reply.
> 4. Hard minimum in code: don't allow "done": true until at least 8 questions asked AND 4 curriculum days touched.
> Use Anthropic API (model claude-sonnet-4-6) via anthropic Python SDK in an isolated module.
> Show me the full flow with sample curl requests/responses.

**Actions & Results:**
- Created [`backend/llm_client.py`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/backend/llm_client.py) for Anthropic LLM calls with simulation fallbacks.
- Created [`backend/interview_engine.py`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/backend/interview_engine.py) to manage in-memory session state, topic selection, and the 8-question / 4-day minimum rule.
- Updated [`backend/main.py`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/backend/main.py) routing `POST /api/interview` to initialization vs turn processing.
- Verified sample `curl` commands for initial turn, follow-up turn, and final feedback response turn.

---

### Phase 4: Production React Frontend Development
**Prompt:**
> show me the preview of the app now, till now what we made? what frontend stack we used? we have to make and deplyable website, make an react site

**Actions & Results:**
- Built a React 18 + Vite frontend in [`/src`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/src) and [`/frontend`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/frontend).
- Designed glassmorphic dark theme ([`src/index.css`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/src/index.css)) with HSL colors and Google Fonts (`Plus Jakarta Sans` & `Space Grotesk`).
- Implemented components:
  - Header & Candidate Dropdown ([`Header.jsx`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/src/components/Header.jsx))
  - Candidate Mission Radar & Requirement Counters ([`CandidateSidebar.jsx`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/src/components/CandidateSidebar.jsx))
  - Real-time Dialogue Feed ([`ChatStream.jsx`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/src/components/ChatStream.jsx))
  - Evaluation Report Modal with Confetti & Copy Markdown ([`FeedbackModal.jsx`](file:///c:/Users/PRINCE/OneDrive/Desktop/BitForge/BitForgeXABTalks/src/components/FeedbackModal.jsx))
- Configured hybrid connection: connects live to `http://localhost:8000/api/interview` when backend is online, and includes an embedded fallback engine for static deployments on Vercel/Netlify.

---

### Phase 5: Submission Checklist & Prompt Log Maintenance
**Prompt:**
> Submission checklist
> Public GitHub repo
> Live deployed URL
> AI-usage log: A PROMPTS.md in the repo, or exported chat transcripts.
> [Submit these on the submission page →](https://www.abtalks.in/hackathon/submission)
> also maintain prompt.md file throughout the code

**Actions & Results:**
- Created and maintained `PROMPTS.md` and `prompt.md` tracking all prompt iterations, architectural decisions, and tool executions.

---

### Phase 6: Project Setup, Port Resolution & End-of-Interview Refactoring
**Prompt:**
> read the source adn also add reuwqired files (react vite files , this is comaborated project from collaboration and i didnt made the setup so made the setup and complete the project
>
> Now implement the end-of-interview step.
> When the interview engine decides the interview is done (per the rules from before), make one final LLM call whose only job is to produce structured feedback from the full conversation history: a "summary" string, "strengths" array, "gaps" array, and "next" array (concrete study/practice suggestions tied to specific curriculum days the candidate struggled on or skipped).
> Force this into valid JSON reliably — use the LLM's structured/JSON output mode rather than trying to parse free text, and validate the shape before returning it in the API response, matching technical-spec.md exactly. Add basic error handling: if the LLM call fails or returns malformed JSON, retry once, then fall back to a minimal valid feedback object rather than crashing the endpoint.

**Actions & Results:**
- Set up local Python virtual environment (`venv`) and node modules via `npm install`.
- Configured port `8001` for the FastAPI backend and updated the React frontend to resolve a conflict on port `8000`.
- Refactored `backend/interview_engine.py` to add `generate_feedback_with_retry` and `validate_feedback_shape`.
- Verified end-to-end integration and validated outputs under normal flow and fallbacks.

---

---

### Phase 7: Breeth Memory Integration Scaffolding
**Prompt:**
> I want to add an optional memory layer using Breeth (docs at docs.thebreeth.com, base URL https://api.thebreeth.com/v1)...

**Actions & Results:**
- Added `BREETH_API_KEY` configuration variables.
- Created `backend/breeth_client.py` using `httpx` to access Breeth endpoints with robust 429 quota limit toleration.
- Created standalone validation tests `test_breeth.py`.

---

### Phase 8: RAG Memory Retrieval Loop
**Prompt:**
> Use Breeth's search to make follow-up questions smarter...

**Actions & Results:**
- Integrated `BreethClient` inside the backend `process_turn()` loop in `backend/interview_engine.py`.
- Formulated search queries dynamically and injected retrieved candidate facts and cognitive patterns into Claude's system prompt context.

---

### Phase 9: Real-time Memory Graph UI Sidebar
**Prompt:**
> Add a small panel to the frontend chat UI, next to the transcript, that shows a running list of "things learned about this candidate" during the interview...

**Actions & Results:**
- Extended `/api/interview` endpoint schema to return a list of memories containing source, target, facts, and cognitive patterns.
- Built Candidate Memory Graph sidebar sections in the dashboard and local test client to dynamically present candidate facts.

---

### Phase 10: Apple Minimalist UX Overhaul & Theme Switching
**Prompt:**
> ui and ux got fucked fix it and make moderna and great ui and ux

**Actions & Results:**
- Refactored index stylesheets to implement Apple system font stacks, OLED dark mode, and Apple light mode.
- Designed global Light/Dark mode switcher buttons that synchronize states via data attributes.
- Solved card transparency and contrast conflicts in light mode to guarantee clear legibility.
- Executed turn-by-turn simulation script to confirm end-to-end correctness.

---

### Phase 11: Full Design System Overhaul + Gemini Free LLM Integration
**Prompt:**
> strictly follow technical-spec.md, candidates.json and curriculum.md — make best ideal project that actually can win the hackathon. Most unique and great ui and ux — minimal and modern and blurry and glass effects. For completely free, how should it look ideally?

**Actions & Results:**
- Upgraded `backend/llm_client.py` to support **Google Gemini 2.0 Flash** (completely free) as primary LLM provider, Anthropic Claude as secondary, with a high-quality offline simulation engine as fallback.
- Added `google-generativeai` to `requirements.txt` and installed the package.
- Updated `.env` and `.env.example` to document Gemini as the recommended free API option.
- Performed complete rewrite of `src/index.css`: new Inter + JetBrains Mono font stack from Google Fonts, full CSS token system, glassmorphism `.glass` / `.glass-heavy` utilities, premium animations (`fadeUp`, `blink`, `waveBar`, `shimmer`, `gradientMove`), chip badges, progress bars, avatar styles, wave loading bars, typing cursor keyframe, and ambient glow classes.
- Rewrote `Header.jsx`: BrainCircuit brand icon, gradient indigo/violet logo glow, inline candidate selector with custom styled-select, session ID display in monospace, ghost reset/theme buttons.
- Rewrote `ChatStream.jsx`: TypewriterText component with chunk-based animated character reveal, wave loading bars (5-bar animation), updated quick-prompt pills with Zap icon, avatar initials for user, refined bubble shapes with `bubble-ai` / `bubble-user` CSS classes.
- Rewrote `CandidateSidebar.jsx`: 3-cell stats grid (completed/1st-try/commit-days), animated progress bars, mission heatmap dots (green=passed/gray=skipped/red=failed), fully redesigned topic cards with green check-circle overlays when covered.
- Rewrote `FeedbackModal.jsx`: gradient header, double confetti burst, Section component with colored dot lists, clean 2-col strengths/gaps grid, Copy Markdown + New Interview buttons.
- Rewrote `App.jsx`: ambient SVG-less background glow divs, clean 3-column flex layout, Memory Graph sidebar with `GitBranch` icon and `animate-slide-in` per-node animation, improved simulation fallback with more realistic follow-up phrasing.
- Verified FastAPI backend starts clean on port 8001; Vite dev server starts on port 3001; health check returns 200 OK.

---

## 🚀 Live Deployment Checklist
- [x] Public GitHub Repository: `https://github.com/priyanshubuild/BitForgeXABTalks`
- [x] AI Usage Log: [`PROMPTS.md`](./PROMPTS.md) & [`prompt.md`](./prompt.md)
- [x] Backend API: `POST /api/interview` & `GET /health` (running on port 8001)
- [x] React Single Page Application with client fallbacks ready for Vercel/Netlify deployment (running on port 3001)
- [x] Free LLM: Google Gemini 2.0 Flash (no cost, generous rate limits)

