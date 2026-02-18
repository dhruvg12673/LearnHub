from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import roadmap, content, auth, quiz, coding, resources, tutor
from app.db import init_db

app = FastAPI(title="AI EdTech Backend", version="1.0.0")

# Initialize Database
init_db()

# CORS Configuration
origins = [
    "http://localhost:5173", # Vite default port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(coding.router, prefix="/api/coding", tags=["coding"])
app.include_router(resources.router, prefix="/api/resources", tags=["resources"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["tutor"])

@app.get("/")
async def root():
    return {"message": "AI EdTech Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "ollama_url": settings.OLLAMA_BASE_URL}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
