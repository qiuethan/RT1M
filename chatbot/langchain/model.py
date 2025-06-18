from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY"),
    max_tokens=1000,         # ✅ Limit output length
    timeout=30               # ✅ Cancel after 30s
)
