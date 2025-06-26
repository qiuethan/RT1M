"""
Test script to demonstrate the smart chat routing system
Shows token savings by routing messages appropriately
"""

from chatbot.langchain.smart_chat import smart_chat_invoke, get_chat_stats

def test_smart_chat_routing():
    """
    Test the two-layer chat system with different types of messages
    """
    
    print("🧠 Smart Chat Routing Test")
    print("=" * 50)
    
    # Test messages that should NOT need user data (general advice)
    general_messages = [
        "What is a 401k?",
        "How does compound interest work?", 
        "What are the basics of budgeting?",
        "Should I invest in stocks or bonds?",
        "What's the difference between a Roth and traditional IRA?"
    ]
    
    # Test messages that SHOULD need user data (personalized advice)
    personal_messages = [
        "How much should I save based on my income?",
        "Am I on track for my retirement goals?",
        "Should I pay off my debt or invest?",
        "What's my net worth?",
        "How much emergency fund do I need?"
    ]
    
    print("\n🎯 GENERAL MESSAGES (Should use lightweight model):")
    print("-" * 30)
    
    for msg in general_messages:
        print(f"\n💬 User: {msg}")
        response = smart_chat_invoke(msg, user_id="test_user")
        print(f"🤖 Bot: {response.message[:100]}...")
        print(f"📊 Used user data: {response.used_user_data}")
        print(f"💰 Token savings: {'✅ HIGH' if not response.used_user_data else '❌ NONE'}")
    
    print("\n\n🎯 PERSONAL MESSAGES (Should route to full model):")
    print("-" * 30)
    
    # Mock user profile
    mock_user_profile = {
        "age": 30,
        "income": 75000,
        "savings": 25000,
        "debt": 15000,
        "goals": [{"title": "Buy a house", "target": "2 years"}]
    }
    
    for msg in personal_messages:
        print(f"\n💬 User: {msg}")
        response = smart_chat_invoke(msg, user_profile=mock_user_profile, user_id="test_user")
        print(f"🤖 Bot: {response.message[:100]}...")
        print(f"📊 Used user data: {response.used_user_data}")
        print(f"💰 Token usage: {'⚡ FULL' if response.used_user_data else '✅ LIGHT'}")
    
    print("\n\n📈 ESTIMATED TOKEN SAVINGS:")
    print("-" * 30)
    stats = get_chat_stats()
    for key, value in stats.items():
        print(f"• {key}: {value}")

if __name__ == "__main__":
    test_smart_chat_routing() 