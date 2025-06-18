from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(model="gpt-4", temperature=0.3)

msg = [HumanMessage(content="What is 2 + 2?")]
response = llm.invoke(msg)
print("Response:", response.content)
