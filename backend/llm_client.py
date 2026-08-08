import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# ── Model Config ──────────────────────────────────────────────────────────────
GEMINI_MODEL   = os.getenv("GEMINI_MODEL",    "gemini-2.0-flash")
ANTHROPIC_MODEL = os.getenv("LLM_MODEL",      "claude-3-5-sonnet-20241022")

# ── Gemini Client ─────────────────────────────────────────────────────────────
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

# ── Anthropic Client ──────────────────────────────────────────────────────────
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

# ── Main Call ─────────────────────────────────────────────────────────────────
def call_llm(system_prompt: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Tries Gemini first (free tier), then Anthropic, then simulation fallback.
    """
    # ---- Try Gemini (free tier) ----
    genai = get_gemini_client()
    if genai:
        try:
            model = genai.GenerativeModel(
                model_name=GEMINI_MODEL,
                system_instruction=system_prompt,
                generation_config={
                    "temperature": 0.75,
                    "max_output_tokens": 1400,
                }
            )

            # Build Gemini chat history (parts format)
            history = []
            for msg in messages[:-1]:
                history.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]]
                })

            last_msg = messages[-1]["content"] if messages else "Begin."

            chat = model.start_chat(history=history)
            response = chat.send_message(last_msg)
            raw_text = response.text.strip()

            parsed = parse_llm_json(raw_text)
            if parsed:
                return parsed
            return {"reply": raw_text, "is_complete": False, "day_covered": None, "feedback": None}

        except Exception as e:
            print(f"Gemini API Exception: {e}. Trying Anthropic…")

    # ---- Try Anthropic ----
    client = get_anthropic_client()
    if client:
        try:
            formatted_messages = [
                {"role": "user" if m["role"] == "user" else "assistant", "content": m["content"]}
                for m in messages
            ]
            response = client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=1400,
                temperature=0.75,
                system=system_prompt,
                messages=formatted_messages
            )
            raw_text = response.content[0].text.strip()
            parsed = parse_llm_json(raw_text)
            if parsed:
                return parsed
            return {"reply": raw_text, "is_complete": False, "day_covered": None, "feedback": None}

        except Exception as e:
            print(f"Anthropic API Exception: {e}. Using simulation engine.")

    # ---- Fallback simulation ----
    return simulate_llm_response(system_prompt, messages)


# ── JSON Parser ────────────────────────────────────────────────────────────────
def parse_llm_json(text: str) -> Optional[Dict[str, Any]]:
    """Attempts to extract and parse JSON object from LLM response text."""
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


# ── Simulation Engine (offline fallback) ──────────────────────────────────────
def simulate_llm_response(system_prompt: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    High-quality local simulation engine for offline/demo use.
    Mirrors a realistic technical interview progression.
    """
    user_msg_count = sum(1 for m in messages if m["role"] == "user")
    last_user_msg  = messages[-1]["content"] if messages else ""

    questions = [
        (7,  "Day 7 – Embeddings",
              "Welcome! Let's start with vector embeddings. On Day 7 you explored how text is converted into dense vectors. Walk me through how you chose your chunking strategy and distance metric — and what tradeoffs you considered."),
        (8,  "Day 8 – Vector Databases",
              "Good. Moving to Day 8 on Vector Databases — ChromaDB vs Pinecone. In a production setting, how do you handle metadata filtering alongside vector similarity search to avoid returning irrelevant results?"),
        (12, "Day 12 – Prompt Engineering",
              "Thanks for that. Day 12 covered Prompt Engineering fundamentals. Have you used Chain-of-Thought or Few-Shot prompting to enforce structured LLM outputs? Walk me through a concrete example from your project."),
        (10, "Day 10 – Retrieval Engine",
              "Interesting. On Day 10 you built a Retrieval & Matching Engine. How did your query router decide between SQL lookup, vector search, and hybrid retrieval — and how did you evaluate retrieval quality?"),
        (16, "Day 16 – Chatbot API",
              "Great. Day 16 was about Chatbot Backend & API Integration with FastAPI. How did you manage session state across multiple turns and prevent token-window exhaustion during long conversations?"),
        (22, "Day 22 – Multi-Agent",
              "Excellent. Day 22 focused on Multi-Agent Orchestration using CrewAI or LangGraph. How did you design your router agent to delegate tasks without creating infinite loops or redundant tool calls?"),
        (23, "Day 23 – MCP",
              "Day 23 covered the Model Context Protocol. What advantages does exposing tools via a standardized MCP server give you over custom REST endpoints — especially around interoperability and tool discovery?"),
        (28, "Day 28 – Deployment",
              "Final question: Day 28 was Docker & Kubernetes Deployment. What readiness probes and health checks did you configure for your FastAPI LLM backend container, and how did you handle rolling restarts?"),
    ]

    # Inject memory context if present
    fact_mention = ""
    if "### RETRIEVED CANDIDATE FACTS" in system_prompt:
        for line in system_prompt.split("\n"):
            if line.strip().startswith("- Fact:"):
                fact_raw = line.replace("- Fact:", "").strip()
                fact_raw = re.sub(r'\(Cognitive Pattern:.*?\)', '', fact_raw).strip()
                fact_mention = f" [Memory context: '{fact_raw[:60]}…']"
                break

    if user_msg_count < len(questions):
        day_num, _, q_text = questions[user_msg_count]
        prefix = f"Thank you for that. " if last_user_msg else ""
        final_reply = f"{prefix}{q_text}{fact_mention}"
        return {"reply": final_reply, "is_complete": False, "day_covered": day_num, "feedback": None}

    # Interview complete
    return {
        "reply": "That concludes our technical evaluation. Thank you for walking me through your learning journey — it's been a genuinely insightful conversation.",
        "is_complete": True,
        "day_covered": 31,
        "feedback": {
            "summary": "The candidate demonstrated strong foundational knowledge across vector search, prompt engineering, API integration, and multi-agent orchestration — with clear evidence of hands-on implementation depth.",
            "strengths": [
                "Solid grasp of vector embeddings, chunking strategies, and ChromaDB metadata filtering",
                "Practical FastAPI session management and context-window handling experience",
                "Clear understanding of multi-agent routing and MCP tool standardization benefits"
            ],
            "gaps": [
                "Could elaborate further on container observability probes and rolling-restart handling (Day 28–29)",
                "Token cost optimization metrics and retrieval precision tuning deserve more depth"
            ],
            "next": [
                "Explore hybrid BM25 + dense re-ranking (Cohere Rerank / BGE) for RAG optimization",
                "Implement OpenTelemetry distributed tracing across FastAPI + multi-agent workflows"
            ]
        }
    }
