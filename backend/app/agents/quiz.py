import json
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from app.core.config import settings

# Initialize Ollama
llm = ChatOllama(
    base_url=settings.OLLAMA_BASE_URL,
    model="llama3:8b",
    temperature=0.7
)

async def generate_quiz_questions(topic: str, subtopic: str, difficulty: str, language: str = "English", num_questions: int = 5, user_status: str = "novice"):
    
    # Adaptive Logic
    adaptive_instruction = ""
    if user_status == "expert":
        adaptive_instruction = "The user is an EXPERT. Generate challenging questions that test deep understanding, edge cases, and application. Avoid simple recall questions."
    elif user_status == "competent":
        adaptive_instruction = "The user is COMPETENT. Mix intermediate and advanced questions. Focus on application and analysis."
    else:
        adaptive_instruction = "The user is a NOVICE. Focus on foundational concepts, definitions, and basic understanding. Keep questions straightforward."

    quiz_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert quiz generator. Create {num_questions} multiple choice questions to test the user's understanding of the subtopic.
        
        Target Audience Difficulty: {difficulty}
        User Proficiency Level: {user_status}
        {adaptive_instruction}
        Language: {language}
        
        Return ONLY a raw JSON array of objects. Do not include any markdown formatting like ```json or ```. Do not include any introductory text.
        Ensure the JSON is valid. Keys must be double-quoted. Numbers should not be quoted unless necessary.
        Do not output any conversational text or role labels like 'assistant'.
        The structure must be:
        [
            {{
                "id": 1,
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "The correct option text (must match one of the options exactly)",
                "explanation": "Brief explanation of why this is correct"
            }}
        ]
        """),
        ("user", f"Create a quiz for the subtopic '{subtopic}' which is part of '{topic}'.")
    ])
    
    chain = quiz_prompt | llm | StrOutputParser()
    
    try:
        result_text = await chain.ainvoke({
            "topic": topic,
            "subtopic": subtopic,
            "difficulty": difficulty,
            "language": language,
            "num_questions": num_questions,
            "user_status": user_status,
            "adaptive_instruction": adaptive_instruction
        })
        
        # Clean up the text
        cleaned_text = result_text.strip()
        
        # Extract JSON array if embedded in text
        start = cleaned_text.find('[')
        end = cleaned_text.rfind(']')
        if start != -1 and end != -1:
            cleaned_text = cleaned_text[start:end+1]
            
        # Attempt to fix common JSON errors from LLMs
        import re
        # Fix: "id": 4" -> "id": 4
        cleaned_text = re.sub(r'"id":\s*(\d+)"', r'"id": \1', cleaned_text)
        # Fix trailing commas before closing braces/brackets
        cleaned_text = re.sub(r',\s*([\]}])', r'\1', cleaned_text)
        
        questions = json.loads(cleaned_text)
        return questions
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        try:
            print(f"Failed JSON content: {cleaned_text}")
        except:
            pass
        return []

async def generate_quiz_review(topic: str, subtopic: str, score: int, total_questions: int, time_taken: int, attempt_data: list):
    """
    Generates a detailed review of the user's quiz performance.
    """
    
    review_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert AI Tutor and Reviewer. Your goal is to provide a constructive, detailed, and personalized review of a student's quiz performance.
        
        The student has just completed a quiz on "{subtopic}" (part of "{topic}").
        
        You will be provided with:
        - Score
        - Time taken
        - Detailed question-by-question breakdown (including their answers and the correct answers)
        
        Your review should include:
        1. **Performance Summary**: A brief overview of how they did.
        2. **Strengths**: What they clearly understand (based on correct answers).
        3. **Areas for Improvement**: specific concepts they missed and why (based on incorrect answers).
        4. **Time Management**: Comment on if they were too fast (rushing) or took their time.
        5. **Actionable Advice**: What they should study next or focus on.
        
        Tone: Encouraging, professional, yet critical enough to help them learn. Address the student directly as "you".
        Format: Use Markdown for headings, bullet points, and bold text. Keep it concise but impactful.
        """),
        ("user", """
        Topic: {topic}
        Subtopic: {subtopic}
        Score: {score}% ({correct}/{total})
        Total Time Taken: {time_taken} seconds
        
        Attempt Details:
        {attempt_data}
        """)
    ])
    
    chain = review_prompt | llm | StrOutputParser()
    
    try:
        # Format attempt data for the prompt to be readable
        formatted_data = json.dumps(attempt_data, indent=2)
        correct_count = int((score / 100) * total_questions)
        
        review = await chain.ainvoke({
            "topic": topic,
            "subtopic": subtopic,
            "score": score,
            "correct": correct_count,
            "total": total_questions,
            "time_taken": time_taken,
            "attempt_data": formatted_data
        })
        return review
    except Exception as e:
        print(f"Review Generation Error: {e}")
        return "Unable to generate review at this time."

