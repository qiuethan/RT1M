from chatbot.langchain.model import llm
from chatbot.langchain.parser import plan_parser, format_instructions
from chatbot.prompts.generate_plan_prompt import get_generate_plan_prompt
from langchain.schema import HumanMessage
from chatbot.langchain.security import (
    sanitize_dict,
    sanitize_string, 
    log_security_event,
    SecurityViolationError,
    MAX_INPUT_LENGTH
)

import openai

# Plan-specific security configurations
MAX_STEPS = 10
MAX_MILESTONES = 10
MAX_PLAN_TITLE_LENGTH = 100
MAX_STEP_DESCRIPTION_LENGTH = 500



def validate_plan_response(parsed_plan: dict) -> dict:
    """Validate and sanitize the generated plan response"""
    if not isinstance(parsed_plan, dict):
        raise SecurityViolationError("Plan response must be a dictionary")
    
    # Use the centralized sanitization
    sanitized_plan = sanitize_dict(parsed_plan)
    
    # Plan-specific validations
    if 'steps' in sanitized_plan and isinstance(sanitized_plan['steps'], list):
        if len(sanitized_plan['steps']) > MAX_STEPS:
            raise SecurityViolationError(f"AI returned too many steps ({len(sanitized_plan['steps'])}). Limit is {MAX_STEPS}.")
        
        for i, step in enumerate(sanitized_plan['steps']):
            if isinstance(step, dict) and 'description' in step:
                desc = str(step['description'])
                if len(desc) > MAX_STEP_DESCRIPTION_LENGTH:
                    raise SecurityViolationError(f"Step {i+1} description too long")

    # Validate milestones
    if 'milestones' in sanitized_plan and isinstance(sanitized_plan['milestones'], list):
        if len(sanitized_plan['milestones']) > MAX_MILESTONES:
            raise SecurityViolationError(f"AI returned too many milestones ({len(sanitized_plan['milestones'])}). Limit is {MAX_MILESTONES}.")
    
    # Validate title length if present
    if 'title' in sanitized_plan and isinstance(sanitized_plan['title'], str):
        if len(sanitized_plan['title']) > MAX_PLAN_TITLE_LENGTH:
            raise SecurityViolationError("Plan title too long")
    
    return sanitized_plan

def create_fallback_plan() -> dict:
    """Create a safe fallback plan when errors occur"""
    return {
        "title": "Financial Planning Guide",
        "steps": [
            {
                "title": "Assessment",
                "description": "Review your current financial situation and goals",
                "duration": "1 week"
            },
            {
                "title": "Planning", 
                "description": "Create a detailed financial plan based on your assessment",
                "duration": "2 weeks"
            },
            {
                "title": "Implementation",
                "description": "Begin implementing your financial plan step by step",
                "duration": "Ongoing"
            }
        ],
        "milestones": [
            {
                "title": "Plan Created",
                "description": "Complete your initial financial plan",
                "target_date": "1 month"
            }
        ]
    }

def generate_plan(user_profile: dict, goal_data: dict, user_id: str = None) -> dict:
    """Generate a financial plan with comprehensive security validations"""
    try:
        # Validate and sanitize inputs using centralized security
        validated_profile = sanitize_dict(user_profile, MAX_INPUT_LENGTH)
        validated_goal = sanitize_dict(goal_data, MAX_INPUT_LENGTH)
        
        # Generate the prompt with validated data
        prompt = get_generate_plan_prompt(validated_profile, validated_goal, format_instructions)
        
        # Validate prompt length
        if len(prompt) > MAX_INPUT_LENGTH * 2:
            raise SecurityViolationError("Generated prompt too large")
        
        message = HumanMessage(content=prompt)

        # Call the LLM with timeout protection
        try:
            response = llm.invoke([message])
        except openai.OpenAIError as e:
            raise RuntimeError(f"OpenAI call failed: {e}")
        except Exception as e:
            raise RuntimeError(f"LLM invocation failed: {e}")
        
        # Parse the response
        if not response or not hasattr(response, 'content') or not response.content:
            raise SecurityViolationError("Empty or invalid response from LLM")
        
        parsed = plan_parser.parse(response.content)
        
        # Convert to dict and sanitize
        plan_dict = parsed.model_dump() if hasattr(parsed, 'model_dump') else parsed.dict()
        
        # Final security validation
        sanitized_plan = validate_plan_response(plan_dict)
        
        return sanitized_plan
        
    except SecurityViolationError as e:
        # Log security violation
        log_security_event("plan_security_violation", str(e), user_id)
        # Re-raise for caller to handle
        raise e
        
    except Exception as e:
        # Log the error and return a safe fallback
        log_security_event("plan_generation_error", str(e), user_id)
        
        # Return a safe fallback plan
        return create_fallback_plan()
