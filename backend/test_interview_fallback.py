import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.llm_client import simulate_llm_response


def test_simulated_question_uses_requested_topic_day():
    system_prompt = """
    You are interviewing a candidate about their AI Cohort journey.
    Target Curriculum Topics to Cover:
    - Day 23: Model Context Protocol (MCP)
    - Day 28: Docker & Kubernetes Deployment
    """

    result = simulate_llm_response(system_prompt, [])

    reply = result.get("reply", "")
    assert "Day 23" in reply or "Model Context Protocol" in reply or "MCP" in reply, (
        f"Expected fallback question to target Day 23/MCP, got: {reply}"
    )


if __name__ == "__main__":
    test_simulated_question_uses_requested_topic_day()
    print("✅ fallback topic selection test passed")
