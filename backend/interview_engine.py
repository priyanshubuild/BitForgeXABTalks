import json
import os
import re
from typing import Dict, Any, List, Set, Tuple, Optional
from backend.llm_client import call_llm
from backend.breeth_client import BreethClient

# Initialize Breeth memory layer
breeth_client = BreethClient()

def is_substantive_answer(answer: str) -> bool:
    """
    Checks if the candidate's answer is substantive (longer than a couple
    sentences or 15 words, and doesn't contain a skip/dont know pattern).
    """
    cleaned = answer.strip().lower()
    
    # Filter out trivial skips/don't know responses
    skip_phrases = [
        "skip", "i don't know", "i dont know", "no idea", "pass", 
        "not sure", "don't know", "dont know", "skip this"
    ]
    for phrase in skip_phrases:
        if phrase in cleaned and len(cleaned) < 25:
            return False
            
    # Substantive if word count is > 15 or we have at least 2 sentences
    sentences = [s for s in re.split(r'[.!?]+', cleaned) if s.strip()]
    if len(sentences) >= 2 or len(cleaned.split()) > 15:
        return True
        
    return False

# Load curriculum.json from project root
CURRICULUM_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "curriculum.json")

def load_curriculum() -> Dict[str, Any]:
    try:
        with open(CURRICULUM_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading curriculum.json: {e}")
        return {"days": [], "modules": []}

CURRICULUM_DATA = load_curriculum()

# In-memory session store
sessions: Dict[str, Dict[str, Any]] = {}

def select_target_days(candidate: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Selects 4 to 6 target curriculum days based on candidate's completed/skipped missions.
    Prioritizes passed days across different modules, plus probes skipped/failed days.
    """
    missions = candidate.get("missions", [])
    mission_map = {m["day"]: m for m in missions}
    
    curriculum_days = {d["day"]: d for d in CURRICULUM_DATA.get("days", [])}
    
    passed_days = [m for m in missions if m.get("passed") is True]
    skipped_days = [m for m in missions if m.get("skipped") is True or m.get("passed") is False]
    
    selected_day_nums = []
    
    # 1. Pick 3 to 4 distinct passed days evenly spaced across curriculum modules
    if passed_days:
        # Sort by day number
        passed_days_sorted = sorted(passed_days, key=lambda x: x["day"])
        step = max(1, len(passed_days_sorted) // 4)
        for i in range(0, len(passed_days_sorted), step):
            d_num = passed_days_sorted[i]["day"]
            if d_num not in selected_day_nums:
                selected_day_nums.append(d_num)
            if len(selected_day_nums) >= 4:
                break
                
    # 2. Pick at least 1 skipped or probed day to evaluate gaps carefully
    for s_mission in skipped_days:
        if s_mission["day"] not in selected_day_nums:
            selected_day_nums.append(s_mission["day"])
            break

    # Fill up to 5 days if needed from curriculum
    if len(selected_day_nums) < 4:
        for m in missions:
            if m["day"] not in selected_day_nums:
                selected_day_nums.append(m["day"])
            if len(selected_day_nums) >= 4:
                break

    target_days = []
    for d_num in selected_day_nums:
        c_day = curriculum_days.get(d_num, {"day": d_num, "title": f"Day {d_num}", "objectives": [], "tools": []})
        m_info = mission_map.get(d_num, {})
        target_days.append({
            "day": d_num,
            "title": c_day.get("title", f"Day {d_num}"),
            "tools": c_day.get("tools", []),
            "objectives": c_day.get("objectives", []),
            "passed": m_info.get("passed", False),
            "skipped": m_info.get("skipped", False),
            "attempts": m_info.get("attempts", 1)
        })

    return target_days


def build_system_prompt(candidate: Dict[str, Any], target_days: List[Dict[str, Any]]) -> str:
    """
    Constructs a comprehensive system prompt guiding the LLM interviewer behavior.
    """
    member = candidate.get("member", {})
    name = member.get("name", "Candidate")
    role = member.get("jobRole", "Software Engineer")
    exp = member.get("yearsExperience", 0)
    edu = member.get("education", "")

    target_days_text = ""
    for td in target_days:
        status_str = "PASSED" if td["passed"] else ("SKIPPED (Probe carefully!)" if td["skipped"] else "FAILED")
        target_days_text += f"- Day {td['day']}: {td['title']} | Status: {status_str} | Attempts: {td['attempts']}\n"
        target_days_text += f"  Tools: {', '.join(td['tools'])}\n"
        target_days_text += f"  Objectives: {'; '.join(td['objectives'][:2])}\n"

    prompt = f"""You are an expert AI Technical Interviewer conducting a live evaluation for the AI Cohort Hackathon.

Candidate Profile:
- Name: {name}
- Current Role: {role}
- Experience: {exp} years
- Education: {edu}

Target Curriculum Topics to Cover in this Interview:
{target_days_text}

Interviewer Guidelines:
1. Conduct a natural, interactive technical interview. Speak directly to {name}.
2. Ask ONE question at a time.
3. If an answer is vague, brief, or missing technical details, ask a dynamic follow-up to check true depth.
4. Adapt your questions based on their mission history:
   - For PASSED days: Ask deep conceptual or architectural questions to verify real mastery.
   - For SKIPPED or failed days: Gently probe why it was skipped or ask fundamental questions to check if they have equivalent knowledge.
5. You must cover at least 4 distinct curriculum days across the conversation.
6. The interview MUST last at least 8 question turns before finishing.
7. Return EVERY response in JSON format matching this EXACT schema:

{{
  "reply": "Your message/question to the candidate",
  "is_complete": false,
  "day_covered": 7,
  "feedback": null
}}

When (and only when) the interview is complete (after at least 8 questions & 4 days covered), set "is_complete": true and provide the feedback block:
{{
  "reply": "Thank you for your time today! That concludes our technical interview.",
  "is_complete": true,
  "day_covered": null,
  "feedback": {{
    "summary": "Clear 2-3 sentence overview of candidate performance",
    "strengths": ["Actionable strength 1", "Actionable strength 2"],
    "gaps": ["Actionable gap 1", "Actionable gap 2"],
    "next": ["Actionable next step 1", "Actionable next step 2"]
  }}
}}
"""
    return prompt


def start_session(session_id: str, candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initializes a new interview session.
    """
    target_days = select_target_days(candidate)
    system_prompt = build_system_prompt(candidate, target_days)

    initial_user_prompt = [
        {
            "role": "user",
            "content": f"The candidate {candidate['member']['name']} has joined the interview. Please welcome them and ask your first technical question."
        }
    ]

    llm_res = call_llm(system_prompt, initial_user_prompt)

    day_num = llm_res.get("day_covered") or (target_days[0]["day"] if target_days else 1)

    sessions[session_id] = {
        "candidate": candidate,
        "target_days": target_days,
        "system_prompt": system_prompt,
        "messages": [
            {"role": "assistant", "content": llm_res["reply"]}
        ],
        "questions_asked": 1,
        "days_covered": {day_num}
    }

    return {
        "reply": llm_res["reply"],
        "done": False
    }


def process_turn(session_id: str, user_message: str) -> Dict[str, Any]:
    """
    Processes a candidate's turn in an existing session.
    """
    if session_id not in sessions:
        # Gracefully handle missing session by initializing minimal fallback or error
        return {
            "reply": "Session expired or not found. Please start a new interview session.",
            "done": True,
            "feedback": {
                "summary": "Session not found.",
                "strengths": [],
                "gaps": [],
                "next": ["Re-initialize interview session."]
            }
        }

    session = sessions[session_id]

    # 1. Retrieve candidate name and last question before updating history
    candidate_name = session["candidate"]["member"]["name"]
    last_question = ""
    if session["messages"]:
        for msg in reversed(session["messages"]):
            if msg["role"] == "assistant":
                last_question = msg["content"]
                break

    # 2. Format Breeth Episode Summary
    day_match = re.search(r"Day\s*(\d+)", last_question, re.IGNORECASE)
    day_num = int(day_match.group(1)) if day_match else None
    
    topic = ""
    if day_num:
        for d in CURRICULUM_DATA.get("days", []):
            if d.get("day") == day_num:
                topic = d.get("topic", "")
                break
                
    day_topic_str = f"Day {day_num}"
    if topic:
        day_topic_str += f" ({topic})"
    elif not day_num:
        day_topic_str = "General technical evaluation"

    episode_content = (
        f"Candidate Name: {candidate_name}\n"
        f"Topic Asked About: {day_topic_str}\n"
        f"Interviewer Question: {last_question}\n"
        f"Candidate Answer: {user_message}"
    )

    # Determine if substantive for extract_intent
    substantive = is_substantive_answer(user_message)
    
    # 3. Call Breeth Client (additive layer - errors won't break the flow)
    try:
        # group_id=sessionId to isolate session memories
        res_episode = breeth_client.write_episode(
            content=episode_content,
            group_id=session_id,
            extract_intent=substantive
        )
        if res_episode:
            ep_name = res_episode.get("episode_name", "N/A")
            extracted = res_episode.get("extracted", {})
            ent_count = extracted.get("entities", 0)
            edge_count = extracted.get("edges", 0)
            print(f"[Breeth Log] Episode '{ep_name}' written successfully. Extracted entities: {ent_count}, edges: {edge_count}")
        else:
            print("[Breeth Log] write_episode returned None (possibly due to 429 rate limit or config error).")
    except Exception as breeth_err:
        print(f"[Breeth Log] Failed to write episode to Breeth: {breeth_err}")

    session["messages"].append({"role": "user", "content": user_message})

    llm_res = call_llm(session["system_prompt"], session["messages"])

    reply_text = llm_res.get("reply", "Could you elaborate further on your approach?")
    is_complete = llm_res.get("is_complete", False)
    day_covered = llm_res.get("day_covered")

    if day_covered:
        session["days_covered"].add(day_covered)

    session["questions_asked"] += 1
    session["messages"].append({"role": "assistant", "content": reply_text})

    # HARD ENFORCEMENT: Enforce minimum 8 questions AND 4 distinct days covered
    questions_asked = session["questions_asked"]
    days_covered_count = len(session["days_covered"])

    if is_complete and (questions_asked < 8 or days_covered_count < 4):
        # Prevent premature ending!
        is_complete = False
        # Append instruction to continue questioning
        remaining_days = [d["day"] for d in session["target_days"] if d["day"] not in session["days_covered"]]
        next_day = remaining_days[0] if remaining_days else session["target_days"][0]["day"]
        
        prompt_continuation = f"\n\nLet me ask you another question to dig deeper into Day {next_day}."
        reply_text += prompt_continuation
        session["messages"][-1]["content"] = reply_text

    if is_complete:
        feedback_obj = generate_feedback_with_retry(session)
        return {
            "reply": reply_text,
            "done": True,
            "feedback": feedback_obj
        }
    else:
        return {
            "reply": reply_text,
            "done": False
        }


def validate_feedback_shape(res: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(res, dict):
        return None
        
    feedback_obj = None
    if all(k in res for k in ["summary", "strengths", "gaps", "next"]):
        feedback_obj = res
    elif "feedback" in res and isinstance(res["feedback"], dict):
        feedback_obj = res["feedback"]
        
    if feedback_obj and all(k in feedback_obj for k in ["summary", "strengths", "gaps", "next"]):
        if (isinstance(feedback_obj["summary"], str) and
            isinstance(feedback_obj["strengths"], list) and
            isinstance(feedback_obj["gaps"], list) and
            isinstance(feedback_obj["next"], list)):
            return {
                "summary": feedback_obj["summary"],
                "strengths": [str(s) for s in feedback_obj["strengths"]],
                "gaps": [str(g) for g in feedback_obj["gaps"]],
                "next": [str(n) for n in feedback_obj["next"]]
            }
    return None


def generate_feedback_with_retry(session: Dict[str, Any]) -> Dict[str, Any]:
    system_prompt = """You are an expert AI Technical Evaluator. Your job is to analyze the conversation history of a technical interview and generate structured feedback.

Return a JSON object matching this EXACT schema:
{
  "summary": "A 2-3 sentence overview of candidate performance, communication style, and technical depth.",
  "strengths": [
    "Actionable strength 1 (e.g. strong understanding of ChromaDB metadata filtering)",
    "Actionable strength 2"
  ],
  "gaps": [
    "Actionable gap 1 (e.g. struggled to explain Docker container readiness probes)",
    "Actionable gap 2"
  ],
  "next": [
    "Concrete study/practice suggestion 1 tied to specific curriculum days the candidate struggled on or skipped",
    "Concrete study/practice suggestion 2"
  ]
}

Ensure all arrays contain concise, actionable points. Output ONLY valid JSON."""

    messages = session["messages"]

    # Try 1
    try:
        res = call_llm(system_prompt, messages)
        validated = validate_feedback_shape(res)
        if validated:
            return validated
    except Exception as e:
        print(f"Feedback generation try 1 failed: {e}")

    # Retry once
    print("Retrying feedback generation...")
    try:
        res = call_llm(system_prompt, messages)
        validated = validate_feedback_shape(res)
        if validated:
            return validated
    except Exception as e:
        print(f"Feedback generation try 2 failed: {e}")

    # Fallback structure
    candidate_name = session["candidate"]["member"]["name"]
    return {
        "summary": f"Technical evaluation completed for {candidate_name}.",
        "strengths": [
            "Demonstrated participation in the interactive interview sessions.",
            "Responded to technical topics across multiple curriculum days."
        ],
        "gaps": [
            "In-depth validation of skipped or failed curriculum modules was limited.",
            "Further demonstration of hands-on application execution is recommended."
        ],
        "next": [
            "Review core objectives in the curriculum guidelines.",
            "Attempt skipped missions under simulated practice scenarios."
        ]
    }
