from chatbot.langchain.chat_model import chat_chain

# Simulated local profile (not Firestore)
profile = {}

while True:
    user_input = input("You: ")
    if user_input.lower() in ("exit", "quit"):
        break

    try:
        # Get structured response from AI
        result = chat_chain.run(user_input)

        # Print the natural message
        print(f"\n🤖 Bot:\n{result.message}")

        # Print structured data (if any)
        structured = result.dict(exclude_none=True)
        del structured["message"]
        if structured:
            print("\n📦 Extracted data:")
            for key, val in structured.items():
                print(f"  {key}: {val}")
        else:
            print("\n📦 No structured data extracted.")
    except Exception as e:
        print(f"❌ Error: {e}")
from langchain.chat_model import chat_chain  # adjust path if needed

# Simulated local profile (not Firestore)
profile = {}

while True:
    user_input = input("You: ")
    if user_input.lower() in ("exit", "quit"):
        break

    try:
        # Get structured response from AI
        result = chat_chain.run(user_input)

        # Print the natural message
        print(f"\n🤖 Bot:\n{result.message}")

        # Print structured data (if any)
        structured = result.dict(exclude_none=True)
        del structured["message"]
        if structured:
            print("\n📦 Extracted data:")
            for key, val in structured.items():
                print(f"  {key}: {val}")
        else:
            print("\n📦 No structured data extracted.")
    except Exception as e:
        print(f"❌ Error: {e}")
