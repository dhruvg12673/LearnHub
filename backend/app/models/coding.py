from pydantic import BaseModel
from typing import List, Optional

class CreateSessionRequest(BaseModel):
    user_id: int
    language: str
    topic: str

class ChatRequest(BaseModel):
    session_id: int
    message: str

class ChatResponse(BaseModel):
    response: str

class AnalyzeRequest(BaseModel):
    code: str
    problem_statement: str
    language: str

class AnalyzeResponse(BaseModel):
    feedback: str # Markdown formatted feedback
    is_correct: bool
