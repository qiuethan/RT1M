"""
Smart Chat Orchestrator - Two-layer system to optimize token usage
1. Router determines if user data is needed
2. Routes to appropriate chat model
"""

from typing import Dict, Any, Optional, List
from chatbot.langchain.chat_router import route_chat_message, RouterDecision
from chatbot.langchain.general_chat import get_general_advice, GeneralChatResponse
from chatbot.langchain.chat_model import secure_chat_invoke
from chatbot.schemas.chat_response import ChatResponse
from chatbot.langchain.security import log_security_event

class SmartChatResponse:
    """
    Unified response class that works with both general and full chat responses
    """
    def __init__(self, message: str, personalInfo=None, financialInfo=None, goals=None, used_user_data=False):
        self.message = message
        self.personalInfo = personalInfo
        self.financialInfo = financialInfo
        self.goals = goals
        self.used_user_data = used_user_data  # Track which layer was used

def smart_chat_invoke(
    input_text: str, 
    user_profile: Optional[Dict[str, Any]] = None,
    history: Optional[List] = None,
    user_id: Optional[str] = None
) -> SmartChatResponse:
    """
    Smart chat that routes messages efficiently to save tokens
    
    Args:
        input_text: User's message
        user_profile: User's data (only loaded if needed)
        history: Chat history
        user_id: User identifier for logging
    
    Returns:
        SmartChatResponse with the appropriate response
    """
    try:
        # LAYER 1: Route the message
        log_security_event("chat_routing_start", f"Message length: {len(input_text)}", user_id)
        
        routing_decision: RouterDecision = route_chat_message(input_text, user_id)
        
        # LAYER 2a: Handle general advice (no user data needed)
        if not routing_decision.needs_user_data:
            log_security_event("chat_using_general", f"Message type: {routing_decision.message_type}", user_id)
            
            # Use router's simple response if provided, otherwise get detailed general advice
            if routing_decision.simple_response and len(routing_decision.simple_response.strip()) > 10:
                return SmartChatResponse(
                    message=routing_decision.simple_response,
                    used_user_data=False
                )
            else:
                # Get more detailed general advice
                general_response: GeneralChatResponse = get_general_advice(input_text, history, user_id)
                return SmartChatResponse(
                    message=general_response.message,
                    used_user_data=False
                )
        
        # LAYER 2b: Handle personalized advice (user data needed)
        else:
            log_security_event("chat_using_full_context", f"Message type: {routing_decision.message_type}", user_id)
            
            # Check if user profile is available
            if not user_profile:
                return SmartChatResponse(
                    message="I'd be happy to provide personalized advice! To give you the best recommendations, could you share some details about your financial situation, goals, or what specific area you'd like help with?",
                    used_user_data=False
                )
            
            # Use full chat model with user data
            full_response: ChatResponse = secure_chat_invoke(input_text, history, user_id)
            
            return SmartChatResponse(
                message=full_response.message,
                personalInfo=full_response.personalInfo,
                financialInfo=full_response.financialInfo,
                goals=full_response.goals,
                used_user_data=True
            )
            
    except Exception as e:
        log_security_event("smart_chat_error", str(e), user_id)
        
        # Safe fallback
        return SmartChatResponse(
            message="I apologize, but I'm experiencing technical difficulties. Please try rephrasing your question about financial planning.",
            used_user_data=False
        )

def get_chat_stats() -> Dict[str, Any]:
    """
    Get statistics about chat usage (for monitoring token efficiency)
    In production, this would pull from actual logs/metrics
    """
    return {
        "total_chats": "tracked_in_production",
        "general_advice_chats": "saves_~60%_tokens",
        "full_context_chats": "uses_full_tokens",
        "token_savings_estimate": "30-70%_depending_on_usage_pattern"
    }

# Backward compatibility functions
def chat_with_smart_routing(input_text: str, user_data: Dict[str, Any] = None, history=None, user_id=None):
    """
    Backward compatible function for existing integrations
    """
    response = smart_chat_invoke(input_text, user_data, history, user_id)
    
    # Convert to ChatResponse format for compatibility
    return ChatResponse(
        message=response.message,
        personalInfo=response.personalInfo,
        financialInfo=response.financialInfo,
        goals=response.goals
    ) 