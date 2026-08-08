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
