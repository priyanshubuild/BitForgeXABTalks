import json
import os
import re
from typing import Dict, Any, List, Set, Tuple, Optional
from fastapi import HTTPException
from backend.llm_client import call_llm, call_llm_for_evaluation
from backend.breeth_client import BreethClient
from backend.session_store import get_session, set_session, delete_session, list_sessions

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

=== CRITICAL INTERVIEWER RULES ===

1. Conduct a natural, interactive technical interview. Speak directly to {name}.
2. Ask ONE question at a time.
3. BEFORE generating your next question, you MUST mentally evaluate the candidate's last answer:
   - Is it ON-TOPIC for the question asked, or clearly about something different?
   - Is it SPECIFIC and technically detailed, or vague/surface-level?
   - Is it CORRECT, partially correct, or wrong?
   
4. Based on your evaluation, respond accordingly — not based on a fixed script:
   - OFF-TOPIC or CLEARLY WRONG answer → Call it out directly and politely. Re-ask the original question or ask them to clarify. Do NOT congratulate them or move to a new topic.
   - VAGUE or SHALLOW → Cross-examine the specific weak point. Ask "You mentioned X — can you be more precise about how that actually works?" Reference what they said.
   - STRONG and SPECIFIC → Acknowledge briefly (1 sentence max) without canned phrases, then either probe one level deeper or advance to the next curriculum topic.

5. FORBIDDEN response patterns — NEVER use any of these:
   - "Good answer regarding [their words]..."
   - "Interesting perspective. Following up on..."
   - Any prefix that quotes the first few words of their answer back at them as a formula
   - Generic "what surprised you most" questions when a specific weak point exists
   - Complimenting an off-topic or wrong answer and moving on anyway

6. Adapt your questions based on their mission history:
   - For PASSED days: Ask deep conceptual or architectural questions to verify real mastery.
   - For SKIPPED or failed days: Gently probe why it was skipped or ask fundamental questions.
7. You must cover at least 4 distinct curriculum days across the conversation.
8. The interview MUST last at least 8 question turns before finishing.

9. Return EVERY response in JSON format matching this EXACT schema:

{{
  "reply": "Your message/question to the candidate",
  "is_complete": false,
  "day_covered": 7,
  "answer_judgment": "on_topic_strong | on_topic_vague | off_topic | wrong | first_question",
  "feedback": null
}}

When (and only when) the interview is complete (after at least 8 questions & 4 days covered), set "is_complete": true and provide the feedback block:
{{
  "reply": "Thank you for your time today! That concludes our technical interview.",
  "is_complete": true,
  "day_covered": null,
  "answer_judgment": "complete",
  "feedback": {{
    "summary": "Clear 2-3 sentence overview of candidate performance",
    "strengths": ["Actionable strength 1", "Actionable strength 2"],
    "gaps": ["Actionable gap 1", "Actionable gap 2"],
    "next": ["Actionable next step 1", "Actionable next step 2"]
  }}
}}
"""
    return prompt


def _heuristic_evaluate(question: str, answer: str, day_info: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Local fallback evaluator used when both LLMs are unavailable.
    Uses high-specificity keyword matching: only tool names + technical nouns
    from the topic's curriculum objectives (not generic question words).
    This correctly flags off-topic answers even when they share common English words.
    """
    a_lower  = answer.lower()
    word_count = len(answer.strip().split())

    # Only use HIGH-SPECIFICITY signals: tool names + key nouns from objectives
    high_specificity_keywords: List[str] = []

    if day_info:
        # Tool names are the most reliable signal (ChromaDB, Pinecone, etc.)
        for tool in day_info.get("tools", []):
            high_specificity_keywords.append(tool.lower())
            # Also add without spaces/capitals (e.g. "chromadb", "langchain")
            normalized = re.sub(r'[^a-z0-9]', '', tool.lower())
            if normalized:
                high_specificity_keywords.append(normalized)

        # Extract technical nouns from objectives (words > 5 chars that are not stop words)
        stop_nouns = {
            "understand", "implement", "explain", "describe", "configure",
            "design", "build", "create", "explore", "analyze", "production",
            "system", "method", "process", "approach", "using", "through",
            "different", "various", "common", "between", "without", "before"
        }
        for obj in day_info.get("objectives", []):
            for word in obj.lower().split():
                w = word.strip(".,!?:;")
                if len(w) > 5 and w not in stop_nouns and not w.isdigit():
                    high_specificity_keywords.append(w)

    # Also extract technical nouns from the question (> 6 chars, not in stop nouns)
    q_tech_stop = {
        "covered", "production", "setting", "handle", "return", "between",
        "please", "explain", "describe", "through", "without", "before",
        "across", "manage", "approach", "discuss", "walked", "worked"
    }
    for w in re.findall(r'\b[a-z]{6,}\b', question.lower()):
        if w not in q_tech_stop:
            high_specificity_keywords.append(w)

    unique_kw = list(set(high_specificity_keywords))
    if not unique_kw:
        # No specific keywords available -- default to length-based judgment
        if word_count < 20:
            return {"judgment": "on_topic_vague", "reasoning": "Answer too brief.",
                    "next_action": "cross_examine",
                    "follow_up_instruction": "Ask for more technical detail with a concrete implementation example."}
        return {"judgment": "on_topic_vague", "reasoning": "Could not extract topic keywords.",
                "next_action": "probe_deeper",
                "follow_up_instruction": "Probe one level deeper into the implementation."}

    hits = sum(1 for kw in unique_kw if kw in a_lower)
    hit_ratio = hits / len(unique_kw)

    print(f"[Heuristic Eval] word_count={word_count}, specific_keywords={len(unique_kw)}, hits={hits}, ratio={hit_ratio:.2f}")
    print(f"[Heuristic Eval] Keywords checked: {unique_kw[:10]}...")

    # Check topical relevance FIRST — a short answer that's clearly off-topic
    # should be flagged off_topic, not on_topic_vague.
    if hit_ratio < 0.10:
        return {
            "judgment": "off_topic",
            "reasoning": f"Answer contains very few topic-specific terms (hit ratio: {hit_ratio:.2f}). It appears to discuss a different subject than what was asked.",
            "next_action": "call_out_and_reask",
            "follow_up_instruction": (
                "The candidate's answer does not address the question. "
                "Point out the mismatch directly: name what subject their answer was about, "
                "then re-ask the original question focusing on the correct topic."
            )
        }
    elif word_count < 15:
        return {
            "judgment": "on_topic_vague",
            "reasoning": f"Answer is on-topic but very brief ({word_count} words) -- insufficient detail.",
            "next_action": "cross_examine",
            "follow_up_instruction": "Ask the candidate to expand with concrete technical details and a real implementation example."
        }
    elif hit_ratio < 0.22 or word_count < 40:
        return {
            "judgment": "on_topic_vague",
            "reasoning": f"Answer is on-topic but lacks depth (hit ratio: {hit_ratio:.2f}, {word_count} words).",
            "next_action": "cross_examine",
            "follow_up_instruction": "Cross-examine a specific weak point. Ask for a concrete implementation detail, a tradeoff decision, or a failure scenario."
        }
    else:
        return {
            "judgment": "on_topic_strong",
            "reasoning": f"Answer covers the topic with reasonable specificity (hit ratio: {hit_ratio:.2f}, {word_count} words).",
            "next_action": "probe_deeper",
            "follow_up_instruction": "Acknowledge briefly and probe one level deeper -- ask about edge cases, scaling concerns, or how they validated their implementation."
        }



def evaluate_answer(
    session: Dict[str, Any],
    question: str,
    answer: str,
    day_info: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    ISSUE 1 FIX: eval prompt now names the exact topic and explicitly requires
    mismatch naming (not generic 'too brief') when the answer is off-topic.
    Uses call_llm_for_evaluation (no simulation fallback), falls back to heuristic.
    """
    objectives_text = ""
    topic_name = day_info.get("title", "the topic") if day_info else "the topic"
    tools_text = ", ".join(day_info.get("tools", [])) if day_info else ""
    if day_info:
        objs = day_info.get("objectives", [])
        if objs:
            objectives_text = "\n".join(f"  - {o}" for o in objs)

    eval_system = f"""You are a strict technical answer evaluator for an AI curriculum interview.

The question was about: "{topic_name}"
Relevant tools: {tools_text or 'general AI/ML'}
Curriculum objectives for this topic:
{objectives_text or '(general AI/ML concepts)'}

Your FIRST job is topical relevance — does the answer discuss the SAME SUBJECT as the question?
If the answer is about a DIFFERENT concept (e.g. the question is about vector databases but the
answer describes session state management), that is OFF_TOPIC regardless of answer length or quality.

When the answer is off_topic, your follow_up_instruction MUST name the actual mismatch explicitly:
  e.g. "That answer described session state management, not vector database metadata filtering.
        Re-ask: in ChromaDB, how do you use the where clause to filter by metadata before
        the vector similarity search runs?"

Return a JSON object with this EXACT schema:
{{
  "judgment": "on_topic_strong | on_topic_vague | off_topic | wrong",
  "reasoning": "1-2 sentences with specific evidence from the answer — name exactly what subject the answer was about vs what was asked",
  "next_action": "advance | probe_deeper | call_out_and_reask | cross_examine",
  "follow_up_instruction": "Specific instruction naming the mismatch and what to re-ask or probe. Never use generic 'need more depth' if the answer is off-topic."
}}

Rules:
- "off_topic": Answer is about a DIFFERENT concept. next_action MUST be "call_out_and_reask". follow_up_instruction MUST name what subject the answer was about AND re-state the original question.
- "wrong": Factually incorrect claims about this topic. next_action MUST be "call_out_and_reask".
- "on_topic_vague": On-topic but surface-level. next_action MUST be "cross_examine". Name the specific gap.
- "on_topic_strong": Specific, accurate, addresses the question directly. next_action is "probe_deeper" or "advance".

Output ONLY valid JSON."""

    eval_messages = [
        {
            "role": "user",
            "content": (
                f"THIS QUESTION IS ABOUT: {topic_name}\n\n"
                f"QUESTION ASKED:\n{question}\n\n"
                f"TOPIC OBJECTIVES:\n{objectives_text if objectives_text else '(general AI/ML concepts)'}\n\n"
                f"CANDIDATE ANSWER:\n{answer}\n\n"
                f"Evaluate whether this answer addresses the question about '{topic_name}'. "
                "If the answer is about a DIFFERENT subject, name that subject explicitly in your reasoning."
            )
        }
    ]

    # Use the evaluation-specific call that NEVER falls back to simulation
    try:
        result = call_llm_for_evaluation(eval_system, eval_messages)
        if result and all(k in result for k in ["judgment", "reasoning", "next_action", "follow_up_instruction"]):
            judgment = result["judgment"]
            if judgment not in ("on_topic_strong", "on_topic_vague", "off_topic", "wrong"):
                judgment = "on_topic_vague"
                result["judgment"] = judgment
            print(f"[Evaluator] LLM Judgment: {judgment} | Action: {result['next_action']}")
            print(f"[Evaluator] Reasoning: {result['reasoning']}")
            return result
        # LLM unavailable or returned unexpected structure -- use heuristic
        print("[Evaluator] LLM evaluation unavailable -- using keyword heuristic.")
    except Exception as e:
        print(f"[Evaluator] Evaluation call failed: {e} -- using keyword heuristic.")

    return _heuristic_evaluate(question, answer, day_info)


def build_follow_up_prompt(
    session: Dict[str, Any],
    evaluation: Dict[str, Any],
    retrieved_facts: List[str],
) -> str:
    """
    Builds augmented system prompt injecting evaluator judgment + current topic.
    The LLM is told exactly which topic is being tested and whether to advance.
    """
    base_prompt   = session["system_prompt"]
    judgment      = evaluation["judgment"]
    reasoning     = evaluation["reasoning"]
    next_action   = evaluation["next_action"]
    instruction   = evaluation["follow_up_instruction"]

    target_days       = session.get("target_days", [])
    current_topic_idx = min(session.get("current_topic_idx", 0), max(len(target_days)-1, 0))
    topic_attempts    = session.get("topic_attempts", 0)
    MAX_ATTEMPTS      = session.get("MAX_TOPIC_ATTEMPTS", 2)
    cur_day           = target_days[current_topic_idx] if target_days else {}
    cur_day_num       = cur_day.get("day", "?")
    cur_day_title     = cur_day.get("title", "current topic")

    evaluation_block = (
        f"\n=== EVALUATOR JUDGMENT — FOLLOW EXACTLY ==="
        f"\nCurrent topic being tested: Day {cur_day_num} — {cur_day_title}"
        f"\nTopic attempt: {topic_attempts}/{MAX_ATTEMPTS} (only advances when strong or cap reached)"
        f"\nAnswer quality: {judgment.upper()}"
        f"\nReasoning: {reasoning}"
        f"\nRequired next action: {next_action}"
        f"\nSpecific instruction: {instruction}"
        f"\n"
        f"\nMANDATORY RULES:"
        f"\n- OFF_TOPIC or WRONG: Name what the answer was about, then name what was asked. Re-ask the original question. Do NOT advance."
        f"\n- ON_TOPIC_VAGUE: Cross-examine the specific weak point. Stay on Day {cur_day_num}."
        f"\n- ON_TOPIC_STRONG + advance instruction: Move to the next topic now."
        f"\n- ON_TOPIC_STRONG + probe_deeper: Stay on Day {cur_day_num} and ask a deeper question."
        f"\n- NEVER use 'Good answer regarding...' or any echo-prefix."
        f"\n- NEVER advance to a new topic unless explicitly instructed above."
        f"\n==========================================\n"
    )

    if retrieved_facts:
        facts_block = (
            "\n\n### CANDIDATE MEMORY FACTS (from prior turns — do not re-ask these):\n"
            + "\n".join(retrieved_facts)
        )
        return base_prompt + evaluation_block + facts_block

    return base_prompt + evaluation_block


def start_session(session_id: str, candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initializes a new interview session and persists it to SQLite.
    ISSUE 2 FIX: adds current_topic_idx and topic_attempts to track per-topic state.
    """
    print(f"[Session] Starting new session: {session_id}")
    target_days = select_target_days(candidate)
    system_prompt = build_system_prompt(candidate, target_days)

    initial_user_prompt = [
        {
            "role": "user",
            "content": f"The candidate {candidate['member']['name']} has joined the interview. Please welcome them and ask your first technical question about Day {target_days[0]['day']} — {target_days[0]['title']}."
        }
    ]

    llm_res = call_llm(system_prompt, initial_user_prompt)
    day_num = llm_res.get("day_covered") or (target_days[0]["day"] if target_days else 1)

    session_data = {
        "candidate": candidate,
        "target_days": target_days,
        "system_prompt": system_prompt,
        "messages": [
            {"role": "assistant", "content": llm_res["reply"]}
        ],
        "questions_asked": 1,
        "days_covered": {day_num},
        # ISSUE 2 FIX: topic state machine
        "current_topic_idx": 0,
        "topic_attempts": 0,       # rejected attempts on current topic
        "MAX_TOPIC_ATTEMPTS": 2,   # advance after 2 rejections
    }

    set_session(session_id, session_data)
    print(f"[Session] Session {session_id} persisted. Topics: {[d['title'] for d in target_days]}")

    return {"reply": llm_res["reply"], "done": False}


def process_turn(session_id: str, user_message: str) -> Dict[str, Any]:
    """
    Processes a candidate's turn.
    ISSUE 2 FIX: topic state machine — advance only on strong answer or after cap.
    ISSUE 3 FIX: Breeth search queries PREVIOUS turn's topic (already propagated).
    """
    session = get_session(session_id)
    if session is None:
        active = list_sessions()
        print(f"[ERROR] Session not found: '{session_id}'. Active: {active}.")
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. Active IDs: {active}"
        )

    candidate_name = session["candidate"]["member"]["name"]
    target_days = session["target_days"]
    MAX_ATTEMPTS = session.get("MAX_TOPIC_ATTEMPTS", 2)

    # ISSUE 2: read topic state — migrate old sessions that lack these fields
    current_topic_idx = session.get("current_topic_idx", 0)
    topic_attempts    = session.get("topic_attempts", 0)
    current_topic_idx = min(current_topic_idx, len(target_days) - 1)
    current_day_info  = target_days[current_topic_idx]

    # Fetch last assistant question
    last_question = ""
    for msg in reversed(session["messages"]):
        if msg["role"] == "assistant":
            last_question = msg["content"]
            break

    # Resolve day_info for CURRENT topic (what's being tested right now)
    curr_day_num = current_day_info["day"]
    day_info: Optional[Dict[str, Any]] = None
    for d in CURRICULUM_DATA.get("days", []):
        if d.get("day") == curr_day_num:
            day_info = d
            break
    if day_info is None:
        day_info = current_day_info   # fallback to target_days entry

    topic_title = day_info.get("title") or current_day_info.get("title", f"Day {curr_day_num}")
    day_topic_str = f"Day {curr_day_num} ({topic_title})"

    print(f"[Topic SM] idx={current_topic_idx} day={curr_day_num} '{topic_title}' attempts={topic_attempts}/{MAX_ATTEMPTS}")

    # ── Breeth: write current exchange ───────────────────────────────────────
    episode_content = (
        f"Candidate Name: {candidate_name}\n"
        f"Topic Asked About: {day_topic_str}\n"
        f"Interviewer Question: {last_question}\n"
        f"Candidate Answer: {user_message}"
    )
    substantive = is_substantive_answer(user_message)
    try:
        print(f"[Breeth] Writing episode for {day_topic_str}, group={session_id}")
        res_ep = breeth_client.write_episode(
            content=episode_content, group_id=session_id, extract_intent=substantive
        )
        if res_ep:
            print(f"[Breeth] Episode written: {res_ep.get('episode_name')} | "
                  f"entities={res_ep.get('extracted',{}).get('entities',0)} "
                  f"edges={res_ep.get('extracted',{}).get('edges',0)}")
        else:
            print("[Breeth] write_episode returned None.")
    except Exception as be:
        print(f"[Breeth] write_episode FAILED: {be}")

    session["messages"].append({"role": "user", "content": user_message})

    # ISSUE 3 FIX: search for PREVIOUS topics' facts (already propagated async).
    # We search using the candidate name + a broad query; results from prior turns
    # arrive here because async propagation finished during previous turns.
    retrieved_facts: List[str] = []
    memories_list:   List[Dict] = []
    search_query = f"{candidate_name} AI interview"
    try:
        print(f"[Breeth] Searching memories: '{search_query}' group={session_id}")
        search_res = breeth_client.search(query=search_query, group_id=session_id, limit=8)
        if search_res and isinstance(search_res, dict):
            edges = search_res.get("edges") or []
            print(f"[Breeth] Search returned {len(edges)} edges")
            for edge in edges:
                fact_content = edge.get("fact") or edge.get("content") or ""
                if not fact_content:
                    continue
                intent_meta      = edge.get("intent_meta") or {}
                cognitive_pattern = intent_meta.get("cognitive_pattern") or ""
                digest_item = f"- Fact: {fact_content}"
                if cognitive_pattern:
                    digest_item += f" (Pattern: {cognitive_pattern})"
                retrieved_facts.append(digest_item)
                # ISSUE 3 FIX: derive readable labels from the fact text instead
                # of showing raw UUIDs in the memory panel chips.
                words = fact_content.split()
                src_label = candidate_name
                tgt_label = " ".join(words[2:5]) if len(words) >= 5 else topic_title
                memories_list.append({
                    "source_node": src_label,
                    "target_node": tgt_label,
                    "fact": fact_content,
                    "cognitive_pattern": cognitive_pattern
                })
        else:
            print("[Breeth] Search returned no results yet (async lag expected on first turns).")
    except Exception as se:
        print(f"[Breeth] search FAILED: {se}")

    # ── Evaluate answer ───────────────────────────────────────────────────────
    if last_question and substantive:
        evaluation = evaluate_answer(session, last_question, user_message, day_info)
    else:
        evaluation = {
            "judgment": "on_topic_vague",
            "reasoning": "Answer was too brief.",
            "next_action": "cross_examine",
            "follow_up_instruction": "Ask for a concrete technical detail."
        }

    judgment    = evaluation["judgment"]
    next_action = evaluation["next_action"]

    # ── ISSUE 2: Topic state machine ─────────────────────────────────────────
    # Only advance to next topic when: answer is strong, OR attempts cap reached.
    topic_passed = judgment == "on_topic_strong"
    topic_cap    = topic_attempts >= MAX_ATTEMPTS

    if topic_passed or topic_cap:
        if topic_cap and not topic_passed:
            print(f"[Topic SM] Cap reached on Day {curr_day_num} '{topic_title}' after {topic_attempts} rejections — marking as gap and advancing.")
            # Record it as a noted gap in session
            if "topic_gaps" not in session:
                session["topic_gaps"] = []
            session["topic_gaps"].append(f"Day {curr_day_num} ({topic_title}): candidate could not answer adequately after {topic_attempts} attempts.")
        new_idx = min(current_topic_idx + 1, len(target_days) - 1)
        session["current_topic_idx"] = new_idx
        session["topic_attempts"]    = 0
        print(f"[Topic SM] Advancing idx {current_topic_idx} -> {new_idx} | passed={topic_passed} cap={topic_cap}")
        # Tell the follow-up prompt to move to the next topic
        if new_idx > current_topic_idx:
            next_td = target_days[new_idx]
            evaluation["follow_up_instruction"] += (
                f" Now advance to the NEXT topic: Day {next_td['day']} — {next_td['title']}. "
                f"Ask a fresh question about this new topic."
            )
    else:
        # Stay on current topic — increment attempt counter
        session["topic_attempts"] = topic_attempts + 1
        print(f"[Topic SM] Staying on Day {curr_day_num} '{topic_title}' (attempt {session['topic_attempts']}/{MAX_ATTEMPTS}) judgment={judgment}")
        # Reinforce: the follow-up MUST stay on this topic
        evaluation["follow_up_instruction"] = (
            f"STAY ON Day {curr_day_num} ({topic_title}). "
            + evaluation["follow_up_instruction"]
        )

    # ── Build augmented prompt + call LLM ────────────────────────────────────
    augmented_system_prompt = build_follow_up_prompt(session, evaluation, retrieved_facts)
    llm_res = call_llm(augmented_system_prompt, session["messages"])

    reply_text     = llm_res.get("reply", "Could you elaborate further on your approach?")
    is_complete    = llm_res.get("is_complete", False)
    day_covered    = llm_res.get("day_covered")
    answer_judgment = llm_res.get("answer_judgment") or judgment

    print(f"[Session] {session_id} | Turn #{session['questions_asked']+1} | Judgment: {answer_judgment} | Day: {day_covered} | Complete: {is_complete}")

    if day_covered:
        session["days_covered"].add(day_covered)
    session["questions_asked"] += 1
    session["messages"].append({"role": "assistant", "content": reply_text})

    # Enforce minimum 8 questions AND 4 days
    questions_asked   = session["questions_asked"]
    days_covered_count = len(session["days_covered"])
    if is_complete and (questions_asked < 8 or days_covered_count < 4):
        is_complete = False
        remaining = [d["day"] for d in target_days if d["day"] not in session["days_covered"]]
        next_day  = remaining[0] if remaining else target_days[0]["day"]
        reply_text += f"\n\nLet me ask you another question to dig deeper into Day {next_day}."
        session["messages"][-1]["content"] = reply_text

    set_session(session_id, session)

    if is_complete:
        feedback_obj = generate_feedback_with_retry(session)
        return {"reply": reply_text, "done": True, "feedback": feedback_obj, "memories": memories_list}
    return {"reply": reply_text, "done": False, "memories": memories_list}


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
