# AI Usage Log & Development History 📜🤖

This document serves as the log for prompts and design decisions made using **Antigravity** to build the AI Interview Agent system.

---

## 🏗️ Phase 1: Project Scaffolding
*In this phase, we read the technical specifications, curriculum structures, and candidate mocks to scaffold the React frontend and FastAPI backend.*

### Prompt Used
> *(Paste the prompt you used to generate the initial folders and health-check endpoints here)*

### Files Created / Modified
- `/backend/main.py`
- `/backend/schemas.py`
- `requirements.txt`
- `.env.example`

### Core Accomplishments
- Set up a FastAPI server with CORS middleware enabled.
- Defined schemas for input payloads and target outputs matching the specs.
- Established health-check monitoring routes.

---

## 🧠 Phase 2: Engine Logic & Target Day Selection
*In this phase, we implemented candidate evaluation target day selectors and in-memory session mapping.*

### Prompt Used
> *(Paste the prompt you used to build session managers and curriculum selection code here)*

### Files Created / Modified
- `/backend/interview_engine.py`
- `/backend/llm_client.py`

### Core Accomplishments
- Designed the algorithm that selects 4–5 target days based on the candidate's passed and skipped missions.
- Managed session data using in-memory Python dictionaries with thread-safe access.

---

## ⚡ Phase 3: Dialogue Engine & Prompt Engineering
*In this phase, we integrated the Anthropic SDK with prompt directives that enforce turn metrics and dynamic follow-up questioning.*

### Prompt Used
> *(Paste the prompt used to refine system prompts and connect Claude models here)*

### Files Created / Modified
- `/backend/llm_client.py`
- `/backend/interview_engine.py`

### Core Accomplishments
- Engineered the core technical system prompt specifying constraints (behaving like a senior interviewer).
- Enforced the hard minimum count constraint (8 questions and 4 days covered) in code before terminating sessions.
- Created fallback simulators for offline evaluation testing.

---

## 🎨 Phase 4: Primary Dashboard Frontend
*In this phase, we built the visual dashboard containing statistics, radars, message streams, and feedback modals.*

### Prompt Used
> *(Paste the prompt used to design the premium React layout here)*

### Files Created / Modified
- `/src/App.jsx`
- `/src/components/Header.jsx`
- `/src/components/CandidateSidebar.jsx`
- `/src/components/ChatStream.jsx`
- `/src/components/FeedbackModal.jsx`

### Core Accomplishments
- Built a premium glassmorphic dashboard in React 18 and Vite.
- Implemented requirement counters and progress visuals for interview status tracking.

---

## 🛠️ Phase 5: Port Resolution & Frontend Testing Client
*In this phase, we resolved system port overlaps, created a dedicated testing client inside `/frontend`, and refactored end-of-interview feedback endpoints.*

### Prompt Used
> *(Paste the final prompts used for port config changes, retry logic, and minimal chat runner implementation here)*

### Files Created / Modified
- `/src/App.jsx`
- `/frontend/src/App.jsx`
- `/frontend/vite.config.js`
- `/backend/interview_engine.py`

### Core Accomplishments
- Moved default connection endpoints to port `8001` to resolve local CUPS printer daemon overlaps on port `8000`.
- Built the minimal chat runner in `/frontend` running on port `3002` for fast testing and manual validations.
- Refactored the end-of-interview sequence to run a dedicated, schema-validated feedback LLM call with a 1-retry wrapper and a hard-coded fallback object on parsing crashes.

---

## 🐛 Phase 6: Critical Bug Fixes — Session Persistence & Evaluation Pipeline
*In this phase, we diagnosed and fixed two confirmed production bugs from a live test session (Sarah Johnson, sess-178620861): session state being wiped on hot-reload, and the interviewer echoing template strings instead of evaluating answers.*

### Prompts Used
> The interview agent has two confirmed bugs from a live test session (sess-178620861, candidate Sarah Johnson). Fix the root cause of each, don't paper over the symptom.
>
> BUG 1: Evaluation report says "Session not found" even though the same session was live and working seconds earlier in the chat UI.
> Is the session store a plain in-memory object/dict/Map at module scope? If the dev server uses hot-reload, any file saved resets module state and wipes the dict...
>
> BUG 2: The interviewer always generates "Good answer regarding [their words]..." follow-ups regardless of whether the answer was correct, off-topic, or vague. Fix so the LLM judges answers before generating follow-ups.

### Files Created / Modified
- `/backend/session_store.py` *(new — SQLite-backed session persistence)*
- `/backend/interview_engine.py` *(evaluate_answer(), build_follow_up_prompt(), SQLite wiring)*
- `/backend/llm_client.py` *(call_llm_for_evaluation(), gemini-1.5-flash fallback model)*
- `/backend/main.py` *(GET /api/sessions debug endpoint, active_sessions in health check)*
- `/backend/test_evaluator.py` *(new — 4-assertion test for evaluation pipeline)*
- `/src/App.jsx` *(removed "Good answer regarding..." echo-template from frontend simulation)*

### Core Accomplishments
- **BUG 1 Fixed:** Replaced `sessions = {}` module-scope dict with `backend/session_store.py` (SQLite). Sessions now survive hot-reloads and serverless cold starts. Missing sessions now raise `HTTPException(404)` instead of silently returning a fake report.
- **BUG 2 Fixed:** Added `evaluate_answer()` — calls LLM before every follow-up to judge: `on_topic_strong | on_topic_vague | off_topic | wrong`. Added `_heuristic_evaluate()` — keyword-overlap local fallback used when both LLMs are offline. Added `call_llm_for_evaluation()` — never falls back to simulation so garbled interview questions can't be mistaken for evaluation JSON.
- `build_follow_up_prompt()` injects evaluator judgment into system prompt, forcing LLM to react to the assessment.
- 4/4 assertion tests pass: off-topic answer → `off_topic` + `call_out_and_reask`; on-topic strong answer → `on_topic_strong`.
- Added `/api/sessions` debug endpoint to list active SQLite session IDs.

---

## 🔬 Phase 7: Evaluation Depth, Topic State Machine & Breeth Memory Fix
*In this phase, we fixed three remaining issues confirmed from a second live transcript (Sarah Johnson, sess-178620181): evaluation was checking length not topical relevance, follow-ups were advancing to the next day even when the current answer was rejected, and the Breeth memory panel showed "No memories yet" after real Q&A exchanges.*

### Prompts Used
> Round 1 fixes partially landed. Three issues remain confirmed from a live transcript:
>
> ISSUE 1: Evaluation is checking length/vagueness, not topical relevance. Every candidate answer was about the wrong topic entirely — the interviewer's responses never say "that's not what I asked" — only generic "need more depth" phrasing.
>
> ISSUE 2: "Follow-ups" are actually just the next day in the queue, not a real re-probe. Every single turn advances to the next day (7→8→10→12) regardless of whether the previous answer was accepted or rejected.
>
> ISSUE 3: Breeth memory panel shows "No memories yet" after real Q&A exchanges happened.

### Files Modified
- `/backend/interview_engine.py` *(eval prompt, topic state machine, Breeth search fix, heuristic ordering)*
- `/backend/llm_client.py` *(call_llm now tries gemini-2.0-flash → gemini-1.5-flash → Anthropic)*

### Core Accomplishments

**ISSUE 1 — Evaluation checks length not relevance:**
- `evaluate_answer()` system prompt now opens with `"The question was about: '{topic_name}'"` and includes all curriculum objectives for that day.
- Instructs LLM to check **topical relevance first** — if the answer discusses a different concept, the `follow_up_instruction` must name the mismatch explicitly (e.g., "That answer described session state management, not vector database metadata filtering").
- User message now includes `"THIS QUESTION IS ABOUT: {topic_name}"` so the LLM has zero ambiguity.
- Heuristic `_heuristic_evaluate()` now checks `hit_ratio < 0.10` **before** `word_count < 15` — short off-topic answers are correctly flagged `off_topic`, not `on_topic_vague`.

**ISSUE 2 — Topic state machine:**
- `start_session()` now stores `current_topic_idx=0`, `topic_attempts=0`, `MAX_TOPIC_ATTEMPTS=2` in session state.
- `process_turn()` implements the state machine: advance only when `judgment == "on_topic_strong"` OR `topic_attempts >= 2`. On rejection, increments counter and prepends `"STAY ON Day N (Title)."` to `follow_up_instruction`.
- `build_follow_up_prompt()` includes the current topic name, attempt counter (`1/2`), and explicit `"NEVER advance to a new topic unless instructed above"` rule in every LLM call.
- Topic gaps (cap-exceeded topics) recorded in `session["topic_gaps"]` and available for final feedback.

**ISSUE 3 — Breeth memory panel empty:**
- Root cause: Breeth `write_episode` returns HTTP 200 immediately but runs async (~15s propagation). Searching in the same request always finds nothing from the current turn.
- Fix: search query changed from `"{name} {current_topic}"` to `"{name} AI interview"` — broad query that retrieves facts from **all previous turns** (already propagated).
- `source_node`/`target_node` UUID labels replaced with `candidate_name` and first 3 words of the fact string — readable chip labels in the memory panel.
- Added explicit `[Breeth]` console logs before/after both write and search so network errors surface in server logs immediately.

---

## 🎨 Phase 8: Complete UI/UX Overhaul — Immersive Multi-Page Experience
*In this phase, we performed a complete frontend redesign: landing page, candidate selection grid, markdown-rendered chat, circular progress rings, and polished dark/light themes. All 20 hackathon candidates are now loaded.*

### Prompts Used
> Complete reform of the UI and UX. I want the most immersive and modern UI that doesn't feel like AI slop. Make dark and light mode both visually great. Load ALL 20 candidates. Add a landing page and candidate selection flow. Add markdown rendering. Redesign all components with premium aesthetics.

### Files Created / Modified
- `src/data/candidates.js` *(new — all 20 hackathon candidates + curriculum modules)*
- `src/index.css` *(complete rewrite — design system with landing, selection, interview styles)*
- `src/components/LandingPage.jsx` *(new — hero with animated stats, feature cards, tech badges)*
- `src/components/CandidateSelect.jsx` *(new — searchable grid with progress bars, hover CTAs)*
- `src/components/Header.jsx` *(rewritten — compact with back nav and candidate info)*
- `src/components/CandidateSidebar.jsx` *(rewritten — SVG circular progress rings)*
- `src/components/ChatStream.jsx` *(rewritten — react-markdown + remark-gfm rendering)*
- `src/components/FeedbackModal.jsx` *(polished — item count badges, tighter spacing)*
- `src/App.jsx` *(complete rewrite — 3-page navigation flow)*
- `README.md` *(rewritten — architecture diagram, requirements checklist)*

### Core Accomplishments
- **3-Page Navigation**: Landing → Candidate Selection → Interview, replacing single-page dropdown
- **All 20 Candidates**: Complete hackathon `candidates.json` loaded (was 4)
- **Immersive Landing**: Gradient hero, animated feature cards, tech badges, stat counters
- **Candidate Selection Grid**: Searchable cards with completion bars and mini stats
- **Markdown Chat**: `react-markdown` + `remark-gfm` for rich AI responses
- **SVG Progress Rings**: Animated circular stats in sidebar
- **CSS Design System**: Custom properties, glassmorphism, smooth dark/light transitions
- **Dependencies**: Added `react-markdown`, `remark-gfm`, `framer-motion`
