import operator
from typing import Annotated, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class AgentEvidence(BaseModel):
    """
    Evidence packet produced by each domain agent node.
    The coordinator reads all of these to make the final decision.
    """
    agent_name: str
    claim: Literal["IRRIGATE", "DO_NOT_IRRIGATE", "DELAY_IRRIGATION", "NEUTRAL"]
    recommended_volume_liters_sqm: float = 0.0
    confidence_score: float = Field(ge=0.0, le=1.0)
    primary_evidence: str  # Human-readable reason string
    telemetry_timestamp: datetime
    data_freshness_seconds: int
    staleness_warning: bool = False  # True if data is older than the SLA limit


class OverallGraphState(BaseModel):
    """
    The shared state object that flows through the entire LangGraph.

    Key design: agent_outputs uses operator.add as a reducer.
    This means when 3 agents run in PARALLEL and each returns
    a new list with one item, Python safely MERGES them into one list.
    Without this, parallel writes would overwrite each other.
    """
    # ── Input fields (set by the API before the graph runs) ───────────────────
    farm_id: str
    crop_type: str
    latitude: float
    longitude: float
    planting_date: str  # ISO format: "2026-07-01"

    # ── Parallel agent outputs (operator.add merges concurrent writes safely) ──
    agent_outputs: Annotated[List[AgentEvidence], operator.add] = []

    # ── Coordinator outputs (set after fan-in is complete) ─────────────────────
    conflict_detected: bool = False
    conflict_resolution_trace: Optional[str] = None
    final_decision: Optional[Literal["IRRIGATE", "DO_NOT_IRRIGATE", "DELAY_IRRIGATION"]] = None
    final_confidence: Optional[float] = None
    final_recommendation_text: Optional[str] = None
