def get_generate_plan_prompt(user_profile: dict, goal_data: dict, format_instructions: str) -> str:
    return f"""
You are a financial planning assistant.

Using the user's profile and goal details below, generate a detailed and realistic financial plan. 
Respond ONLY with a valid JSON object that matches the schema described.

{format_instructions}

User Profile:
{user_profile}

Goal:
{goal_data}
"""