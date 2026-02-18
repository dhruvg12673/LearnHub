from pydantic import BaseModel
from typing import List, Optional, Any, Union

class ContentRequest(BaseModel):
    topic: str
    subtopic: str
    mode: str = "story" # story, deep, exam
    difficulty: str = "Normal"
    language: str = "English"
    interest: Optional[str] = None
    images: Optional[List[str]] = None
    videos: Optional[List[Union[str, dict]]] = None

class ContentResponse(BaseModel):
    content: str
    images: List[str] = []
    videos: List[Union[str, dict]] = []
    quiz_questions: List[dict] = []
