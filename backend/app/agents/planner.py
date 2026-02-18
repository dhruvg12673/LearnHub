import json
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from app.core.config import settings
from app.models.roadmap import RoadmapResponse, RoadmapNode

# Initialize Ollama
llm = ChatOllama(
    base_url=settings.OLLAMA_BASE_URL,
    model="llama3:8b", # Or mistral, make sure this matches what the user has installed
    format="json",
    temperature=0.2
)

planner_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert curriculum planner. 
    Create a hierarchical learning roadmap for the given topic and difficulty level.
    
    The output must be a valid JSON object with the following structure:
    {{
        "topic": "The Topic Name",
        "roadmap": [
            {{
                "id": "1",
                "label": "Main Concept 1",
                "description": "Brief description",
                "children": [
                    {{
                        "id": "1.1",
                        "label": "Sub Concept 1.1",
                        "description": "Brief description",
                        "children": []
                    }}
                ]
            }}
        ]
    }}
    
    Rules:
    1. Break down the topic into logical steps.
    2. Ensure the difficulty matches the user's request ({difficulty}).
    3. Use nested children for subtopics.
    4. Keep descriptions concise.
    5. IMPORTANT: Generate the roadmap labels and descriptions in {language} language.
    
    User Context:
    Interest/Hobby: {interest} (Optional: Use metaphors if relevant, but keep labels technical)
    Objective: {objective} (Optional: Tailor the structure. e.g. "Exam based" = Syllabus style, "Skill based" = Practical steps)
    """),
    ("user", "Topic: {topic}\nDifficulty: {difficulty}\nLanguage: {language}\nInterest: {interest}\nObjective: {objective}")
])

chain = planner_prompt | llm | JsonOutputParser()

async def generate_roadmap(topic: str, difficulty: str, language: str = "English", interest: str = None, objective: str = None) -> RoadmapResponse:
    try:
        response = await chain.ainvoke({
            "topic": topic, 
            "difficulty": difficulty, 
            "language": language,
            "interest": interest or "General",
            "objective": objective or "General Learning"
        })
        # Validate with Pydantic to ensure structure
        return RoadmapResponse(**response)
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        # Fallback or re-raise
        raise e
