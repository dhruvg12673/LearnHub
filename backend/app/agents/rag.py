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

async def get_tutor_response(topic: str, message: str, history: list = []) -> str:
    # Construct history string
    history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history[-5:]]) # Limit context window to last 5
    
    prompt = ChatPromptTemplate.from_template(
        """You are a master professor in {topic}. Explain any queries asked by the user.
        Format your response nicely with markdown if needed. Be concise but helpful. 
       .
        
        Previous Conversation:
        {history}
        
        User: {message}
        Professor:"""
    )
    
    chain = prompt | llm | StrOutputParser()
    
    response = await chain.ainvoke({
        "topic": topic,
        "history": history_str,
        "message": message
    })
    
    return response
