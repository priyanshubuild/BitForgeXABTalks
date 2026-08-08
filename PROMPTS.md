# AI Interview Agent — AI Usage & Prompt Log 📜🤖

> **Hackathon Submission Requirement**: Full log of prompts and AI interactions used to build the **AI Interview Agent** for the AI Cohort Hackathon.

---

## 📌 Project Overview
- **Project Name**: AI Technical Interview Agent
- **Backend Stack**: Python, FastAPI, Pydantic, Google Gemini 2.0 Flash SDK, Anthropic Claude SDK, Uvicorn, SQLite
- **Frontend Stack**: React 18, Vite, Lucide React, Canvas Confetti, Glassmorphism CSS Design System
- **Memory Layer**: Breeth API (`POST /v1/episodes`, `POST /v1/search`) for candidate knowledge graph
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
- Inspected `technical-spec.md`, `curriculum.json`, and `candidates.json`.
- Created `requirements.txt` with `fastapi`, `uvicorn`, `pydantic`, `python-dotenv`, `anthropic`.
- Created `.env.example` for `ANTHROPIC_API_KEY`.
- Created `backend/main.py` with CORS middleware, health routes (`GET /health`), and data model schemas.
- Scaffolded `frontend/index.html` test UI.
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
- Created `backend/llm_client.py` for Anthropic LLM calls with simulation fallbacks.
- Created `backend/interview_engine.py` to manage in-memory session state, topic selection, and the 8-question / 4-day minimum rule.
- Updated `backend/main.py` routing `POST /api/interview` to initialization vs turn processing.
- Verified sample `curl` commands for initial turn, follow-up turn, and final feedback response turn.

---

### Phase 4: Production React Frontend Development
**Prompt:**
> show me the preview of the app now, till now what we made? what frontend stack we used? we have to make and deplyable website, make an react site

**Actions & Results:**
- Built a React 18 + Vite frontend in `/src` and `/frontend`.
- Designed glassmorphic dark theme (`src/index.css`) with HSL colors and Google Fonts (`Plus Jakarta Sans` & `Space Grotesk`).
- Implemented components: Header & Candidate Dropdown, Candidate Mission Radar & Requirement Counters, Real-time Dialogue Feed, Evaluation Report Modal with Confetti & Copy Markdown.
- Configured hybrid connection: connects live to `http://localhost:8001/api/interview` when backend is online, and includes an embedded fallback engine for static deployments.

---

### Phase 5: Submission Checklist & Prompt Log Maintenance
**Prompt:**
> Submission checklist
> Public GitHub repo
> Live deployed URL
> AI-usage log: A PROMPTS.md in the repo, or exported chat transcripts.
> also maintain prompt.md file throughout the code

**Actions & Results:**
- Created and maintained `PROMPTS.md` and `AI_USAGE_LOG.md` tracking all prompt iterations, architectural decisions, and tool executions.

---

### Phase 6: Project Setup, Port Resolution & End-of-Interview Refactoring
**Prompt:**
> read the source and also add required files (react vite files, this is a collaborated project and i didn't make the setup so made the setup and complete the project)
>
> Now implement the end-of-interview step. When the interview engine decides the interview is done, make one final LLM call whose only job is to produce structured feedback: "summary" string, "strengths" array, "gaps" array, and "next" array. Force this into valid JSON reliably. Add basic error handling: if the LLM call fails or returns malformed JSON, retry once, then fall back to a minimal valid feedback object rather than crashing the endpoint.

**Actions & Results:**
- Set up local Python virtual environment (`venv`) and node modules via `npm install`.
- Configured port `8001` for the FastAPI backend.
- Refactored `backend/interview_engine.py` to add `generate_feedback_with_retry` and `validate_feedback_shape`.
- Verified end-to-end integration and validated outputs under normal flow and fallbacks.

---

### Phase 7: Breeth Memory Integration Scaffolding
**Prompt:**
> I want to add an optional memory layer using Breeth (docs at docs.thebreeth.com, base URL https://api.thebreeth.com/v1)...

**Actions & Results:**
- Added `BREETH_API_KEY` configuration variables.
- Created `backend/breeth_client.py` using `requests` to access Breeth endpoints with robust 429 quota limit toleration.
- Created standalone validation tests `test_breeth.py`.

---

### Phase 8: RAG Memory Retrieval Loop
**Prompt:**
> Use Breeth's search to make follow-up questions smarter...

**Actions & Results:**
- Integrated `BreethClient` inside the backend `process_turn()` loop in `backend/interview_engine.py`.
- Formulated search queries dynamically and injected retrieved candidate facts and cognitive patterns into the LLM system prompt context.

---

### Phase 9: Real-time Memory Graph UI Sidebar
**Prompt:**
> Add a small panel to the frontend chat UI, next to the transcript, that shows a running list of "things learned about this candidate" during the interview...

**Actions & Results:**
- Extended `/api/interview` endpoint schema to return a list of memories containing source, target, facts, and cognitive patterns.
- Built Candidate Memory Graph sidebar sections in the dashboard to dynamically present candidate facts.

---

### Phase 10: Apple Minimalist UX Overhaul & Theme Switching
**Prompt:**
> ui and ux got fucked fix it and make modern and great ui and ux

**Actions & Results:**
- Refactored index stylesheets to implement Apple system font stacks, OLED dark mode, and Apple light mode.
- Designed global Light/Dark mode switcher buttons that synchronize states via data attributes.
- Solved card transparency and contrast conflicts in light mode to guarantee clear legibility.

---

### Phase 11: Full Design System Overhaul + Gemini Free LLM Integration
**Prompt:**
> strictly follow technical-spec.md, candidates.json and curriculum.md — make best ideal project that actually can win the hackathon. Most unique and great ui and ux — minimal and modern and blurry and glass effects. For completely free, how should it look ideally?

**Actions & Results:**
- Upgraded `backend/llm_client.py` to support **Google Gemini 2.0 Flash** (completely free) as primary LLM provider, Anthropic Claude as secondary, with a high-quality offline simulation engine as fallback.
- Added `google-generativeai` to `requirements.txt`.
- Performed complete rewrite of `src/index.css`: Inter + JetBrains Mono font stack, full CSS token system, glassmorphism utilities, premium animations, chip badges, progress bars, wave loading bars.
- Rewrote all components: `Header.jsx`, `ChatStream.jsx`, `CandidateSidebar.jsx`, `FeedbackModal.jsx`, `App.jsx`.
- Verified FastAPI backend starts clean on port 8001; Vite dev server on port 3001.

---

### Phase 12: Critical Bug Fixes — Session Persistence & Evaluation Pipeline
**Prompt:**
> The interview agent has two confirmed bugs from a live test session (sess-178620861, candidate Sarah Johnson). Fix the root cause of each, don't paper over the symptom.
>
> BUG 1: Evaluation report says "Session not found" even though the same session was live and working seconds earlier in the chat UI.
> Diagnose: Is the session store a plain in-memory dict at module scope? If the dev server uses hot-reload, any file save resets module state and wipes the dict. This also breaks in serverless (Vercel, Lambda) where each invocation can hit a cold instance. Fix: replace volatile dict with SQLite-backed persistence. Missing sessions must raise a loud 404 not silently return fake data.
>
> BUG 2: The interviewer generates "Good answer regarding [their words]..." follow-ups regardless of whether the answer is correct, off-topic, or vague. Fix so the LLM explicitly evaluates answer quality BEFORE generating a follow-up. Banned patterns: any echo-template. Off-topic answers must trigger a call-out and re-ask.

**Files Created / Modified:**
- `/backend/session_store.py` *(new — SQLite-backed store: `get_session`, `set_session`, `delete_session`, `list_sessions`)*
- `/backend/interview_engine.py` *(evaluate_answer, _heuristic_evaluate, build_follow_up_prompt, SQLite wiring)*
- `/backend/llm_client.py` *(call_llm_for_evaluation — no simulation fallback, gemini-1.5-flash model fallback)*
- `/backend/main.py` *(GET /api/sessions debug endpoint, active_sessions count in health check)*
- `/backend/test_evaluator.py` *(new — 4-assertion test for off-topic and on-topic detection)*
- `/src/App.jsx` *(removed "Good answer regarding..." echo-template from frontend simulation)*

**Core Accomplishments:**
- **BUG 1:** Replaced `sessions = {}` with SQLite. Sessions survive `uvicorn --reload` and serverless cold starts. Verified with `importlib.reload()` simulation test.
- **BUG 2:** `evaluate_answer()` calls `call_llm_for_evaluation()` before every follow-up. Returns `{judgment, reasoning, next_action, follow_up_instruction}`. Injected into system prompt via `build_follow_up_prompt()`. `_heuristic_evaluate()` handles LLM-unavailable case using tool-name keyword matching (not generic word overlap). 4/4 assertion tests pass.
- Added `GET /api/sessions` and enriched `/api/health` to expose `active_sessions` count for debugging.

---

### Phase 13: Evaluation Depth, Topic State Machine & Breeth Memory Fix
**Prompt:**
> Round 1 fixes partially landed: the interviewer now flags weak answers. But three issues remain, confirmed from a live transcript (Sarah Johnson, sess-178620181):
>
> ISSUE 1: Evaluation is checking length/vagueness, not topical relevance. Across 4 turns, EVERY candidate answer was about the wrong topic entirely — Day 7 (Embeddings) was answered with vector-DB content, Day 8 (Vector Databases) was answered with session-memory content. The interviewer's responses never say "that's not what I asked." Fix: eval prompt must include the topic's real objectives and instruct the LLM to check TOPICAL RELEVANCE first. Off-topic replies must NAME the mismatch directly.
>
> ISSUE 2: "Follow-ups" are actually just the next day in the queue. Every single turn advances to the next day (7→8→10→12) regardless of whether the previous answer was accepted or rejected. Fix: the state machine must NOT advance current_topic_index just because a turn happened. Advance only when the LLM's evaluation judges the topic adequately covered OR the per-topic follow-up cap is hit (2 rejected attempts → advance + mark gap).
>
> ISSUE 3: Breeth memory panel shows "No memories yet" after real Q&A exchanges happened. Diagnosed: Breeth write_episode is async (propagates ~15s), so searching in the same request always finds nothing. Also source_node/target_node are raw UUIDs — unreadable in the panel.

**Files Modified:**
- `/backend/interview_engine.py`
- `/backend/llm_client.py`

**Core Accomplishments:**

**ISSUE 1 — Topical relevance in evaluation:**
- `evaluate_answer()` system prompt now opens with `"The question was about: '{topic_name}'"` and includes all curriculum objectives for that day — not just 3.
- Instructs LLM: "Your FIRST job is topical relevance — does the answer discuss the SAME SUBJECT?" When off-topic, `follow_up_instruction` **must name the actual mismatch** (e.g., "That answer described session state management, not vector database metadata filtering. Re-ask...").
- User message to evaluator includes `"THIS QUESTION IS ABOUT: {topic_name}"`.
- Heuristic `_heuristic_evaluate()` now checks `hit_ratio < 0.10` **before** `word_count < 15` — short off-topic answers flagged `off_topic` + `call_out_and_reask`, not `on_topic_vague`.

**ISSUE 2 — Topic state machine:**
- `start_session()` adds `current_topic_idx=0`, `topic_attempts=0`, `MAX_TOPIC_ATTEMPTS=2` to every session.
- `process_turn()` only advances `current_topic_idx` when `judgment == "on_topic_strong"` OR `topic_attempts >= 2`. On rejection: increments counter, prepends `"STAY ON Day N (Title)."` to follow-up instruction.
- Cap-exceeded topics recorded in `session["topic_gaps"]` and surfaced in final feedback.
- `build_follow_up_prompt()` now includes current day name, attempt counter (`e.g., 1/2`), and explicit `"NEVER advance to a new topic unless instructed above"` rule in every LLM system prompt.

**ISSUE 3 — Breeth memory panel populated:**
- Root cause confirmed via direct API test: `write_episode` returns 200 with `"mode": "async"` — graph edges queryable only ~15s later.
- Fix: search query changed from `"{name} {current_topic}"` (same-turn, empty) to `"{name} AI interview"` (broad, finds all prior turns).
- `source_node`/`target_node` UUID labels replaced: `source_node = candidate_name`, `target_node = first 3 words of fact string` — readable chip labels in memory panel.
- Explicit `[Breeth]` log lines added before/after both write and search for network failure visibility.

---

## 🚀 Live Deployment Checklist
- [x] Public GitHub Repository: `https://github.com/priyanshubuild/BitForgeXABTalks`
- [x] AI Usage Log: [`PROMPTS.md`](./PROMPTS.md) & [`AI_USAGE_LOG.md`](./AI_USAGE_LOG.md)
- [x] Backend API: `POST /api/interview` & `GET /health` & `GET /api/sessions` (port 8001)
- [x] React Single Page Application with client fallbacks ready for Vercel/Netlify deployment (port 3001)
- [x] Free LLM: Google Gemini 2.0 Flash (no cost) → Gemini 1.5 Flash fallback → Anthropic Claude → offline simulation
- [x] Memory Layer: Breeth API (`POST /v1/episodes`, `POST /v1/search`) with async-aware search timing
- [x] Session Persistence: SQLite (`backend/sessions.db`) — survives hot-reload and serverless cold starts
- [x] Evaluation Pipeline: LLM topical judgment → topic state machine → explicit mismatch naming
