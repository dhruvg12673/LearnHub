from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.models.coding import CreateSessionRequest, ChatRequest, AnalyzeRequest, AnalyzeResponse
from app.agents.coding import get_tutor_response, analyze_code
from app.db import get_db
import json
import asyncio

router = APIRouter()

@router.post("/start")
async def start_session(request: CreateSessionRequest):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("""
            INSERT INTO coding_sessions (user_id, language, title)
            VALUES (?, ?, ?)
        """, (request.user_id, request.language, f"{request.language} - {request.topic}"))
        conn.commit()
        session_id = c.lastrowid
        
        # Add initial system greeting as assistant message?
        # Actually better to let the AI generate the first greeting based on the topic.
        
    return {"session_id": session_id}

@router.post("/chat")
async def chat(request: ChatRequest):
    # 1. Fetch History
    history = []
    language = "Python" # Default
    
    with get_db() as conn:
        c = conn.cursor()
        # Get session info
        c.execute("SELECT language FROM coding_sessions WHERE id = ?", (request.session_id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        language = row["language"]
        
        # Get messages
        c.execute("SELECT role, content FROM coding_messages WHERE session_id = ? ORDER BY created_at ASC", (request.session_id,))
        rows = c.fetchall()
        history = [{"role": r["role"], "content": r["content"]} for r in rows]

    # 2. Save User Message
    with get_db() as conn:
        c = conn.cursor()
        c.execute("INSERT INTO coding_messages (session_id, role, content) VALUES (?, ?, ?)", 
                  (request.session_id, "user", request.message))
        conn.commit()

    # 3. Generate Response (Streaming)
    async def generate():
        full_response = ""
        stream = await get_tutor_response(history, request.message, language)
        async for chunk in stream:
            full_response += chunk
            yield chunk
            
        # 4. Save Assistant Response (after streaming completes)
        # Note: In a real async production app, we might need a separate callback or background task for this 
        # to ensure it saves even if connection drops, but this is fine for now.
        with get_db() as conn:
            c = conn.cursor()
            c.execute("INSERT INTO coding_messages (session_id, role, content) VALUES (?, ?, ?)", 
                      (request.session_id, "assistant", full_response))
            conn.commit()

    return StreamingResponse(generate(), media_type="text/plain")

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    feedback = await analyze_code(request.code, request.problem_statement, request.language)
    return AnalyzeResponse(feedback=feedback, is_correct=False) # is_correct logic is complex with LLM, just returning feedback for now

@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: int):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM coding_sessions WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = c.fetchall()
        return [dict(row) for row in rows]
        
@router.get("/session/{session_id}")
async def get_session_details(session_id: int):
     with get_db() as conn:
        c = conn.cursor()
        # Get Session Info
        c.execute("SELECT * FROM coding_sessions WHERE id = ?", (session_id,))
        session_row = c.fetchone()
        if not session_row:
             raise HTTPException(status_code=404, detail="Session not found")
             
        # Get Messages
        c.execute("SELECT * FROM coding_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
        msg_rows = c.fetchall()
        
        return {
            "session": dict(session_row),
            "messages": [dict(r) for r in msg_rows]
        }
