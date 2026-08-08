"""
test_evaluator.py — Lightweight assertion test for BUG 2 fix.

Feeds the pipeline a deliberately wrong/off-topic answer to a RAG question
and asserts that the evaluator flags it as off-topic, NOT as "on_topic_strong".

Run with:
    cd /home/priyanshugupta/Desktop/bitforge
    python -m backend.test_evaluator

Expected output:
    ✅ PASS: off-topic answer correctly flagged as 'off_topic' or 'wrong'
    ✅ PASS: next_action is call_out_and_reask (not advance/probe_deeper)
    ✅ PASS: follow_up_instruction references the mismatch
    ✅ PASS: strong answer correctly flagged as 'on_topic_strong' or 'on_topic_vague'
"""
import os
import sys

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.interview_engine import evaluate_answer

# ─────────────────────────────────────────────────────────────────────────────
# Test 1: Off-topic answer should be flagged
# ─────────────────────────────────────────────────────────────────────────────

RAG_QUESTION = (
    "On Day 8, we covered Vector Databases and metadata filtering. "
    "In a production RAG system, how do you handle metadata filtering alongside "
    "vector similarity search to avoid returning irrelevant results from ChromaDB?"
)

OFF_TOPIC_ANSWER = (
    "When managing session state in a FastAPI application, the main challenge is "
    "that in-memory dictionaries are wiped on every hot-reload. A better approach "
    "is to use SQLite or Redis to persist session data across restarts. "
    "Also, for long conversations, you need to handle context window token limits "
    "by truncating older messages or summarizing them."
)

DAY_8_INFO = {
    "day": 8,
    "title": "Vector Databases",
    "objectives": [
        "Understand how to configure ChromaDB for production use",
        "Implement metadata filtering to improve retrieval precision",
        "Compare Pinecone vs ChromaDB for different use cases",
    ],
    "tools": ["ChromaDB", "Pinecone", "LangChain"],
}

# ─────────────────────────────────────────────────────────────────────────────
# Test 2: On-topic strong answer should not be flagged as off-topic
# ─────────────────────────────────────────────────────────────────────────────

ON_TOPIC_ANSWER = (
    "For metadata filtering in ChromaDB, I used the 'where' clause to pre-filter "
    "documents before vector similarity scoring. For example, when querying about "
    "a specific user's documents, I'd filter by user_id first, then run the "
    "embedding similarity search on that subset. This avoids the case where a "
    "semantically similar document from a different user or domain appears in results. "
    "I also experimented with Pinecone's namespaces for tenant isolation, though "
    "ChromaDB's collection-per-tenant model worked better for our use case."
)


def run_tests():
    passed = 0
    failed = 0

    print("\n" + "="*70)
    print("BUG 2 EVALUATOR ASSERTION TEST")
    print("="*70)

    # ── Test 1: Off-topic answer ───────────────────────────────────────────────
    print("\n[Test 1] Feeding off-topic answer to RAG question...")
    print(f"  Question: {RAG_QUESTION[:80]}...")
    print(f"  Answer:   {OFF_TOPIC_ANSWER[:80]}...")

    # We need a minimal session shape for evaluate_answer
    session = {
        "candidate": {"member": {"name": "TestCandidate"}},
        "messages": [],
        "system_prompt": "",
    }

    result = evaluate_answer(session, RAG_QUESTION, OFF_TOPIC_ANSWER, DAY_8_INFO)

    print(f"\n  → Judgment:            {result.get('judgment')}")
    print(f"  → Next action:         {result.get('next_action')}")
    print(f"  → Reasoning:           {result.get('reasoning', '')[:100]}")
    print(f"  → Follow-up instruct:  {result.get('follow_up_instruction', '')[:100]}")

    # Assertion 1: judgment must be off_topic or wrong
    judgment = result.get("judgment", "")
    if judgment in ("off_topic", "wrong"):
        print(f"\n  ✅ PASS: off-topic answer correctly flagged as '{judgment}'")
        passed += 1
    else:
        print(f"\n  ❌ FAIL: Expected 'off_topic' or 'wrong', got '{judgment}'")
        print("          → The evaluator is NOT detecting mismatch between question and answer.")
        print("          → This means BUG 2 evaluation step is NOT working correctly.")
        failed += 1

    # Assertion 2: next_action must be call_out_and_reask
    next_action = result.get("next_action", "")
    if next_action == "call_out_and_reask":
        print(f"  ✅ PASS: next_action is '{next_action}' (correct for off-topic)")
        passed += 1
    else:
        print(f"  ❌ FAIL: Expected 'call_out_and_reask', got '{next_action}'")
        print("          → Evaluator is not enforcing re-ask for off-topic answers.")
        failed += 1

    # Assertion 3: follow_up_instruction should mention mismatch
    instruction = result.get("follow_up_instruction", "").lower()
    mismatch_keywords = ["mismatch", "not address", "off-topic", "session state", "different", "vector", "rag", "metadata"]
    mentions_mismatch = any(kw in instruction for kw in mismatch_keywords)
    if mentions_mismatch:
        print(f"  ✅ PASS: follow_up_instruction references the specific mismatch")
        passed += 1
    else:
        print(f"  ❌ FAIL: follow_up_instruction doesn't address the answer mismatch")
        print(f"          Got: {instruction[:150]}")
        failed += 1

    # ── Test 2: On-topic strong answer ────────────────────────────────────────
    print("\n[Test 2] Feeding on-topic strong answer to same RAG question...")
    print(f"  Answer: {ON_TOPIC_ANSWER[:80]}...")

    result2 = evaluate_answer(session, RAG_QUESTION, ON_TOPIC_ANSWER, DAY_8_INFO)

    print(f"\n  → Judgment:   {result2.get('judgment')}")
    print(f"  → Reasoning:  {result2.get('reasoning', '')[:100]}")

    judgment2 = result2.get("judgment", "")
    if judgment2 in ("on_topic_strong", "on_topic_vague"):
        print(f"  ✅ PASS: on-topic answer correctly flagged as '{judgment2}'")
        passed += 1
    else:
        print(f"  ❌ FAIL: Expected 'on_topic_strong' or 'on_topic_vague', got '{judgment2}'")
        print("          → Evaluator is being too harsh on a clearly relevant answer.")
        failed += 1

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "="*70)
    print(f"RESULTS: {passed} passed, {failed} failed out of {passed + failed} assertions")
    if failed == 0:
        print("✅ All assertions passed — BUG 2 evaluator is working correctly.")
    else:
        print("❌ Some assertions failed — evaluation step is NOT correctly wired.")
    print("="*70 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
