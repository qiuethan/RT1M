import os
from dotenv import load_dotenv

load_dotenv()

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain.output_parsers import PydanticOutputParser

from chatbot.schemas.chat_response import ChatResponse

parser = PydanticOutputParser(pydantic_object=ChatResponse)

system_prompt = SystemMessagePromptTemplate.from_template("""
You are a helpful assistant that chats naturally with users, but also quietly collects the following types of information:

- Personal info: name, age, birthday, employment status
- Financial info: income, expenses, assets, debts, savings
- Goals: title, category (financial, fitness, etc), target date, progress
- Skills and interests
- Intermediate achievements (e.g. emergency fund, job switch)
- Any other useful planning context

After every message, return:
1. A natural message reply
2. A JSON object with any extracted data

Only extract info if it's clearly stated. Don't guess.
""")

prompt = ChatPromptTemplate.from_messages([
    system_prompt,
    MessagesPlaceholder(variable_name="history"),
    ChatPromptTemplate.from_template("User: {input}")
])

llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
)

memory = ConversationBufferMemory(return_messages=True)

chat_chain = LLMChain(
    llm=llm,
    prompt=prompt.partial(format_instructions=parser.get_format_instructions()),
    output_parser=parser,
    memory=memory,
    verbose=True
)
