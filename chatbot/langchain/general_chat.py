"""
General Chat Model - Lightweight financial advice without user data
Used when router determines no personal data is needed
"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel, Field

from chatbot.langchain.security import (
    sanitize_string, 
    log_security_event,
    SecurityViolationError,
    MAX_INPUT_LENGTH
)

# Load environment
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env")

# Simple response schema for general advice
class GeneralChatResponse(BaseModel):
    message: str = Field(description="General financial advice response")

# General advice LLM
general_llm = ChatOpenAI(
    model="gpt-3.5-turbo",  # Cheaper model for general advice
    temperature=0.7,
    api_key=api_key,
    max_tokens=500,  # Moderate limit for general responses
    request_timeout=20,
)

# General advice prompt
general_prompt = ChatPromptTemplate.from_messages([
    ("system", """
You are a helpful financial advisor providing general financial education and advice. 

GUIDELINES:
- Provide helpful, educational financial advice
- Use clear, simple language
- Don't ask for personal information
- Focus on general principles and strategies
- Be encouraging and supportive
- If someone asks for personalized advice, suggest they provide more details about their situation

TOPICS YOU CAN HELP WITH:
- Budgeting basics
- Saving strategies
- Investment principles
- Debt management
- Financial planning concepts
- General market information
- Financial terms and definitions

Keep responses concise but informative.
"""),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

def get_general_advice(input_text: str, history=None, user_id: str = None) -> GeneralChatResponse:
    """
    Get general financial advice without user data
    """
    try:
        # Sanitize input
        clean_input = sanitize_string(input_text, MAX_INPUT_LENGTH)
        
        # Create the chain
        chain = general_prompt | general_llm
        
        # Get response
        response = chain.invoke({
            "input": clean_input,
            "history": history or []
        })
        
        # Extract content and validate
        if hasattr(response, 'content'):
            content = response.content
        else:
            content = str(response)
        
        # Basic validation
        if len(content) > 1000:  # Reasonable limit for general advice
            content = content[:1000] + "..."
        
        return GeneralChatResponse(message=content)
        
    except SecurityViolationError as e:
        log_security_event("general_chat_security_violation", str(e), user_id)
        return GeneralChatResponse(
            message="I apologize, but I'm having trouble processing your request. Please try rephrasing your question about financial planning."
        )
        
    except Exception as e:
        log_security_event("general_chat_error", str(e), user_id)
        return GeneralChatResponse(
            message="I'm experiencing technical difficulties. For general financial advice, I'd recommend starting with creating a budget and setting clear financial goals."
        ) 