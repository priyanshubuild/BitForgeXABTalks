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
def _extract_candidate_name(system_prompt: str) -> str:
    match = re.search(r"Name:\s*(.+)", system_prompt)
    if match:
        return match.group(1).strip()
    return "Candidate"


def _extract_target_days(system_prompt: str) -> List[Tuple[int, str]]:
    matches = re.findall(r"Day\s+(\d+)\s*:\s*([^\n]+)", system_prompt)
    if not matches:
        return [(7, "Embeddings Explained")]
    days = [(int(day), title.strip()) for day, title in matches if title.strip()]
    if not days:
        return [(7, "Embeddings Explained")]
    return days[:6]


def _build_fallback_question(day_num: int, day_title: str, candidate_name: str, turn_index: int, last_user_msg: str) -> str:
    title_lower = day_title.lower()
    if "vector" in title_lower or "database" in title_lower:
        base = f"{candidate_name}, let's focus on Day {day_num} — {day_title}. In a production RAG system, how would you decide between metadata filtering and vector similarity search, and what tradeoffs would you expect at scale?"
    elif "prompt" in title_lower:
        base = f"{candidate_name}, for Day {day_num} — {day_title}, walk me through the prompt pattern you would use to get structured outputs reliably, including how you would handle ambiguity or hallucination."
    elif "retrieval" in title_lower or "matching" in title_lower:
        base = f"{candidate_name}, on Day {day_num} — {day_title}, describe how you would route a query between SQL lookup, vector search, and hybrid retrieval, and how you would evaluate the result quality."
    elif "mcp" in title_lower.lower() or "protocol" in title_lower:
        base = f"{candidate_name}, for Day {day_num} — {day_title}, explain why a standardized tool interface matters in practice and how you would use it to make agent workflows more reusable."
    elif "docker" in title_lower or "deploy" in title_lower or "kubernetes" in title_lower:
        base = f"{candidate_name}, on Day {day_num} — {day_title}, describe the deployment safeguards you would add for a FastAPI LLM service, including health checks, readiness probes, and graceful rollouts."
    else:
        base = f"{candidate_name}, for Day {day_num} — {day_title}, tell me about the implementation decision you would make first and the tradeoff you considered most carefully."

    if turn_index > 0:
        if len((last_user_msg or "").split()) < 20:
            return base + " Give me a concrete example rather than a high-level summary."
        return base + " Focus on one concrete failure mode or edge case."
    return base


def simulate_llm_response(system_prompt: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Offline fallback used ONLY when both Gemini and Anthropic are unavailable.

    This path now remains curriculum-aware and produces specific, interview-like questions.
    It also returns a structured feedback object when the caller is generating final feedback.
    """
    if "expert ai technical evaluator" in system_prompt.lower():
        candidate_name = _extract_candidate_name(system_prompt)
        return {
            "summary": f"{candidate_name} participated in a structured technical interview and responded across several AI Cohort topics.",
            "strengths": [
                "Demonstrated willingness to discuss implementation decisions and tradeoffs.",
                "Engaged with multiple curriculum days rather than giving a single generic answer."
            ],
            "gaps": [
                "Several areas would benefit from a more concrete hands-on walkthrough.",
                "A few responses could be strengthened with explicit architecture and validation details."
            ],
            "next": [
                "Review the skipped or weaker curriculum days and practice explaining them aloud.",
                "Re-run the interview with a stronger real-world example for each topic."
            ]
        }

    candidate_name = _extract_candidate_name(system_prompt)
    target_days = _extract_target_days(system_prompt)
    user_messages = [m for m in messages if m.get("role") == "user"]
    turn_index = max(0, len(user_messages) - 1)
    last_user_msg = user_messages[-1].get("content", "") if user_messages else ""

    day_num, day_title = target_days[turn_index % len(target_days)] if target_days else (7, "Embeddings Explained")
    question = _build_fallback_question(day_num, day_title, candidate_name, turn_index, last_user_msg)

    if turn_index >= 7:
        return {
            "reply": f"That concludes the structured fallback interview. {candidate_name}, your responses were coherent and consistent enough to reach the end of the session, but the strongest version of this experience needs a live LLM backend for real-time evaluation.",
            "is_complete": True,
            "day_covered": day_num,
            "feedback": {
                "summary": f"{candidate_name} completed a structured offline interview path and discussed several technical topics in a practical way.",
                "strengths": [
                    "Stayed engaged with the interview flow across multiple topics.",
                    "Provided enough detail to show a solid technical framing."
                ],
                "gaps": [
                    "The interview would be more valuable with deeper topic-specific probing.",
                    "Hands-on implementation evidence would strengthen the assessment."
                ],
                "next": [
                    "Practice explaining one project in depth for each target curriculum day.",
                    "Reconnect the backend with an LLM provider for fully adaptive questioning."
                ]
            }
        }

    return {
        "reply": question,
        "is_complete": False,
        "day_covered": day_num,
        "feedback": None,
    }
