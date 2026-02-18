from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.db import get_db
from app.agents.tutor import get_tutor_response
import sqlite3
from typing import List, Optional

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: int
    topic: str
    message: str

class Message(BaseModel):
    role: str
    content: str

class ChatResponse(BaseModel):
    response: str
    history: List[Message]

@router.get("/history")
async def get_history(user_id: int, topic: str):
    with get_db() as conn:
        c = conn.cursor()
        
        # Get or Create Session
        c.execute("SELECT id FROM tutor_sessions WHERE user_id = ? AND topic = ?", (user_id, topic))
        session = c.fetchone()
        
        if not session:
            # Create session
            c.execute("INSERT INTO tutor_sessions (user_id, topic) VALUES (?, ?)", (user_id, topic))
            conn.commit()
            session_id = c.lastrowid
            return []
        else:
            session_id = session[0]
            
        c.execute("SELECT role, content FROM tutor_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
        messages = [{"role": row[0], "content": row[1]} for row in c.fetchall()]
        return messages

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    with get_db() as conn:
        c = conn.cursor()
        
        # 1. Get or Create Session
        c.execute("SELECT id FROM tutor_sessions WHERE user_id = ? AND topic = ?", (request.user_id, request.topic))
        session = c.fetchone()
        
        if not session:
            c.execute("INSERT INTO tutor_sessions (user_id, topic) VALUES (?, ?)", (request.user_id, request.topic))
            conn.commit()
            session_id = c.lastrowid
        else:
            session_id = session[0]
            
        # 2. Get History for Context
        c.execute("SELECT role, content FROM tutor_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
        history = [{"role": row[0], "content": row[1]} for row in c.fetchall()]
        
        # 3. Save User Message
        c.execute("INSERT INTO tutor_messages (session_id, role, content) VALUES (?, 'user', ?)", 
                 (session_id, request.message))
        conn.commit()
        
        # 4. Generate AI Response
        ai_response_text = await get_tutor_response(request.topic, request.message, history)
        
        # 5. Save AI Response
        c.execute("INSERT INTO tutor_messages (session_id, role, content) VALUES (?, 'assistant', ?)", 
                 (session_id, ai_response_text))
        conn.commit()
        
        # Update history to return
        history.append({"role": "user", "content": request.message})
        history.append({"role": "assistant", "content": ai_response_text})
        
        return {"response": ai_response_text, "history": history}
