import json
import requests
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from app.core.config import settings
from app.models.content import ContentResponse

# Initialize Ollama
llm = ChatOllama(
    base_url=settings.OLLAMA_BASE_URL,
    model="llama3:8b",
    temperature=0.7
)

def search_serper(query: str, type: str = "search"):
    url = "https://google.serper.dev/search"
    if type == "images":
        url = "https://google.serper.dev/images"
    elif type == "videos":
        url = "https://google.serper.dev/videos"
        
    payload = json.dumps({
        "q": query,
        "num": 3
    })
    headers = {
        'X-API-KEY': settings.SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.request("POST", url, headers=headers, data=payload)
        return response.json()
    except Exception as e:
        print(f"Serper API Error: {e}")
        return {}

async def generate_content(topic: str, subtopic: str, mode: str, difficulty: str, language: str = "English", existing_images: list = None, existing_videos: list = None, user_status: str = "novice", interest: str = None, objective: str = None) -> ContentResponse:
    # 1. Fetch Media
    images = existing_images if existing_images else []
    videos = existing_videos if existing_videos else []
    
    if not images:
        # Search for images (excluding ResearchGate)
        img_results = search_serper(f"{subtopic} {topic} diagram schematic -site:researchgate.net", "images")
        if "images" in img_results:
            images = [img["imageUrl"] for img in img_results["images"][:3]]
            
    if not videos:
        # Search for videos
        vid_results = search_serper(f"{subtopic} {topic} explanation", "videos")
        if "videos" in vid_results:
            # Extract title and link
            videos = []
            for vid in vid_results["videos"][:3]:
                videos.append({
                    "title": vid.get("title", "Video Tutorial"),
                    "link": vid.get("link", "#")
                })

    # 2. Generate Content
    system_prompt = ""
    
    # Adaptive Learning Logic
    adaptive_instruction = ""
    if user_status == "expert":
        adaptive_instruction = "The user is an EXPERT in this topic. Skip basics. Focus on advanced nuances, edge cases, and complex applications. Challenge the user."
    elif user_status == "competent":
        adaptive_instruction = "The user is COMPETENT. Briefly review basics but focus on intermediate concepts and practical application."
    else: # novice
        adaptive_instruction = "The user is a NOVICE. Explain from first principles. Use simple language and many examples. Build a strong foundation."

    if mode == "story":
        if interest:
            system_prompt = f"You are a creative writer who explains complex topics by relating them to '{interest}'. Use analogies, characters, metaphors, and terminology strictly from the world of {interest} to explain the concept. Make it fun, engaging, and highly personalized to a fan of {interest}."
        else:
            system_prompt = "You are a creative writer. Explain the concept using analogies, characters, and a narrative structure. Make it engaging and easy to visualize."
    elif mode == "deep":
        system_prompt = "You are a research scientist. Provide a rigorous technical explanation, including mathematical definitions, edge cases, and deep theoretical context."
    elif mode == "exam":
        system_prompt = "You are a senior examiner. Provide a quick summary, key bullet points, common interview questions, and a 'cheat sheet' style overview."
    else:
        system_prompt = "You are a helpful tutor. Explain the concept clearly."

    # Objective Logic
    objective_instruction = ""
    if objective:
        if objective == "Exam based":
            objective_instruction = "The user has an UPCOMING EXAM. Focus strictly on syllabus coverage, key definitions, memorizable facts, and common exam questions. Be precise and high-yield."
        elif objective == "Conceptual":
            objective_instruction = "The user wants DEEP CONCEPTUAL UNDERSTANDING. Focus on the 'why' and 'how'. Connect ideas together. Specific facts are less important than intuition and mental models."
        elif objective == "Skill based":
            objective_instruction = "The user wants PRACTICAL SKILLS. Focus exclusively on implementation, how-to guides, real-world steps, and execution. Minimize theory."
        else: # Custom or specific text
            objective_instruction = f"The user has a specific goal: '{objective}'. Tailor all explanations to help achieve this specific goal."

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"{system_prompt}\n\nTarget Audience Difficulty: {difficulty}.\nUser Proficiency Level: {user_status.upper()}\n{adaptive_instruction}\n\nUser Objective: {objective_instruction}\n\nIMPORTANT INSTRUCTION: You must generate the entire response in the {language} language. Do not use English unless the term has no translation."),
        ("user", f"Explain the subtopic '{subtopic}' which is part of '{topic}'. Write the explanation in {language}.")
    ])

    chain = prompt | llm | StrOutputParser()
    content_text = await chain.ainvoke({})

    return ContentResponse(
        content=content_text,
        images=images,
        videos=videos,
        quiz_questions=[] # Quiz is now handled separately
    )
    
