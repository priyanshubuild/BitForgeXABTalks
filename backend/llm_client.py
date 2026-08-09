import os
import json
import re
import requests
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv, find_dotenv

# Load .env from project root (handles Vercel's differing CWD)
_dotenv_path = find_dotenv(usecwd=True) or find_dotenv(
    filename=".env",
    raise_error_if_not_found=False,
)
if _dotenv_path:
    load_dotenv(_dotenv_path, override=False)
else:
    # On Vercel, env vars come from the dashboard — no .env file needed
    load_dotenv(override=False)

# -- Model Config -------------------------------------------------------------
GEMINI_MODEL    = os.getenv("GEMINI_MODEL",  "gemini-2.5-flash")
GROQ_MODEL      = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
# -- Gemini Client ------------------------------------------------------------
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[LLM] WARNING: GEMINI_API_KEY is not set. AI features will be disabled (simulation mode).")
        return None
    print(f"[LLM] Gemini REST client ready with model: {GEMINI_MODEL}")
    return api_key
def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    print(f"[LLM] Groq backup client ready with model: {GROQ_MODEL}")
    return api_key


def _call_groq(api_key: str, model_name: str, system_prompt: str, messages: List[Dict], max_tokens: int, temperature: float):
    """Helper: run one Groq model call via its OpenAI-compatible REST API."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    chat_messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m["role"], "content": m["content"]} for m in messages
    ]
    payload = {
        "model": model_name,
        "messages": chat_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"].strip()



def _call_gemini(genai, model_name: str, system_prompt: str, messages: List[Dict], max_tokens: int, temperature: float):
    """Helper: run one Gemini model call via REST API. Returns raw text or raises."""
    api_key = genai  # now holds the API key string
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    contents = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]}
        for m in messages
    ]
    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
    }
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


# -- Main LLM Call (with simulation fallback) ---------------------------------
def call_llm(system_prompt: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Tries Gemini first (primary + 1.5-flash fallback), then simulation.
    """
    import time
    genai = get_gemini_client()
    if genai:
        for model_name in [GEMINI_MODEL, "gemini-2.5-flash-lite"]:
            for attempt in range(2):
                try:
                    raw = _call_gemini(genai, model_name, system_prompt, messages, 1400, 0.75)
                    parsed = parse_llm_json(raw)
                    if parsed is None:
                        return {"reply": raw, "is_complete": False, "day_covered": None, "feedback": None}
                    if isinstance(parsed, dict) and isinstance(parsed.get("reply"), str):
                        return parsed
                    print(f"Gemini returned an invalid interview schema ({model_name}); trying fallback.")
                    break
                except Exception as e:
                    print(f"Gemini API Exception ({model_name}, attempt {attempt+1}): {e}")
                    if "quota" in str(e).lower() or "429" in str(e):
                        time.sleep(2)
                        continue
                    break
        groq_key = get_groq_client()
    if groq_key:
        try:
            raw = _call_groq(groq_key, GROQ_MODEL, system_prompt, messages, 1400, 0.75)
            parsed = parse_llm_json(raw)
            if parsed is None:
                return {"reply": raw, "is_complete": False, "day_covered": None, "feedback": None}
            if isinstance(parsed, dict) and isinstance(parsed.get("reply"), str):
                return parsed
        except Exception as e:
            print(f"Groq API Exception: {e}")

    return simulate_llm_response(system_prompt, messages)  
          
# -- Evaluation-specific LLM Call (NO simulation fallback) --------------------
def call_llm_for_evaluation(system_prompt: str, messages: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """
    Like call_llm but NEVER falls back to the simulation engine.

    Used exclusively by evaluate_answer() so a simulation-generated interview
    question is never mistaken for a structured evaluation response.
    Returns None if Gemini is unavailable -- caller uses heuristic fallback.
    """
    genai = get_gemini_client()
    if genai:
        for model_name in [GEMINI_MODEL, "gemini-2.5-flash-lite"]:
            try:
                raw = _call_gemini(genai, model_name, system_prompt, messages, 600, 0.3)
                parsed = parse_llm_json(raw)
                if isinstance(parsed, dict):
                    return parsed
                print(f"Gemini returned invalid evaluation JSON ({model_name}); trying fallback.")
                continue
            except Exception as e:
                print(f"Gemini eval exception ({model_name}): {e}")
                if "quota" in str(e).lower() or "429" in str(e):
                    continue
                break

    print("[Evaluator] Gemini is unavailable -- local heuristic will be used instead.")
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


def _parse_evaluation_block(system_prompt: str) -> Optional[Dict[str, str]]:
    """Extract evaluator judgment from augmented system prompt (offline mode)."""
    if "EVALUATOR JUDGMENT" not in system_prompt:
        return None
    block = {}
    patterns = {
        "judgment": r"Answer quality:\s*(\S+)",
        "reasoning": r"Reasoning:\s*(.+?)(?:\nRequired|\nSpecific|\nMANDATORY|$)",
        "next_action": r"Required next action:\s*(\S+)",
        "instruction": r"Specific instruction:\s*(.+?)(?:\n\nMANDATORY|\n===|$)",
        "topic": r"Current topic being tested:\s*Day\s+(\d+)\s*—\s*(.+?)(?:\n|$)",
    }
    for key, pat in patterns.items():
        m = re.search(pat, system_prompt, re.DOTALL | re.IGNORECASE)
        if m:
            block[key] = m.group(1).strip() if key != "topic" else (m.group(1).strip(), m.group(2).strip())
    return block if block else None


def _simulation_reply_from_evaluation(
    eval_block: Dict[str, Any],
    candidate_name: str,
    last_user_msg: str,
) -> Tuple[str, str]:
    """Build interviewer reply from parsed evaluation verdict (offline mode)."""
    topic_tuple = eval_block.get("topic")
    day_num, day_title = topic_tuple if topic_tuple else ("?", "this topic")
    judgment_raw = (eval_block.get("judgment") or "ON_TOPIC_VAGUE").lower()
    instruction = eval_block.get("instruction") or ""
    reasoning = eval_block.get("reasoning") or ""

    if "insufficient" in judgment_raw or "reject" in (eval_block.get("next_action") or ""):
        prefix = (
            f"**Verdict: Insufficient** — your answer doesn't give me enough to evaluate "
            f"Day {day_num} ({day_title}). "
        )
        if reasoning:
            prefix += f"{reasoning.strip()} "
        suffix = instruction or (
            f"Please answer specifically: what did you implement or learn for **{day_title}**, "
            "including the tools you used and one concrete tradeoff?"
        )
        return prefix + suffix, "insufficient"

    if "off_topic" in judgment_raw or "wrong" in judgment_raw:
        prefix = f"**Verdict: Off-Topic** — that response doesn't address Day {day_num} ({day_title}). "
        if reasoning:
            prefix += f"{reasoning.strip()} "
        suffix = instruction or (
            f"Let's refocus on **{day_title}**: walk me through the core concept and "
            "how you'd apply it in a production RAG or chatbot pipeline."
        )
        return prefix + suffix, "off_topic" if "off_topic" in judgment_raw else "wrong"

    if "vague" in judgment_raw:
        prefix = "**Verdict: Insufficient depth** — you're on the right topic but I need more specificity. "
        suffix = instruction or (
            f"For **Day {day_num} ({day_title})**, name the exact tools, configuration, "
            "or code pattern you used — not just the high-level idea."
        )
        return prefix + suffix, "on_topic_vague"

    # Strong / adequate — probe deeper or advance
    if "advance" in (instruction or "").lower() or "next topic" in (instruction or "").lower():
        advance_match = re.search(r"Day\s+(\d+)\s*—\s*([^\n.]+)", instruction)
        if advance_match:
            nd, nt = advance_match.group(1), advance_match.group(2).strip()
            return (
                f"Good — that covers **{day_title}** adequately. "
                f"Moving to **Day {nd} — {nt}**: "
                f"{candidate_name}, describe your approach to this topic and the hardest decision you made.",
                "on_topic_strong",
            )
    return (
        f"Solid point on **{day_title}**. One level deeper: "
        f"what edge case or failure mode would break your approach first, and how would you fix it?",
        "on_topic_strong",
    )

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


def _fallback_evaluate_answer(answer: str, day_title: str) -> Dict[str, str]:
    """
    Even in simulation mode, evaluate the quality of answers.
    Returns a judgment + feedback prefix for the next response.
    """
    a_lower = answer.strip().lower()
    word_count = len(answer.strip().split())

    # Check for skip / don't know responses
    skip_phrases = [
        "skip", "i don't know", "i dont know", "no idea", "pass",
        "not sure", "don't know", "dont know", "skip this",
        "no clue", "can't answer", "cant answer", "idk",
    ]
    for phrase in skip_phrases:
        if phrase in a_lower:
            return {
                "judgment": "skipped",
                "prefix": f"You indicated you're unsure about this topic. That's noted as a gap. ",
            }

    # Check for extremely brief or empty answers
    if word_count < 8:
        return {
            "judgment": "too_brief",
            "prefix": f"That answer was too brief ({word_count} words) to evaluate meaningfully. I'm marking this as insufficient. ",
        }

    # Check for off-topic: does the answer mention ANY relevant keyword from the day title?
    title_words = set(w.lower() for w in re.findall(r'[a-zA-Z]{4,}', day_title))
    title_words.discard("and")  # remove common words
    hits = sum(1 for tw in title_words if tw in a_lower)
    if title_words and hits == 0 and word_count < 40:
        return {
            "judgment": "off_topic",
            "prefix": f"Your answer doesn't appear to address the topic ({day_title}). ",
        }

    # Surface-level answer
    if word_count < 25:
        return {
            "judgment": "vague",
            "prefix": "Your answer is on the right track but lacks specific implementation details. ",
        }

    # Decent answer
    if word_count < 60:
        return {
            "judgment": "adequate",
            "prefix": "",
        }

    # Detailed answer — offline heuristic cannot verify factual correctness,
    # so cap at "adequate" and flag it for human review instead of auto-passing.
    return {
        "judgment": "adequate",
        "prefix": "⚠️ Graded offline (keyword/length check only — not verified for correctness). ",
    }


def simulate_llm_response(system_prompt: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Offline fallback used when Gemini is unavailable.

    This path now evaluates answers for quality and can FAIL weak responses.
    Responses are clearly labeled as offline simulation mode.
    """
    if "expert ai technical evaluator" in system_prompt.lower():
        candidate_name = _extract_candidate_name(system_prompt)
        # Analyze the conversation to build actual feedback
        user_msgs = [m for m in messages if m.get("role") == "user"]
        total_words = sum(len(m.get("content", "").split()) for m in user_msgs)
        avg_words = total_words / len(user_msgs) if user_msgs else 0

        # Count actual skip/brief answers
        weak_count = 0
        for m in user_msgs:
            content = m.get("content", "").lower()
            wc = len(content.split())
            if wc < 15 or any(p in content for p in ["don't know", "dont know", "skip", "no idea", "not sure", "idk"]):
                weak_count += 1

        if weak_count > len(user_msgs) * 0.5:
            summary = f"{candidate_name} struggled with most topics, providing insufficient or skipped answers for {weak_count} out of {len(user_msgs)} questions. Significant gaps in curriculum understanding detected."
            strengths = ["Participated in the full interview session.",
                         "Showed willingness to attempt topics despite uncertainty."]
            gaps = [f"Could not provide substantive answers for {weak_count} questions.",
                    "Responses lacked technical specificity and implementation details.",
                    "Several core curriculum topics appear unmastered."]
        else:
            summary = f"{candidate_name} participated in a structured technical interview. Average response depth was {'adequate' if avg_words > 30 else 'below expectations'}."
            strengths = ["Engaged with multiple curriculum topic areas.",
                         "Provided responses spanning early and late-stage days."]
            gaps = ["Several areas would benefit from a more concrete hands-on walkthrough.",
                    "A few responses could be strengthened with explicit architecture details."]

        return {
            "summary": summary + " ⚠️ Note: this evaluation was generated in offline mode without AI analysis.",
            "strengths": strengths,
            "gaps": gaps,
            "next": [
                "Review the skipped or weaker curriculum days and practice explaining them aloud.",
                "Re-run the interview with a live LLM backend for fully adaptive evaluation."
            ]
        }

    candidate_name = _extract_candidate_name(system_prompt)
    target_days = _extract_target_days(system_prompt)
    user_messages = [m for m in messages if m.get("role") == "user"]
    turn_index = max(0, len(user_messages) - 1)
    last_user_msg = user_messages[-1].get("content", "") if user_messages else ""

    # When interview_engine injected an evaluator verdict, honour it in offline mode
    eval_block = _parse_evaluation_block(system_prompt)
    if eval_block and last_user_msg:
        reply, answer_judgment = _simulation_reply_from_evaluation(
            eval_block, candidate_name, last_user_msg
        )
        topic_tuple = eval_block.get("topic")
        day_num = int(topic_tuple[0]) if topic_tuple else (target_days[0][0] if target_days else 7)
        return {
            "reply": reply + "\n\n_Offline mode — connect GEMINI_API_KEY for full AI evaluation._",
            "is_complete": False,
            "day_covered": day_num,
            "answer_judgment": answer_judgment,
            "feedback": None,
        }

    day_num, day_title = target_days[turn_index % len(target_days)] if target_days else (7, "Embeddings Explained")

    # Evaluate the user's last answer (if any)
    answer_judgment = "first_question"
    response_prefix = ""
    if last_user_msg:
        eval_result = _fallback_evaluate_answer(last_user_msg, day_title)
        answer_judgment = eval_result["judgment"]
        response_prefix = eval_result["prefix"]

    if turn_index >= 7:
        # Analyze all answers before generating final feedback
        judgments = []
        for i, umsg in enumerate(user_messages):
            d_idx = i % len(target_days) if target_days else 0
            d_title = target_days[d_idx][1] if target_days else "Unknown"
            j = _fallback_evaluate_answer(umsg.get("content", ""), d_title)
            judgments.append(j["judgment"])

        weak = sum(1 for j in judgments if j in ("skipped", "too_brief", "off_topic"))
        strong = sum(1 for j in judgments if j in ("strong", "adequate"))

        closing = f"That concludes this interview session, {candidate_name}. "
        if weak > strong:
            closing += f"⚠️ I noted significant gaps — {weak} of your {len(judgments)} responses were insufficient or off-topic. Please review the curriculum topics thoroughly."
        else:
            closing += "Thank you for your responses. Your answers demonstrated reasonable engagement with the topics."
        closing += "\n\n_Note: This was an offline evaluation. Connect the LLM backend for fully adaptive AI-powered interviewing._"

        return {
            "reply": closing,
            "is_complete": True,
            "day_covered": day_num,
            "answer_judgment": answer_judgment,
            "feedback": None,  # feedback generated separately by generate_feedback_with_retry
        }

    # Build the next question with evaluation prefix
    question = _build_fallback_question(day_num, day_title, candidate_name, turn_index, last_user_msg)

    if answer_judgment in ("skipped", "too_brief"):
        question = response_prefix + "Let's move on. " + question
    elif answer_judgment == "off_topic":
        question = response_prefix + "I'll re-focus. " + question
    elif answer_judgment == "vague":
        question = response_prefix + question

    return {
        "reply": question,
        "is_complete": False,
        "day_covered": day_num,
        "answer_judgment": answer_judgment,
        "feedback": None,
    }
