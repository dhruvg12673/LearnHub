from fastapi import APIRouter, HTTPException
from app.models.roadmap import RoadmapRequest, RoadmapResponse, RoadmapUpdateRequest
from app.agents.planner import generate_roadmap
from app.db import get_db
import json
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

class RoadmapListResponse(BaseModel):
    id: int
    topic: str
    language: str
    difficulty: str
    created_at: str

@router.get("/user/{user_id}", response_model=List[RoadmapListResponse])
async def get_user_roadmaps(user_id: int):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT id, topic, language, difficulty, created_at FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = c.fetchall()
        return [dict(row) for row in rows]

@router.get("/{roadmap_id}", response_model=RoadmapResponse)
async def get_roadmap(roadmap_id: int):
    with get_db() as conn:
        c = conn.cursor()
        # Retrieve 'interest' and 'objective'
        c.execute("SELECT roadmap_json, difficulty, language, user_id, topic, interest, objective FROM roadmaps WHERE id = ?", (roadmap_id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        data = json.loads(row["roadmap_json"])
        # Inject DB fields if missing in JSON (backward compatibility)
        if "difficulty" not in data:
            data["difficulty"] = row["difficulty"]
        if "language" not in data:
            data["language"] = row["language"]
        if "interest" not in data or data["interest"] is None:
             data["interest"] = row["interest"]
        if "objective" not in data or data["objective"] is None:
             try:
                 data["objective"] = row["objective"]
             except Exception:
                 data["objective"] = None # Handle if column logic fails somehow

        # Fetch user progress
        c.execute("SELECT subtopic, mastery_score, status FROM user_knowledge WHERE user_id = ? AND topic = ?", (row["user_id"], row["topic"]))
        progress_rows = c.fetchall()
        progress_map = {r["subtopic"]: {"mastery_score": r["mastery_score"], "status": r["status"]} for r in progress_rows}
        
        # Recursive function to inject progress
        def inject_progress(nodes):
            for node in nodes:
                if node['label'] in progress_map:
                    node['mastery_score'] = progress_map[node['label']]['mastery_score']
                    node['status'] = progress_map[node['label']]['status']
                else:
                    node['mastery_score'] = 0
                    node['status'] = 'novice'
                
                if 'children' in node and node['children']:
                    inject_progress(node['children'])
        
        if "roadmap" in data:
            inject_progress(data["roadmap"])
            
        return data

@router.put("/{roadmap_id}/update")
async def update_roadmap_structure(roadmap_id: int, request: RoadmapUpdateRequest):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT roadmap_json FROM roadmaps WHERE id = ?", (roadmap_id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        # Load existing data to preserve topic, etc.
        current_data = json.loads(row["roadmap_json"])
        
        # Merge new nodes/edges
        current_data["nodes"] = request.nodes
        current_data["edges"] = request.edges
        
        # Save back to DB
        new_json = json.dumps(current_data)
        c.execute("UPDATE roadmaps SET roadmap_json = ? WHERE id = ?", (new_json, roadmap_id))
        conn.commit()
        
    return {"status": "success"}

class CreateRoadmapRequest(RoadmapRequest):
    user_id: int

@router.post("/generate", response_model=dict)
async def create_roadmap(request: CreateRoadmapRequest):
    try:
        # Generate roadmap using LLM
        roadmap_data = await generate_roadmap(request.topic, request.difficulty, request.language, request.interest, request.objective)
        
        # Save to DB
        with get_db() as conn:
            c = conn.cursor()
            c.execute("""
                INSERT INTO roadmaps (user_id, topic, language, difficulty, interest, objective, roadmap_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (request.user_id, request.topic, request.language, request.difficulty, request.interest, request.objective, roadmap_data.json()))
            conn.commit()
            roadmap_id = c.lastrowid
            
        return {"id": roadmap_id, "roadmap": roadmap_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
