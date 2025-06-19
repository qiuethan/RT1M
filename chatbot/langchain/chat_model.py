import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnableSequence

from chatbot.schemas.chat_response import ChatResponse

# ✅ Load .env
load_dotenv()

# ✅ Ensure key is loaded
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env")

# ✅ Output parser for structured data
parser = PydanticOutputParser(pydantic_object=ChatResponse)

# ✅ Define system behavior with explicit JSON format
system_message = """
You are a helpful assistant that chats naturally with users, but also quietly collects the following types of information:

- Personal info: name, age, birthday, employment status
- Financial info: income, expenses, assets, debts, savings
- Goals: title, category (financial, fitness, etc), target date, progress
- Skills and interests
- Intermediate achievements (e.g. emergency fund, job switch)
- Any other useful planning context

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:

{{
  "message": "your friendly reply here",
  "personalInfo": {{"name": "Jane", "age": 18}} or null,
  "financialInfo": {{"income": 50000, "savings": 5000}} or null,
  "goals": [{{"title": "Save $100k", "category": "financial", "status": "active", "data": {{"target": "100000", "deadline": "2030"}}}}] or null
}}

Only extract info if it's clearly stated. Don't guess. If no financial info or goals are mentioned, use null for those fields.
"""

# ✅ Full prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", system_message),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

# ✅ GPT-4 model instance
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,
    api_key=api_key
)

# ✅ Final runnable pipeline (prompt → LLM → structured parser)
chat_chain: RunnableSequence = prompt | llm | parser
