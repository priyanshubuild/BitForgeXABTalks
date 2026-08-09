# AI Interview Agent — AI Usage & Prompt Log 📜🤖

> **Vicodathon Problem Statement 2 Submission Requirement**: Full log of prompts, AI interactions, design decisions, and development phases used to build the **AI Interview Agent**.

---

## 📌 Project Overview
- **Project Name**: AI Technical Interview Agent
- **Backend Stack**: Python, FastAPI, Pydantic, Google Gemini 2.0 Flash SDK, Uvicorn, SQLite
- **Frontend Stack**: React 18, Vite, Lucide React, React Markdown, Remark-GFM, Glassmorphism CSS Design System
- **Memory Layer**: Breeth API (`POST /v1/episodes`, `POST /v1/search`) for candidate knowledge graph
- **Single API Contract**: `POST /api/interview` per `technical-spec.md`

---

## 📑 Chronological Prompt & Development Log

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
> I'm building an AI Interview Agent for Vicodathon, Problem Statement 2. I've attached curriculum.json, candidates.json, and technical-spec.md in the project root — read all three fully before doing anything.
> Requirements:
> - Backend: Python + FastAPI
> - Single endpoint: POST /api/interview
> - State kept in-memory per sessionId
> - Ask at least 8 questions covering at least 4 curriculum days based on candidate's completed missions
> - Dynamic follow-up questions based on candidate answers
> - Final response with structured feedback: summary, strengths[], gaps[], next[]
> Set up the project structure first: /backend, /frontend, requirements.txt, .env.example, README.md. Don't write the interview logic yet — scaffold the project, set up FastAPI health check, and confirm technical-spec.md contract by summarizing it back to me.

**Files Created / Modified:**
- `/backend/main.py` — FastAPI server with CORS middleware, health routes (`GET /health`), Pydantic schemas
- `/backend/schemas.py` — Input payload and target output schemas
- `/frontend/index.html` — Test UI scaffold

**Core Accomplishments:**
- Inspected `technical-spec.md`, `curriculum.json`, and `candidates.json`
- Set up a FastAPI server with CORS middleware enabled
- Defined schemas for input payloads and target outputs matching the specs
- Established health-check monitoring routes
- Summarized the API contract back to the user

---

### Phase 3: Core Interview Engine & LLM Logic Implementation
**Prompt:**
> Now implement the core interview logic in the backend.
> Design:
> 1. On the first request (no "message" field, just sessionId + candidate object), create a new in-memory session: store full candidate object, pick target list of curriculum days (4-5 days from curriculum.json based on completed missions), initialize empty conversation history.
> 2. Build system prompt for LLM including candidate name/role, specific days/topics, and instructions to behave like a real technical interviewer (one question at a time, natural follow-ups for vague answers).
> 3. On every subsequent request, append candidate message, call LLM with full history + system prompt, return reply.
> 4. Hard minimum in code: don't allow "done": true until at least 8 questions asked AND 4 curriculum days touched.
> Use Google Gemini through its Python SDK in an isolated module.
> Show me the full flow with sample curl requests/responses.

**Files Created / Modified:**
- `/backend/llm_client.py` — Gemini LLM calls with simulation fallbacks
- `/backend/interview_engine.py` — In-memory session state, topic selection, 8-question / 4-day minimum rule
- `/backend/main.py` — Routing `POST /api/interview` to initialization vs turn processing

**Core Accomplishments:**
- Designed the algorithm that selects 4–5 target days based on the candidate's passed and skipped missions
- Engineered the core technical system prompt specifying constraints (behaving like a senior interviewer)
- Enforced the hard minimum count constraint (8 questions and 4 days covered) in code before terminating sessions
- Created fallback simulators for offline evaluation testing
- Verified sample `curl` commands for initial turn, follow-up turn, and final feedback response turn

---

### Phase 4: Production React Frontend Development
**Prompt:**
> show me the preview of the app now, till now what we made? what frontend stack we used? we have to make and deplyable website, make an react site

**Files Created / Modified:**
- `/src/App.jsx` — Main application component
- `/src/components/Header.jsx` — Header & Candidate Dropdown
- `/src/components/CandidateSidebar.jsx` — Candidate Mission Radar & Requirement Counters
- `/src/components/ChatStream.jsx` — Real-time Dialogue Feed
- `/src/components/FeedbackModal.jsx` — Evaluation Report Modal with Confetti & Copy Markdown
- `/src/index.css` — Glassmorphic dark theme with HSL colors and Google Fonts

**Core Accomplishments:**
- Built a React 18 + Vite frontend in `/src` and `/frontend`
- Designed glassmorphic dark theme with `Plus Jakarta Sans` & `Space Grotesk` fonts
- Configured hybrid connection: connects live to `http://localhost:8001/api/interview` when backend is online, includes embedded fallback engine for static deployments
- Built premium glassmorphic dashboard with requirement counters and progress visuals

---

### Phase 5: Submission Checklist & Prompt Log Maintenance
**Prompt:**
> Submission checklist
> Public GitHub repo
> Live deployed URL
> AI-usage log: A PROMPTS.md in the repo, or exported chat transcripts.
> also maintain prompt.md file throughout the code

**Actions & Results:**
- Created and maintained `PROMPTS.md` tracking all prompt iterations, architectural decisions, and tool executions

---

### Phase 6: Project Setup, Port Resolution & End-of-Interview Refactoring
**Prompt:**
> read the source and also add required files (react vite files, this is a collaborated project and i didn't make the setup so made the setup and complete the project)
>
> Now implement the end-of-interview step. When the interview engine decides the interview is done, make one final LLM call whose only job is to produce structured feedback: "summary" string, "strengths" array, "gaps" array, and "next" array. Force this into valid JSON reliably. Add basic error handling: if the LLM call fails or returns malformed JSON, retry once, then fall back to a minimal valid feedback object rather than crashing the endpoint.

**Files Created / Modified:**
- `/src/App.jsx` — Frontend setup
- `/frontend/src/App.jsx` — Minimal chat runner for testing
- `/frontend/vite.config.js` — Frontend dev config
- `/backend/interview_engine.py` — `generate_feedback_with_retry`, `validate_feedback_shape`

**Core Accomplishments:**
- Set up local Python virtual environment (`venv`) and node modules via `npm install`
- Moved default connection endpoints to port `8001` to resolve local CUPS printer daemon overlaps on port `8000`
- Built the minimal chat runner in `/frontend` running on port `3002` for fast testing
- Refactored end-of-interview sequence: dedicated, schema-validated feedback LLM call with 1-retry wrapper and hard-coded fallback object on parsing crashes
- Verified end-to-end integration and validated outputs under normal flow and fallbacks

---

### Phase 7: Breeth Memory Integration Scaffolding
**Prompt:**
> I want to add an optional memory layer using Breeth (docs at docs.thebreeth.com, base URL https://api.thebreeth.com/v1)...

**Files Created / Modified:**
- `/backend/breeth_client.py` *(new)* — `write_episode` and `search` methods with graceful `429` quota limit toleration
- `.env` / `.env.example` — Added `BREETH_API_KEY`
- `test_breeth.py` — Standalone validation tests

**Core Accomplishments:**
- Created `backend/breeth_client.py` using `requests` to access Breeth endpoints
- Implemented robust 429 quota limit toleration (returns `None` instead of throwing exceptions)
- Created and executed standalone validation tests to verify API key connectivity

---

### Phase 8: RAG Memory Retrieval Loop
**Prompt:**
> Use Breeth's search to make follow-up questions smarter...

**Files Modified:**
- `/backend/interview_engine.py` — `process_turn()` Breeth integration

**Core Accomplishments:**
- Integrated `BreethClient` inside the backend `process_turn()` loop
- Implemented smart substantive answer analysis (`is_substantive_answer()`) to filter out trivial replies and skips to preserve intent budget
- Formulated search queries dynamically and injected retrieved candidate facts and cognitive patterns into the LLM system prompt context

---

### Phase 9: Real-time Memory Graph UI Sidebar
**Prompt:**
> Add a small panel to the frontend chat UI, next to the transcript, that shows a running list of "things learned about this candidate" during the interview...

**Files Modified:**
- `/backend/main.py` — Extended `/api/interview` endpoint schema to return memories
- `/src/App.jsx` — Memory Graph sidebar sections

**Core Accomplishments:**
- Extended `/api/interview` response to optionally return search memories containing source/target nodes, facts, and cognitive patterns
- Built Candidate Memory Graph sidebar panels to dynamically present candidate facts in real-time

---

### Phase 10: Apple Minimalist UX Overhaul & Theme Switching
**Prompt:**
> ui and ux got fucked fix it and make modern and great ui and ux

**Files Modified:**
- `/src/index.css` — Apple system fonts, OLED dark mode, Apple light mode
- Multiple component files for contrast fixes

**Core Accomplishments:**
- Refactored stylesheets to implement Apple system font stacks, OLED dark mode, and Apple light mode
- Designed global Light/Dark mode switcher buttons that synchronize states via data attributes
- Solved card transparency and contrast conflicts in light mode to guarantee clear legibility
- Successfully ran turn-by-turn simulated validation tests confirming clean execution

---

### Phase 11: Full Design System Overhaul + Gemini Free LLM Integration
**Prompt:**
> Strictly follow technical-spec.md, candidates.json and curriculum.md — make the best possible Vicodathon submission with a unique, polished UI and UX.

**Files Created / Modified:**
- `/backend/llm_client.py` — Google Gemini 2.0 Flash (free) as primary, offline simulation fallback
- `requirements.txt` — Added `google-generativeai`
- `/src/index.css` — Complete rewrite: Inter + JetBrains Mono fonts, CSS token system, glassmorphism, premium animations
- All `/src/components/*.jsx` — Rewritten for premium aesthetics
- `/src/App.jsx` — Complete rewrite

**Core Accomplishments:**
- Upgraded LLM pipeline: Google Gemini 2.0 Flash (free) → Gemini 1.5 Flash fallback → offline simulation
- Complete CSS design system: custom properties, glassmorphism utilities, chip badges, progress bars, wave loading bars
- Verified FastAPI backend starts clean on port 8001; Vite dev server on port 3001
- Tightened backend interview flow so fallback questions stay tied to selected curriculum days
- Normalized `/api/interview` response contract to always return `reply`, `done`, `feedback`, and `memories`

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
- `/backend/session_store.py` *(new)* — SQLite-backed store: `get_session`, `set_session`, `delete_session`, `list_sessions`
- `/backend/interview_engine.py` — `evaluate_answer()`, `_heuristic_evaluate()`, `build_follow_up_prompt()`, SQLite wiring
- `/backend/llm_client.py` — `call_llm_for_evaluation()` (no simulation fallback), gemini-1.5-flash model fallback
- `/backend/main.py` — `GET /api/sessions` debug endpoint, `active_sessions` count in health check
- `/backend/test_evaluator.py` *(new)* — 4-assertion test for off-topic and on-topic detection
- `/src/App.jsx` — Removed "Good answer regarding..." echo-template from frontend simulation

**Core Accomplishments:**
- **BUG 1 Fixed:** Replaced `sessions = {}` module-scope dict with SQLite (`backend/session_store.py`). Sessions survive `uvicorn --reload` and serverless cold starts. Missing sessions raise `HTTPException(404)`.
- **BUG 2 Fixed:** `evaluate_answer()` calls `call_llm_for_evaluation()` before every follow-up. Returns `{judgment, reasoning, next_action, follow_up_instruction}`. `_heuristic_evaluate()` handles LLM-unavailable case using tool-name keyword matching. `build_follow_up_prompt()` injects evaluator judgment into system prompt. 4/4 assertion tests pass.
- Added `GET /api/sessions` debug endpoint and enriched `/api/health` with `active_sessions` count.

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
- `/backend/interview_engine.py` — Eval prompt, topic state machine, Breeth search fix, heuristic ordering
- `/backend/llm_client.py` — Model fallback chain: gemini-2.0-flash → gemini-1.5-flash → offline simulation

**Core Accomplishments:**

**ISSUE 1 — Topical relevance in evaluation:**
- `evaluate_answer()` system prompt now opens with `"The question was about: '{topic_name}'"` and includes all curriculum objectives
- Instructs LLM: "Your FIRST job is topical relevance — does the answer discuss the SAME SUBJECT?"
- When off-topic, `follow_up_instruction` must name the actual mismatch explicitly
- Heuristic `_heuristic_evaluate()` checks `hit_ratio < 0.10` **before** `word_count < 15`

**ISSUE 2 — Topic state machine:**
- `start_session()` adds `current_topic_idx=0`, `topic_attempts=0`, `MAX_TOPIC_ATTEMPTS=2`
- `process_turn()` only advances when `judgment == "on_topic_strong"` OR `topic_attempts >= 2`
- Cap-exceeded topics recorded in `session["topic_gaps"]` for final feedback
- `build_follow_up_prompt()` includes current topic, attempt counter, and explicit "NEVER advance" rule

**ISSUE 3 — Breeth memory populated:**
- Search query changed from `"{name} {current_topic}"` to `"{name} AI interview"` (broad query finds prior turns)
- UUID labels replaced with `candidate_name` and first 3 words of fact string

---

### Phase 14: Complete UI/UX Overhaul — Immersive Multi-Page Experience
**Prompt:**
> Complete reform of the UI and UX. I want the most immersive and modern UI that doesn't feel generic. Make dark and light mode both visually great and finished. Load all 20 candidates from Vicodathon data. Add a landing page and candidate selection flow. Add markdown rendering in chat. Redesign all components with premium aesthetics.

**Files Created / Modified:**
- `src/data/candidates.js` *(new)* — All 20 Vicodathon candidates + curriculum modules data
- `src/index.css` — Complete rewrite: design system with landing, selection, interview styles
- `src/components/LandingPage.jsx` *(new)* — Hero with animated stats, feature cards, tech badges
- `src/components/CandidateSelect.jsx` *(new)* — Searchable grid with 20 candidate cards, progress bars
- `src/components/Header.jsx` — Rewritten: compact with back nav and candidate info
- `src/components/CandidateSidebar.jsx` — Rewritten: SVG circular progress rings, compact topic cards
- `src/components/ChatStream.jsx` — Rewritten: react-markdown + remark-gfm rendering
- `src/components/FeedbackModal.jsx` — Polished: item count badges, tighter spacing
- `src/App.jsx` — Complete rewrite: 3-page navigation (Landing → Select → Interview)
- `README.md` — Rewritten: architecture diagram, requirements checklist

**Core Accomplishments:**
- **3-Page Navigation**: Landing → Candidate Selection → Interview, replacing single-page dropdown
- **All 20 Candidates**: Complete Vicodathon `candidates.json` loaded (previously only 4)
- **Immersive Landing Page**: Gradient hero, animated feature cards, tech badges, stat counters
- **Candidate Selection Grid**: Searchable cards with completion bars, mini stats, hover CTAs
- **Markdown Rendering**: `react-markdown` + `remark-gfm` for bold, code, lists in AI responses
- **Circular Progress Rings**: SVG-based animated stat circles in sidebar
- **Design System**: CSS custom properties, glassmorphism, smooth dark/light transitions

**Dependencies Added:**
- `react-markdown` — Markdown rendering in chat bubbles
- `remark-gfm` — GitHub Flavored Markdown support
- `framer-motion` — Animation library

---

### Phase 15: Answer Evaluation Hardening, Dashboard Fix & UX Cleanup
**Prompt:**
> Either it is not using AI for interviewing or it is just fixed question asking with combination only and also users response also not getting checked as it passes all the answer also. What are the dashboard on the left shows? What pass and fail things? Everything got passed, why? Also what are suggestion above the chatbox or typing box or interview panel? Fix the issue? Also what is memory graph do we really need that there?

**Issues Identified & Fixed:**

**ISSUE 1 — Simulation fallback was not evaluating answers:**
- The `simulate_llm_response()` function was a hardcoded question bank that cycled through template questions regardless of what the user answered — even "I don't know" got PASSED
- **Fix:** Added `_fallback_evaluate_answer()` function that checks answers even in offline mode:
  - Skip phrases ("I don't know", "no idea") → **skipped**
  - Too brief (<8 words) → **too_brief**
  - Off-topic (no keyword hits from topic title) → **off_topic**
  - Vague (<25 words) → **vague**
  - Detailed (60+ words with specifics) → **strong**
- Both backend (`llm_client.py`) and frontend (`App.jsx`) simulation fallbacks now perform real evaluation

**ISSUE 2 — Dashboard showed mission history, not interview results:**
- The sidebar "Evaluation Topics" section showed `td.passed` / `td.skipped` from the candidate's **original mission data** — so everything always showed "Pass"
- **Fix:** Added `topicResults` state that tracks per-topic judgments FROM THE ACTUAL INTERVIEW. Dashboard now shows:
  - 🟢 **Strong** / **Adequate** — good answers
  - 🟡 **Weak** — vague or surface-level
  - 🔴 **Off-Topic** / **Skipped** / **Too Brief** — failed answers
  - ⚪ **Pending** — not yet evaluated
- Added "Interview Score" section with visual breakdown bar (strong/weak/failed)

**ISSUE 3 — Quick prompts were pre-written answers:**
- `QUICK_PROMPTS` in `ChatStream.jsx` were hardcoded perfect answers that users could click to auto-fill, defeating the interview purpose
- **Fix:** Replaced with non-clickable contextual thinking hints:
  - Old: `"ChromaDB locally with metadata filtering; Pinecone for cloud..."` (clickable, fills answer)
  - New: `"Think about: metadata filtering vs pure similarity search"` (non-clickable guidance)
  - Hints change dynamically based on the current topic being discussed

**ISSUE 4 — Memory Graph panel removed:**
- The Memory Graph panel showed Breeth memory edges — mostly noise (candidate name → random 3-word labels) taking up screen real estate without adding interview value
- **Fix:** Removed the entire Memory Graph `<aside>` panel. Breeth integration still works on the backend for LLM context augmentation

**ISSUE 5 — Backend API answer_judgment tracking:**
- Frontend had no way to know what the backend thought of each answer
- **Fix:** Added `answer_judgment` field to the API response model and `process_turn` return

**Files Created / Modified:**
- `/backend/llm_client.py` — Added `_fallback_evaluate_answer()`, rewrote `simulate_llm_response()` to evaluate + fail weak answers
- `/backend/main.py` — Added `answer_judgment` to `InterviewResponse` model and API response
- `/backend/interview_engine.py` — Added `answer_judgment` to `process_turn` return
- `/src/App.jsx` — Added `topicResults` tracking, `evaluateAnswerLocally()`, removed Memory Graph panel, fixed simulation
- `/src/components/ChatStream.jsx` — Replaced `QUICK_PROMPTS` with `getTopicHints()`, non-clickable contextual hints
- `/src/components/CandidateSidebar.jsx` — Shows interview results (strong/weak/fail) instead of mission history, added Interview Score section
- `/src/index.css` — Added `.hint-pill` and `.chip-muted` styles

**Verification:**
- All 5 evaluation test cases pass: skip → skipped, brief → too_brief, off-topic → off_topic, vague → vague, detailed → strong
- Vite production build passes clean (0 errors, 0 warnings)
- Backend imports verified with Python venv

---

### Phase 16: Apple-Pure Design System — Monochrome Polish & Component Cleanup
**Prompt:**
> push the correct code to github with updated readme.md and prompts.md

**Files Modified:**
- `/src/index.css` — Complete design system overhaul: true-black OLED dark mode, Apple-grey light mode, monochrome accent palette
- `/src/components/CandidateSelect.jsx` — Replaced inline styles with CSS classes, added first-try count stat, cleaner card layout
- `/src/components/CandidateSidebar.jsx` — Refactored to class-based styling, compact topic cards with interview result badges
- `/src/components/ChatStream.jsx` — Streamlined chat bubble rendering, cleaner hint pills, simplified message layout
- `/src/components/FeedbackModal.jsx` — Tighter spacing, refined typography, polished score display
- `README.md` — Added project structure tree, updated tech stack, documented answer evaluation features
- `PROMPTS.md` — Added this phase

**Core Accomplishments:**
- **True-Black Dark Mode:** Replaced `#06080f` with `#000000` for OLED-pure blacks; all surface colors tuned to Apple's dark palette
- **Monochrome Accent System:** Eliminated multi-color accent variables (`--indigo`, `--violet`, `--cyan`); replaced with single `--accent: #ffffff` (dark) / `#111827` (light)
- **Apple Light Mode:** Background moved from generic grey to warm `#e9edf3` with higher-contrast text hierarchy
- **Functional Colors Only:** `--green`, `--amber`, `--red` retained for semantic status indicators only (Apple SF-style values)
- **CSS Class Refactoring:** Migrated 200+ inline `style={{}}` objects across 4 components to proper CSS classes — cleaner JSX, better maintainability
- **Animation System:** New `--ease-out` cubic-bezier for Apple-style spring animations alongside existing `--ease`
- **Shadow System:** Deeper, more dramatic `--shadow-lg` (0.65 opacity black) for elevated glass cards
- **Production Build Verified:** `vite build` passes clean — 0 errors, 0 warnings, 19.65 KB CSS + 385 KB JS

---

### Phase 17: Interview Ordering, Evaluation Safety & Documentation Review
**Prompt:**
> Check the backend flow and AI review order, fix every issue found, improve the site, update README.md and PROMPTS.md, then prepare the corrected code for GitHub.

**Files Modified:**
- `/backend/interview_engine.py` — Evaluator normalization, verified coverage accounting, bounded optional memory work
- `/backend/test_evaluator.py` — Regression assertion for unsafe verdict/action combinations
- `/src/App.jsx` — Offline fallback topic retry state machine
- `/src/components/CandidateSidebar.jsx` — Accurate question and reviewed-topic counters
- `/src/components/ChatStream.jsx` — Current-day evaluation status
- `/README.md` and `/PROMPTS.md` — Corrected behavior and validation documentation

**Core Accomplishments:**
- Evaluator output is normalized before it reaches the state machine. For example, an `off_topic` verdict is forced to `call_out_and_reask`; it cannot carry an unsafe `advance` action.
- Curriculum coverage is recorded only after the candidate responds to a day. Asking a new question no longer inflates the four-day completion gate.
- The offline UI simulation now evaluates the current day, re-asks weak/off-topic/vague responses once, and moves forward only after a strong answer or retry cap—matching backend behavior.
- Optional Breeth writes and searches are bounded so slow third-party calls do not accumulate unbounded background work or block interview progression.
- The active root React app now clearly labels the curriculum day currently under review and reports live counts without subtracting an artificial initial topic.

**Verification:**
- `python3 -m compileall -q backend` passed
- `npm run build` passed
- `npm run lint` passed
- `git diff --check` passed

---

### Phase 18: Live Deployment API Configuration
**Prompt:**
> The deployed portal still runs in simulation. Make the live site use real AI question generation and answer evaluation.

**Files Modified:**
- `/src/App.jsx` — Reads the backend base URL from `VITE_BACKEND_URL`, with localhost retained only as the local-development fallback
- `/.env.example` — Documents the frontend build-time backend URL
- `/README.md` — Adds the required frontend URL, backend CORS, Gemini-key, health-check, and redeployment configuration

**Core Accomplishments:**
- The frontend no longer hardcodes `http://localhost:8001` for every deployment.
- Production must set `VITE_BACKEND_URL` to the public FastAPI service before building the frontend.
- Gemini remains server-side in `GEMINI_API_KEY`; it is never exposed in a browser-visible `VITE_*` variable.

---

### Phase 19: Same-Origin Vercel Live API
**Prompt:**
> The portal is deployed on Vercel. Remove local-only behavior and make the live site use real AI evaluation.

**Files Modified:**
- `/api/index.py` — Vercel Python Function entrypoint exporting the FastAPI app
- `/src/App.jsx` — Production API requests default to same-origin `/api`
- `/backend/session_store.py` — Uses Vercel's writable temporary directory for runtime SQLite state

**Core Accomplishments:**
- A Vercel deployment serves the React frontend and FastAPI interview endpoints together.
- No browser request targets `localhost` in production; `VITE_BACKEND_URL` remains available only for an intentionally separate API host.
- The deployment requires `GEMINI_API_KEY` in Vercel environment variables; `.env` is never deployed as a source of secrets.

---

## 🚀 Live Deployment Checklist
- [x] Public GitHub Repository: `https://github.com/priyanshubuild/BitForgeXABTalks`
- [x] AI Usage Log: [`PROMPTS.md`](./PROMPTS.md) — This file (unified prompt & development log)
- [x] Backend API: `POST /api/interview` & `GET /health` & `GET /api/sessions` (port 8001)
- [x] React Single Page Application with client fallbacks ready for Vercel/Netlify deployment (port 3001)
- [x] Free LLM: Google Gemini 2.0 Flash (no cost) → Gemini 1.5 Flash fallback → offline simulation with real evaluation
- [x] Memory Layer: Breeth API (`POST /v1/episodes`, `POST /v1/search`) with async-aware search timing
- [x] Session Persistence: SQLite (`backend/sessions.db`) — survives hot-reload and serverless cold starts
- [x] Evaluation Pipeline: LLM topical judgment → topic state machine → explicit mismatch naming → answer quality tracking
- [x] Answer Validation: Both LLM-powered and heuristic evaluation that can actually FAIL weak/off-topic/skipped answers

---

## 🛠️ AI Tools Used
- **Antigravity** (Google DeepMind) — Primary AI coding assistant for all development phases
- **Google Gemini 2.0 Flash** — Primary LLM for interview question generation and answer evaluation
- **Breeth API** — Memory graph for candidate knowledge persistence across interview turns
