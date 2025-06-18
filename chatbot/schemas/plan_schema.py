from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class PlanStep(BaseModel):
    id: str
    title: str
    description: str
    order: int
    timeframe: str
    completed: bool
    dueDate: Optional[str] = None
    cost: Optional[float] = None
    resources: Optional[List[str]] = None

class PlanMilestone(BaseModel):
    id: str
    title: str
    description: str
    targetAmount: Optional[float] = None
    targetDate: str
    completed: bool
    completedDate: Optional[str] = None

class PlanResource(BaseModel):
    type: Literal['link', 'document', 'tool', 'contact']
    title: str
    url: Optional[str] = None
    description: Optional[str] = None

class Plan(BaseModel):
    title: str
    description: str
    timeframe: str
    category: Literal['investment', 'savings', 'debt', 'income', 'budget', 'mixed']
    priority: Literal['high', 'medium', 'low']
    steps: List[PlanStep]
    milestones: List[PlanMilestone]
    estimatedCost: Optional[float] = None
    expectedReturn: Optional[float] = None
    riskLevel: Literal['low', 'medium', 'high']
    prerequisites: Optional[List[str]] = None
    resources: Optional[List[PlanResource]] = None
