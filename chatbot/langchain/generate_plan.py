from chatbot.langchain.model import llm
from chatbot.langchain.parser import plan_parser, format_instructions
from chatbot.prompts.generate_plan_prompt import get_generate_plan_prompt
from langchain.schema import HumanMessage

import openai

def generate_plan(user_profile: dict, goal_data: dict) -> dict:
    prompt = get_generate_plan_prompt(user_profile, goal_data, format_instructions)
    message = HumanMessage(content=prompt)

    try:
        response = llm.invoke([message])
    except openai.OpenAIError as e:
        raise RuntimeError(f"OpenAI call failed: {e}")
    
    parsed = plan_parser.parse(response.content)

    # ✅ ADD THIS — Guardrails
    MAX_STEPS = 10
    MAX_MILESTONES = 10

    if len(parsed.steps) > MAX_STEPS:
        raise ValueError(f"AI returned too many steps ({len(parsed.steps)}). Limit is {MAX_STEPS}.")

    if len(parsed.milestones) > MAX_MILESTONES:
        raise ValueError(f"AI returned too many milestones ({len(parsed.milestones)}). Limit is {MAX_MILESTONES}.")

    return parsed.dict()
