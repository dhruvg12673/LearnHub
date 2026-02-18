from app.db import get_db
import sqlite3

async def update_knowledge_state(user_id: int, topic: str, subtopic: str, score: int, time_taken: int):
    """
    Updates the user's knowledge state based on quiz performance.
    This is the core logic for the Digital Twin's memory of the user.
    """
    
    # Simple logic for now, can be enhanced with LLM analysis later
    new_mastery = score # Direct mapping for now
    
    status = "novice"
    if new_mastery >= 80:
        status = "expert"
    elif new_mastery >= 50:
        status = "competent"
        
    # Heuristic: If score is low but time taken is very short, they might be rushing
    if score < 40 and time_taken < 30: # Less than 30 seconds for 5 questions
        # Could flag this in a future 'learning_behavior' table
        pass

    with get_db() as conn:
        c = conn.cursor()
        
        # Check if record exists
        c.execute("""
            SELECT mastery_score FROM user_knowledge 
            WHERE user_id = ? AND topic = ? AND subtopic = ?
        """, (user_id, topic, subtopic))
        
        row = c.fetchone()
        
        if row:
            # Update existing - Weighted average to smooth progress
            current_mastery = row["mastery_score"]
            updated_mastery = int((current_mastery * 0.7) + (new_mastery * 0.3))
            
            # Update status based on new weighted mastery
            new_status = "novice"
            if updated_mastery >= 80:
                new_status = "expert"
            elif updated_mastery >= 50:
                new_status = "competent"

            c.execute("""
                UPDATE user_knowledge 
                SET mastery_score = ?, status = ?, last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND topic = ? AND subtopic = ?
            """, (updated_mastery, new_status, user_id, topic, subtopic))
        else:
            # Insert new
            c.execute("""
                INSERT INTO user_knowledge (user_id, topic, subtopic, mastery_score, status)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, topic, subtopic, new_mastery, status))
            
        conn.commit()
        
    return {"mastery": new_mastery if not row else int((row["mastery_score"] * 0.7) + (new_mastery * 0.3)), "status": status}
