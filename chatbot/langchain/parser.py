from langchain.output_parsers import PydanticOutputParser
from chatbot.schemas.plan_schema import Plan

plan_parser = PydanticOutputParser(pydantic_object=Plan)
format_instructions = plan_parser.get_format_instructions()
