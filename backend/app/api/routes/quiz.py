from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.agents.quiz import generate_quiz_questions, generate_quiz_review
from app.agents.digital_twin import update_knowledge_state
from app.db import get_db
import json

router = APIRouter()

class QuizGenerateRequest(BaseModel):
    topic: str
    subtopic: str
    difficulty: str
    language: str
    roadmap_id: int = None # Optional for backward compatibility, but needed for adaptive

class QuizSubmitRequest(BaseModel):
    user_id: int
    roadmap_id: int
    node_label: str
    topic: str # Needed for Digital Twin
    questions: List[Dict[str, Any]] # Full question objects
    answers: Dict[str, str] # Question ID -> Selected Option
    time_taken: Dict[str, int] # Question ID -> Seconds taken
    total_time: int

@router.post("/generate")
async def generate_quiz(request: QuizGenerateRequest):
    try:
        user_status = "novice"
        
        if request.roadmap_id:
            with get_db() as conn:
                c = conn.cursor()
                # Get user_id from roadmap
                c.execute("SELECT user_id FROM roadmaps WHERE id = ?", (request.roadmap_id,))
                roadmap_row = c.fetchone()
                
                if roadmap_row:
                    user_id = roadmap_row["user_id"]
                    # Get knowledge status
                    c.execute("SELECT status FROM user_knowledge WHERE user_id = ? AND topic = ? AND subtopic = ?", 
                              (user_id, request.topic, request.subtopic))
                    knowledge_row = c.fetchone()
                    if knowledge_row:
                        user_status = knowledge_row["status"]

        questions = await generate_quiz_questions(
            request.topic, 
            request.subtopic, 
            request.difficulty, 
            request.language,
            user_status=user_status
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit")
async def submit_quiz(request: QuizSubmitRequest):
    try:
        # 1. Calculate Score
        correct_count = 0
        total_questions = len(request.questions)
        
        attempt_data = []
        
        for q in request.questions:
            q_id = str(q.get("id")) # Ensure string for dict lookup
            user_ans = request.answers.get(q_id)
            correct_ans = q.get("correct_answer")
            is_correct = user_ans == correct_ans
            
            if is_correct:
                correct_count += 1
                
            attempt_data.append({
                "question": q.get("question"),
                "user_answer": user_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
                "time_taken": request.time_taken.get(q_id, 0)
            })
            
        score_percentage = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
        
        # 2. Generate Review (Async but awaited here for simplicity in response)
        review_text = await generate_quiz_review(
            request.topic,
            request.node_label,
            score_percentage,
            total_questions,
            request.total_time,
            attempt_data
        )

        # 3. Save Attempt to DB
        with get_db() as conn:
            c = conn.cursor()
            c.execute("""
                INSERT INTO quiz_attempts 
                (user_id, roadmap_id, node_label, score, total_questions, time_taken_seconds, attempt_data_json, review_text)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                request.user_id, 
                request.roadmap_id, 
                request.node_label, 
                score_percentage, 
                total_questions, 
                request.total_time, 
                json.dumps(attempt_data),
                review_text
            ))
            conn.commit()
            
        # 4. Update Digital Twin
        knowledge_update = await update_knowledge_state(
            request.user_id,
            request.topic,
            request.node_label,
            score_percentage,
            request.total_time
        )
        
        return {
            "score": score_percentage,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "knowledge_update": knowledge_update,
            "review": review_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
