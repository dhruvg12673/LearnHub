from pydantic import BaseModel
from typing import List, Optional

class RoadmapRequest(BaseModel):
    topic: str
    difficulty: str = "Normal"
    language: str = "English"
    interest: Optional[str] = None
    objective: Optional[str] = None

class RoadmapNode(BaseModel):
    id: str
    label: str
    description: str
    children: List['RoadmapNode'] = []
    mastery_score: Optional[int] = 0
    status: Optional[str] = "novice"

class RoadmapResponse(BaseModel):
    topic: str
    difficulty: str = "Normal"
    language: str = "English"
    interest: Optional[str] = None
    objective: Optional[str] = None
    roadmap: List[RoadmapNode]
    nodes: Optional[List[dict]] = None
    edges: Optional[List[dict]] = None

class RoadmapUpdateRequest(BaseModel):
    nodes: List[dict]
    edges: List[dict]
