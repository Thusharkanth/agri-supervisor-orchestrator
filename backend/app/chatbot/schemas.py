from typing import Optional, List
from pydantic import BaseModel, Field


class AgentEvidenceItem(BaseModel):
    agent_name: str
    claim: str
    recommended_volume_liters_sqm: float = 0.0
    confidence_score: float = 0.0
    primary_evidence: str = ""


class ChatAdvisoryRequest(BaseModel):
    question: str = Field(..., description="Farmer's question in natural language")
    crop_type: str = Field("Maize", description="Crop species")
    planting_date: Optional[str] = None
    farm_id: Optional[str] = "FARM-01"
    decision: Optional[str] = Field("IRRIGATE", description="Current multi-agent decision")
    confidence: Optional[float] = Field(0.90, description="Decision confidence")
    volume_liters_sqm: Optional[float] = Field(0.0, description="Recommended water volume")
    evidence_summary: Optional[str] = None
    conflict_trace: Optional[str] = None
    agent_outputs: Optional[List[AgentEvidenceItem]] = []


class ChatAdvisoryResponse(BaseModel):
    answer: str
    action_tip: str
    suggested_followups: List[str]
