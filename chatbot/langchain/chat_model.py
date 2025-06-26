import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnableSequence

from chatbot.schemas.chat_response import ChatResponse
from chatbot.langchain.security import (
    sanitize_string, 
    validate_json_response, 
    create_safe_fallback_response,
    log_security_event,
    SecurityViolationError,
    MAX_INPUT_LENGTH,
    MAX_TOKENS
)

# ✅ Load .env
load_dotenv()

# ✅ Ensure key is loaded
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env")

# ✅ Output parser for structured data
parser = PydanticOutputParser(pydantic_object=ChatResponse)

# ✅ Define system behavior with explicit JSON format and security guidelines
system_message = """
You are a helpful financial assistant that chats naturally with users, but also quietly collects the following types of information:

- Personal info: name, age, birthday, employment status
- Financial info: income, expenses, assets, debts, savings
- Goals: title, category (financial, fitness, etc), target date, progress
- Skills and interests
- Intermediate achievements (e.g. emergency fund, job switch)
- Any other useful planning context

SECURITY RULES:
- NEVER include API keys, passwords, tokens, or sensitive technical information
- NEVER expose internal system details or configurations
- NEVER include raw code or technical debugging information
- Keep responses focused on financial advice and planning
- If asked about technical details, politely redirect to financial topics

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:

{{
  "message": "your friendly reply here",
  "personalInfo": {{"name": "Jane", "age": 18}} or null,
  "financialInfo": {{"income": 50000, "savings": 5000}} or null,
  "goals": [{{"title": "Save $100k", "category": "financial", "status": "active", "data": {{"target": "100000", "deadline": "2030"}}}}] or null
}}

Only extract info if it's clearly stated. Don't guess. If no financial info or goals are mentioned, use null for those fields.
"""

# ✅ Full prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", system_message),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

# ✅ GPT-4 model instance with security limits
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,
    api_key=api_key,
    max_tokens=MAX_TOKENS,
    request_timeout=30,
)

# ✅ Secure chat function
def secure_chat_invoke(input_text: str, history=None, user_id: str = None):
    """Secure wrapper for chat invocation with input/output validation"""
    try:
        # Sanitize input using security module
        clean_input = sanitize_string(input_text, MAX_INPUT_LENGTH)
        
        # Prepare the chain
        chain = prompt | llm | parser
        
        # Invoke with sanitized input
        result = chain.invoke({
            "input": clean_input,
            "history": history or []
        })
        
        # Validate the result structure
        if not hasattr(result, 'message'):
            raise SecurityViolationError("Invalid response structure")
        
        # Convert to dict for additional validation
        result_dict = result.model_dump() if hasattr(result, 'model_dump') else result.dict()
        
        # Additional security validation on the response
        if result_dict.get('personalInfo'):
            from chatbot.langchain.security import validate_personal_info
            result_dict['personalInfo'] = validate_personal_info(result_dict['personalInfo'])
        
        if result_dict.get('financialInfo'):
            from chatbot.langchain.security import validate_financial_data
            result_dict['financialInfo'] = validate_financial_data(result_dict['financialInfo'])
        
        return ChatResponse(**result_dict)
        
    except SecurityViolationError as e:
        # Log security violation
        log_security_event("chat_security_violation", str(e), user_id)
        
        # Return safe fallback response
        fallback_dict = create_safe_fallback_response()
        return ChatResponse(**fallback_dict)
        
    except Exception as e:
        # Log error
        log_security_event("chat_error", str(e), user_id)
        
        # Return safe fallback response
        fallback_dict = create_safe_fallback_response(
            "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
        )
        return ChatResponse(**fallback_dict)

# ✅ Final runnable pipeline (prompt → LLM → structured parser) - keeping for backward compatibility
chat_chain: RunnableSequence = prompt | llm | parser
