from chatbot.langchain.generate_plan import generate_plan

def handle_plan_request(user_profile: dict, goal_data: dict) -> dict:
    try:
        plan = generate_plan(user_profile, goal_data)
        return { "success": True, "plan": plan }
    except Exception as e:
        print("Plan generation error:", e)
        return { "success": False, "error": str(e) }
