from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.interview_engine import start_session, process_turn
from backend.session_store import list_sessions

app = FastAPI(
    title="AI Interview Agent API",
    description="Backend service for AI Interview Agent hackathon",
    version="1.0.0"
)

# Enable CORS for local testing and frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models based on technical-spec.md
class FeedbackShape(BaseModel):
    summary: str
    strengths: List[str]
    gaps: List[str]
    next: List[str]

class InterviewResponse(BaseModel):
    reply: str
    done: bool
    feedback: Optional[FeedbackShape] = None
    memories: Optional[List[Dict[str, Any]]] = None

# Health Check Routes
@app.get("/health")
@app.get("/api/health")
def health_check():
    active = list_sessions()
    return {
        "status": "ok",
        "service": "AI Interview Agent Backend",
        "version": "1.0.0",
        "active_sessions": len(active),
    }

@app.get("/api/sessions")
def debug_sessions():
    """
    DEV-ONLY: Lists all session IDs currently persisted in SQLite.
    Use this to confirm the sessionId sent by the frontend matches one here.
    """
    active = list_sessions()
    return {"session_ids": active, "count": len(active)}

# Single Endpoint POST /api/interview
@app.post("/api/interview", response_model=InterviewResponse)
def interview_endpoint(payload: Dict[str, Any] = Body(...)):
    """
    Single endpoint for initializing and conducting interview turns per technical-spec.md.
    Returns the expected contract: reply, done, feedback, memories.
    """
    session_id = payload.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing required field 'sessionId'.")

    try:
        if "candidate" in payload:
            candidate_data = payload["candidate"]
            result = start_session(session_id, candidate_data)
            return {
                "reply": result.get("reply", "Welcome. Let's begin your interview."),
                "done": bool(result.get("done", False)),
                "feedback": None,
                "memories": result.get("memories"),
            }

        if "message" in payload:
            message_text = payload["message"]
            result = process_turn(session_id, message_text)
            return {
                "reply": result.get("reply", "Let's continue the interview."),
                "done": bool(result.get("done", False)),
                "feedback": result.get("feedback"),
                "memories": result.get("memories"),
            }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Interview processing failed: {exc}") from exc

    raise HTTPException(
        status_code=400,
        detail="Invalid request format. Payload must contain either 'candidate' (to start) or 'message' (for turn)."
    )
