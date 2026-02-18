from fastapi import APIRouter, HTTPException
from app.models.content import ContentRequest, ContentResponse
from app.agents.content import generate_content
from app.db import get_db
import json
from pydantic import BaseModel

router = APIRouter()

class DBContentRequest(ContentRequest):
    roadmap_id: int

@router.post("/generate", response_model=ContentResponse)
async def create_content(request: DBContentRequest):
    try:
        # Check DB first
        with get_db() as conn:
            c = conn.cursor()
            c.execute("""
                SELECT content_json FROM node_content 
                WHERE roadmap_id = ? AND node_label = ? AND mode = ?
            """, (request.roadmap_id, request.subtopic, request.mode))
            row = c.fetchone()
            
            if row:
                return json.loads(row["content_json"])

        # Fetch User Status for Adaptive Learning
        user_status = "novice"
        with get_db() as conn:
            c = conn.cursor()
            # Get user_id from roadmap
            c.execute("SELECT user_id, topic FROM roadmaps WHERE id = ?", (request.roadmap_id,))
            roadmap_row = c.fetchone()
            
            if roadmap_row:
                user_id = roadmap_row["user_id"]
                topic = roadmap_row["topic"]
                
                # Get knowledge status
                c.execute("SELECT status FROM user_knowledge WHERE user_id = ? AND topic = ? AND subtopic = ?", 
                          (user_id, topic, request.subtopic))
                knowledge_row = c.fetchone()
                if knowledge_row:
                    user_status = knowledge_row["status"]

        # Generate if not found
        content = await generate_content(
            request.topic, 
            request.subtopic, 
            request.mode, 
            request.difficulty, 
            request.language,
            request.images,
            request.videos,
            user_status=user_status,
            interest=request.interest
        )
        
        # Save to DB
        with get_db() as conn:
            c = conn.cursor()
            c.execute("""
                INSERT INTO node_content (roadmap_id, node_label, mode, content_json)
                VALUES (?, ?, ?, ?)
            """, (request.roadmap_id, request.subtopic, request.mode, content.json()))
            conn.commit()
            
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
