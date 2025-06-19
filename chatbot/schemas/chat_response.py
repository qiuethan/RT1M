from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Union

class Goal(BaseModel):
    title: str
    category: str
    status: str
    data: Optional[Dict[str, str]] = None

class ChatResponse(BaseModel):
    message: str = Field(description="What the assistant says in natural language")
    personalInfo: Optional[Dict[str, Union[str, int]]] = None
    financialInfo: Optional[Dict[str, float]] = None
    goals: Optional[List[Goal]] = None
