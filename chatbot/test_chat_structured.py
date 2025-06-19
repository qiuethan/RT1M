from chatbot.langchain.chat_model import chat_chain

user_input = "Hey, I'm Jane. I'm 18 and I want to save $100k by 2030."

result = chat_chain.invoke({
    "input": user_input,
    "history": []
})

# ✅ Display the structured response
print("🤖 Assistant:", result.message)
print("\n📊 Extracted Data:")
print(f"  Personal Info: {result.personalInfo}")
print(f"  Financial Info: {result.financialInfo}")
print(f"  Goals: {result.goals}")

# ✅ Test with different input
print("\n" + "="*50)
user_input2 = "I make $75,000 per year and have $10,000 in savings. I want to buy a house in 5 years."

result2 = chat_chain.invoke({
    "input": user_input2,
    "history": []
})

print("🤖 Assistant:", result2.message)
print("\n📊 Extracted Data:")
print(f"  Personal Info: {result2.personalInfo}")
print(f"  Financial Info: {result2.financialInfo}")
print(f"  Goals: {result2.goals}")