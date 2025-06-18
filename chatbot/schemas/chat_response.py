from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class Goal(BaseModel):
    title: str
    category: str
    status: str
    data: Optional[Dict[str, str]]

class ChatResponse(BaseModel):
    message: str = Field(description="What the assistant says in natural language")
    financialInfo: Optional[Dict[str, float]] = None
    goals: Optional[List[Goal]] = None
