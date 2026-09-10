from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Any
from datetime import datetime
from app.graph.state import AgentEvidence


class DecisionRequest(BaseModel):
    """Payload sent by farmer or IoT gateway to request an irrigation advisory."""
    farm_id: str = Field(..., example="FARM-LK-001", description="Unique identifier for the farm/field")
    crop_type: str = Field(..., example="Maize", description="Crop species name (e.g. Maize, Tomato, Paddy)")
    latitude: float = Field(..., example=8.3114, ge=-90.0, le=90.0, description="Latitude coordinates")
    longitude: float = Field(..., example=80.4037, ge=-180.0, le=180.0, description="Longitude coordinates")
    planting_date: str = Field(..., example="2026-07-15", description="Planting date in YYYY-MM-DD format")
    request_id: Optional[str] = Field(None, description="Optional client idempotency key")


class DecisionResponse(BaseModel):
    """Comprehensive decision package returned to the Farmer Dashboard."""
    decision_id: Optional[int] = None
    request_id: Optional[str] = None
    farm_id: str
    crop_type: str
    latitude: float
    longitude: float
    planting_date: str
    final_decision: Literal["IRRIGATE", "DO_NOT_IRRIGATE", "DELAY_IRRIGATION"]
    final_confidence: float
    conflict_detected: bool
    conflict_resolution_trace: Optional[str] = None
    final_recommendation_text: Optional[str] = None
    agent_outputs: List[AgentEvidence]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class FeedbackRequest(BaseModel):
    """Farmer acceptance or manual override payload."""
    decision_id: int = Field(..., description="Database ID of the decision being reviewed")
    action: Literal["ACCEPT", "OVERRIDE"] = Field(..., description="Action chosen by the farmer")
    override_decision: Optional[Literal["IRRIGATE", "DO_NOT_IRRIGATE", "DELAY_IRRIGATION"]] = Field(
        None, description="New decision chosen if overriding"
    )
    notes: Optional[str] = Field(
        None, description="Farmer reasoning or field observations (e.g., unexpected canal water arrived)"
    )


class FeedbackResponse(BaseModel):
    status: str = "success"
    message: str
    feedback_id: int
    decision_id: int
    action: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
