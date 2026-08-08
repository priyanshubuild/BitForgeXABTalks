import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# -- Model Config -------------------------------------------------------------
GEMINI_MODEL    = os.getenv("GEMINI_MODEL",  "gemini-2.0-flash")
ANTHROPIC_MODEL = os.getenv("LLM_MODEL",     "claude-3-5-sonnet-20241022")

# -- Gemini Client ------------------------------------------------------------
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        return genai
    except Exception as e:
        print(f"Warning: Could not initialize Gemini client: {e}")
        return None

# -- Anthropic Client ---------------------------------------------------------
def get_anthropic_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=api_key)
    except Exception as e:
        print(f"Warning: Could not initialize Anthropic client: {e}")
        return None


def _call_gemini(genai, model_name: str, system_prompt: str, messages: List[Dict], max_tokens: int, temperature: float):
    """Helper: run one Gemini model call. Returns raw text or raises."""
    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_prompt,
        generation_config={
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
    )
    history = []
    for msg in messages[:-1]:
        history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]]
        })
    last_msg = messages[-1]["content"] if messages else "Begin."
    chat = model.start_chat(history=history)
    response = chat.send_message(last_msg)
    return response.text.strip()


def _call_anthropic(client, model_name: str, system_prompt: str, messages: List[Dict], max_tokens: int, temperature: float):
    """Helper: run one Anthropic call. Returns raw text or raises."""
    formatted = [
        {"role": "user" if m["role"] == "user" else "assistant", "content": m["content"]}
        for m in messages
    ]
    response = client.messages.create(
        model=model_name,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system_prompt,
        messages=formatted
    )
    return response.content[0].text.strip()


# -- Main LLM Call (with simulation fallback) ---------------------------------
def call_llm(system_prompt: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Tries Gemini first (primary + 1.5-flash fallback), then Anthropic, then simulation.
    """
    genai = get_gemini_client()
    if genai:
        for model_name in [GEMINI_MODEL, "gemini-1.5-flash"]:
            try:
                raw = _call_gemini(genai, model_name, system_prompt, messages, 1400, 0.75)
                parsed = parse_llm_json(raw)
                return parsed if parsed else {"reply": raw, "is_complete": False, "day_covered": None, "feedback": None}
            except Exception as e:
                print(f"Gemini API Exception ({model_name}): {e}")
                if "quota" in str(e).lower() or "429" in str(e):
                    continue   # Try next Gemini model
                break          # Non-quota error, try Anthropic

    client = get_anthropic_client()
    if client:
        try:
            raw = _call_anthropic(client, ANTHROPIC_MODEL, system_prompt, messages, 1400, 0.75)
            parsed = parse_llm_json(raw)
            return parsed if parsed else {"reply": raw, "is_complete": False, "day_covered": None, "feedback": None}
        except Exception as e:
            print(f"Anthropic API Exception: {e}. Using simulation engine.")

    return simulate_llm_response(system_prompt, messages)


# -- Evaluation-specific LLM Call (NO simulation fallback) --------------------
def call_llm_for_evaluation(system_prompt: str, messages: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """
    Like call_llm but NEVER falls back to the simulation engine.

    Used exclusively by evaluate_answer() so a simulation-generated interview
    question is never mistaken for a structured evaluation response.
    Returns None if both real LLMs are unavailable -- caller uses heuristic fallback.
    """
    genai = get_gemini_client()
    if genai:
        for model_name in [GEMINI_MODEL, "gemini-1.5-flash"]:
            try:
                raw = _call_gemini(genai, model_name, system_prompt, messages, 600, 0.3)
                parsed = parse_llm_json(raw)
                return parsed  # May be None if parse fails -- that's OK
            except Exception as e:
                print(f"Gemini eval exception ({model_name}): {e}")
                if "quota" in str(e).lower() or "429" in str(e):
                    continue
                break

    client = get_anthropic_client()
    if client:
        try:
            raw = _call_anthropic(client, ANTHROPIC_MODEL, system_prompt, messages, 600, 0.3)
            parsed = parse_llm_json(raw)
            return parsed
        except Exception as e:
            print(f"Anthropic eval exception: {e}")

    print("[Evaluator] Both LLMs unavailable -- local heuristic will be used instead.")
    return None


# -- JSON Parser --------------------------------------------------------------
def parse_llm_json(text: str) -> Optional[Dict[str, Any]]:
    """Attempts to extract and parse a JSON object from LLM response text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    match_obj = re.search(r'(\{[\s\S]*\})', text)
    if match_obj:
        try:
            return json.loads(match_obj.group(1))
        except json.JSONDecodeError:
            pass

    return None


# -- Simulation Engine (offline fallback) -------------------------------------
def simulate_llm_response(system_prompt: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Offline fallback used ONLY when both Gemini and Anthropic are unavailable.

    IMPORTANT: This path cannot perform real answer evaluation since there is no LLM.
    It must NOT echo the candidate's words back as a template, and must NOT unconditionally
    advance through questions regardless of answer quality.

    The simulation:
    - Asks predefined curriculum questions for the first turns
    - For follow-ups, uses depth-probing questions that don't reference the candidate's words
    - Clearly labels offline mode in its responses so users know evaluation is not active
    """
    user_msg_count = sum(1 for m in messages if m["role"] == "user")
    last_user_msg  = messages[-1]["content"] if messages else ""

    # Fixed curriculum questions for the opening turns
    questions = [
        (7,  "Day 7 - Embeddings",
              "[OFFLINE MODE - LLM unavailable] Let's start with vector embeddings. On Day 7 you explored how text is converted into dense vectors. Walk me through how you chose your chunking strategy and distance metric -- and what tradeoffs you considered."),
        (8,  "Day 8 - Vector Databases",
              "[OFFLINE MODE] Moving to Day 8 on Vector Databases -- ChromaDB vs Pinecone. In a production setting, how do you handle metadata filtering alongside vector similarity search to avoid returning irrelevant results?"),
        (12, "Day 12 - Prompt Engineering",
              "[OFFLINE MODE] Day 12 covered Prompt Engineering fundamentals. Have you used Chain-of-Thought or Few-Shot prompting to enforce structured LLM outputs? Walk me through a concrete example from your project."),
        (10, "Day 10 - Retrieval Engine",
              "[OFFLINE MODE] On Day 10 you built a Retrieval & Matching Engine. How did your query router decide between SQL lookup, vector search, and hybrid retrieval -- and how did you evaluate retrieval quality?"),
        (16, "Day 16 - Chatbot API",
              "[OFFLINE MODE] Day 16 was about Chatbot Backend & API Integration with FastAPI. How did you manage session state across multiple turns and prevent token-window exhaustion during long conversations?"),
        (22, "Day 22 - Multi-Agent",
              "[OFFLINE MODE] Day 22 focused on Multi-Agent Orchestration using CrewAI or LangGraph. How did you design your router agent to delegate tasks without creating infinite loops or redundant tool calls?"),
        (23, "Day 23 - MCP",
              "[OFFLINE MODE] Day 23 covered the Model Context Protocol. What advantages does exposing tools via a standardized MCP server give you over custom REST endpoints -- especially around interoperability and tool discovery?"),
        (28, "Day 28 - Deployment",
              "[OFFLINE MODE] Day 28 was Docker & Kubernetes Deployment. What readiness probes and health checks did you configure for your FastAPI LLM backend container, and how did you handle rolling restarts?"),
    ]

    # Opening question (no prior user message)
    if user_msg_count == 0:
        day_num, _, q_text = questions[0]
        return {"reply": q_text, "is_complete": False, "day_covered": day_num, "feedback": None}

    # Follow-up turns -- cannot evaluate the answer; probe deeper without echoing it
    word_count = len(last_user_msg.strip().split())
    is_brief   = word_count < 20

    if user_msg_count < len(questions):
        day_num, _, next_q = questions[user_msg_count]
        if is_brief:
            brief_note = (
                f"[OFFLINE MODE -- Note: your answer was quite brief ({word_count} words). "
                f"In a live session the interviewer would cross-examine that. Continuing...]\n\n"
            )
            return {"reply": brief_note + next_q, "is_complete": False, "day_covered": day_num, "feedback": None}
        return {"reply": next_q, "is_complete": False, "day_covered": day_num, "feedback": None}

    # Interview complete (offline)
    return {
        "reply": "[OFFLINE MODE] That concludes the offline simulation. Note: answer quality was not evaluated since the LLM backend was unavailable. Please start the backend and retry for a real adaptive evaluation.",
        "is_complete": True,
        "day_covered": 31,
        "feedback": {
            "summary": "OFFLINE SIMULATION -- This report was generated without LLM evaluation. Answer content was not assessed for correctness, relevance, or depth. Restart with the backend running for a real evaluation.",
            "strengths": [
                "Candidate completed the offline interview flow.",
                "Responses were provided across multiple curriculum topics."
            ],
            "gaps": [
                "Real answer evaluation was not available -- this report is not meaningful for assessment.",
                "Start the backend server to get adaptive questioning and real feedback."
            ],
            "next": [
                "Run: uvicorn backend.main:app --reload --port 8001 and retry for a real evaluation.",
                "Ensure GEMINI_API_KEY or ANTHROPIC_API_KEY is set in your .env file."
            ]
        }
    }
