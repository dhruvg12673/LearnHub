from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.db import get_db
import sqlite3
import hashlib

router = APIRouter()

class UserAuth(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/signup", response_model=UserResponse)
async def signup(user: UserAuth):
    with get_db() as conn:
        c = conn.cursor()
        try:
            c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", 
                     (user.username, hash_password(user.password)))
            conn.commit()
            return {"id": c.lastrowid, "username": user.username}
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Username already exists")

@router.post("/login", response_model=UserResponse)
async def login(user: UserAuth):
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT id, username FROM users WHERE username = ? AND password_hash = ?", 
                 (user.username, hash_password(user.password)))
        user_data = c.fetchone()
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        return {"id": user_data["id"], "username": user_data["username"]}
