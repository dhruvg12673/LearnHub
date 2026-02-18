from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from app.db import get_db
import sqlite3
import shutil
import os
from typing import Optional, List, Dict, Any
from pathlib import Path
from thefuzz import fuzz

router = APIRouter()

# Configuration for upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/recommendations")
async def get_recommendations(user_id: int):
    print(f"--- DEBUG: Recommendation requested for user_id={user_id} ---")
    with get_db() as conn:
        c = conn.cursor()
        
        # 1. Get User's Roadmap Topics & Interests for context
        c.execute("""
            SELECT topic, interest, difficulty 
            FROM roadmaps 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        """, (user_id,))
        user_roadmaps = c.fetchall()
        print(f"DEBUG: Found {len(user_roadmaps)} recent roadmaps/interests for context")
        
        if not user_roadmaps:
             print("DEBUG: No user history found. Returning fresh fallback content.")
             # Fallback: Just return recent resources if no preferences
             c.execute("SELECT * FROM resources ORDER BY created_at DESC LIMIT 5")
             return [dict(row) for row in c.fetchall()]

        # Collect keywords from roadmaps
        search_terms = []
        for rm in user_roadmaps:
            if rm['topic']: search_terms.append(rm['topic'])
            if rm['interest']: search_terms.append(rm['interest'])
        
        # Dedup terms
        search_terms = list(set([t for t in search_terms if t]))
        print(f"DEBUG: Derived Search Terms: {search_terms}")
        
        # 2. Get All Resources to rank
        c.execute("SELECT * FROM resources")
        all_resources = [dict(row) for row in c.fetchall()]
        print(f"DEBUG: Scanning against {len(all_resources)} total resources in library")
        
        # 3. Fuzzy match and Rank
        scored_resources = []
        for res in all_resources:
            # Construct a rich text representation of the resource
            curr_text = f"{res['title']} {res['description']} {res['category']} {res['type']}"
            
            # Calculate max score across all user search terms
            best_score = 0
            best_term = ""
            for term in search_terms:
                # Token Sort Ratio handles out of order words reasonably well
                score = fuzz.token_set_ratio(str(term), str(curr_text))
                if score > best_score:
                    best_score = score
                    best_term = term
            
            if best_score > 40: # Threshold
                print(f"DEBUG: MATCH -> Resource '{res['title']}' matched term '{best_term}' (Score: {best_score})")
                res['relevance_score'] = best_score
                scored_resources.append(res)
            else:
                # Optional: Log low scores to see misses
                # print(f"DEBUG: MISS -> Resource '{res['title']}' (Best Score: {best_score})")
                pass
        
        # Sort by score desc
        scored_resources.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        top_picks = scored_resources[:6]
        print(f"DEBUG: Returning top {len(top_picks)} recommendations out of {len(scored_resources)} matches.")
        
        return top_picks

@router.post("/upload")
async def upload_resource(
    title: str = Form(...),
    description: str = Form(""),
    type: str = Form(...),
    category: str = Form(""),
    file: UploadFile = File(...),
    user_id: Optional[int] = Form(None) 
):
    try:
        # 1. Save File
        file_location = UPLOAD_DIR / file.filename
        
        # Determine uniqueness to avoid overwrite? For now, simple overwrite or auto-rename could be better.
        # Let's prepend timestamp or uuid in a real app, but for now simple.
        # Check if file exists to avoid collision
        if file_location.exists():
            base_name = file_location.stem
            suffix = file_location.suffix
            import uuid
            file_location = UPLOAD_DIR / f"{base_name}_{uuid.uuid4().hex[:8]}{suffix}"

        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Save DB Record
        with get_db() as conn:
            c = conn.cursor()
            c.execute("""
                INSERT INTO resources (user_id, title, description, type, category, file_path, filename)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, title, description, type, category, str(file_location), file.filename))
            conn.commit()
            resource_id = c.lastrowid
            
        return {
            "id": resource_id,
            "title": title,
            "filename": file.filename,
            "message": "Resource uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_resources():
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM resources ORDER BY created_at DESC")
        rows = c.fetchall()
        return [dict(row) for row in rows]

@router.get("/download/{resource_id}")
async def download_resource(resource_id: int):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM resources WHERE id = ?", (resource_id,))
        row = c.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Resource not found")
            
        file_path = Path(row["file_path"])
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on server")
            
        return FileResponse(
            path=file_path, 
            filename=row["filename"],
            media_type='application/octet-stream'
        )

@router.delete("/{resource_id}")
async def delete_resource(resource_id: int):
    with get_db() as conn:
        c = conn.cursor()
        # Get file path first
        c.execute("SELECT file_path FROM resources WHERE id = ?", (resource_id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Resource not found")
            
        # Delete from DB
        c.execute("DELETE FROM resources WHERE id = ?", (resource_id,))
        conn.commit()
        
        # Delete file
        try:
            os.remove(row["file_path"])
        except OSError:
            pass # File might be already gone
            
        return {"message": "Resource deleted"}
