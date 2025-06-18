from chatbot.langchain.chat_model import chat_chain
from chatbot.firestore.profile_api import get_user_profile, update_user_profile
from chatbot.utils.extract_fields import extract_known_fields
from chatbot.utils.readiness import is_any_goal_ready

def handle_chat_message(user_id: str, message: str) -> str:
    profile = get_user_profile(user_id) or {}

    # 🧠 Let the LLM generate a natural response
    response = chat_chain.run(message)

    # 📥 Extract any structured info from user message
    new_data = extract_known_fields(message)
    if new_data:
        for section, updates in new_data.items():
            if section == "goals":
                profile.setdefault("goals", [])
                for g in updates:
                    exists = next((x for x in profile["goals"] if x["title"] == g["title"]), None)
                    if not exists:
                        profile["goals"].append(g)
            else:
                profile.setdefault(section, {}).update(updates)

        update_user_profile(user_id, profile)

    # ✅ If any goal is ready, add prompt
    if is_any_goal_ready(profile.get("goals", [])):
        response += "\n\n✅ I think you’re ready to generate a plan for one of your goals!"

    return response
