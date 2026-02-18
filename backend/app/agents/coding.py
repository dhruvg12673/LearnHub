from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.core.config import settings

# Initialize Ollama
llm = ChatOllama(
    base_url=settings.OLLAMA_BASE_URL,
    model="llama3:8b",
    temperature=0.7
)

async def get_tutor_response(history: list, user_message: str, language: str) -> str:
    """
    Generates a response from the coding tutor.
    history: List of {"role": "user" | "assistant", "content": "..."}
    """
    
    system_prompt = f"""You are an expert Coding Tutor and Interviewer specializing in {language}.
    Your goal is to help the user practice coding by assigning them small, specific problems or discussing concepts.
    
    GUIDELINES:
    1. Do NOT write the full solution code for the user unless they have failed multiple times or explicitly asked for the answer.
    2. Guide them with hints, psuedocode, or conceptual explanations.
    3. If the user asks for a problem, give them a clear, concise problem statement suitable for an interview or practice.
    4. Be encouraging but rigorous.
    
    Current Language Context: {language}
    """
    
    messages = [("system", system_prompt)]
    
    for msg in history:
        messages.append((msg["role"], msg["content"]))
        
    messages.append(("user", user_message))
    
    prompt = ChatPromptTemplate.from_messages(messages)
    chain = prompt | llm | StrOutputParser()
    
    return chain.astream({}) 


async def analyze_code(code: str, problem: str, language: str) -> str:
    """
    Analyzes the user's solution.
    """
    system_template = """You are a Code Reviewer and Static Analysis Tool for {language}.
    
    Task: Analyze the user's code solution for the following problem:
    "{problem}"
    
    User's Code:
    ```{language}
    {code}
    ```
    
    OUTPUT FORMAT (Markdown):
    1. **Correctness**: Does it solve the problem? (Yes/No/Partially)
    2. **Logic Check**: Are there edge cases missed?
    3. **Efficiency**: Time/Space complexity analysis.
    4. **Style**: Variable naming, indentation, best practices.
    5. **Constructive Feedback**: Specific tips to improve.
    
    Be concise but thorough. If the code is dangerous or completely wrong, explain why.
    """
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        ("user", "Analyze my solution.")
    ])
    
    chain = prompt | llm | StrOutputParser()
    return await chain.ainvoke({
        "language": language,
        "problem": problem,
        "code": code
    })
