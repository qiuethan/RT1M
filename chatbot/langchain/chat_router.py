"""
Chat Router - First layer to determine if user data is needed for the response
This saves tokens by only loading full user context when necessary
"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Literal

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

# Response schema for the router
class RouterDecision(BaseModel):
    needs_user_data: bool = Field(description="Whether this query requires user's personal/financial data")
    message_type: Literal["general", "personal", "financial", "goal_setting"] = Field(description="Type of message")
    simple_response: str = Field(description="Simple response if no user data needed, or empty string if user data needed")

# Router LLM (using cheaper/faster model)
router_llm = ChatOpenAI(
    model="gpt-3.5-turbo",  # Cheaper and faster for routing decisions
    temperature=0.1,  # Low temperature for consistent routing
    api_key=api_key,
    max_tokens=200,  # Small token limit for routing
    request_timeout=15,
)

# Router parser
router_parser = PydanticOutputParser(pydantic_object=RouterDecision)

# Router prompt
router_prompt = ChatPromptTemplate.from_template("""
You are a routing assistant for a financial planning chatbot. Your job is to determine if a user's message requires their personal/financial data to answer properly.

ROUTING RULES:
- needs_user_data = False for: General financial advice, definitions, explanations, how-to questions, general market info
- needs_user_data = True for: Personal recommendations, specific calculations using user's data, progress tracking, goal updates, personalized advice

USER MESSAGE: {input}

If needs_user_data is False, provide a helpful response in simple_response.
If needs_user_data is True, leave simple_response empty.

{format_instructions}
""")

def route_chat_message(input_text: str, user_id: str = None) -> RouterDecision:
    """
    Route the chat message to determine if user data is needed
    """
    try:
        # Sanitize input
        clean_input = sanitize_string(input_text, MAX_INPUT_LENGTH)
        
        # Create the router chain
        router_chain = router_prompt | router_llm | router_parser
        
        # Get routing decision
        decision = router_chain.invoke({
            "input": clean_input,
            "format_instructions": router_parser.get_format_instructions()
        })
        
        return decision
        
    except SecurityViolationError as e:
        log_security_event("router_security_violation", str(e), user_id)
        # Return safe routing decision
        return RouterDecision(
            needs_user_data=False,
            message_type="general",
            simple_response="I apologize, but I'm having trouble processing your request. Please try rephrasing your question about financial planning."
        )
        
    except Exception as e:
        log_security_event("router_error", str(e), user_id)
        # Default to requiring user data to be safe
        return RouterDecision(
            needs_user_data=True,
            message_type="general", 
            simple_response=""
        ) 