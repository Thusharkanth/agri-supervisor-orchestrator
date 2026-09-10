from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class DecisionRecord(Base):
    """Stores every completed LangGraph decision execution for audit and evaluation."""
    __tablename__ = "decision_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    request_id = Column(String(100), nullable=True, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    crop_type = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    planting_date = Column(String(50), nullable=False)
    
    final_decision = Column(String(50), nullable=False)
    final_confidence = Column(Float, nullable=False)
    conflict_detected = Column(Boolean, default=False)
    conflict_resolution_trace = Column(Text, nullable=True)
    final_recommendation_text = Column(Text, nullable=True)
    agent_outputs_json = Column(Text, nullable=True)  # Serialized list of agent evidences

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    feedbacks = relationship("FeedbackRecord", back_populates="decision", cascade="all, delete-orphan")


class FeedbackRecord(Base):
    """Stores farmer accept / manual override feedback with rationale."""
    __tablename__ = "feedback_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    decision_id = Column(Integer, ForeignKey("decision_records.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # "ACCEPT" or "OVERRIDE"
    override_decision = Column(String(50), nullable=True)  # "IRRIGATE", "DO_NOT_IRRIGATE", "DELAY_IRRIGATION"
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    decision = relationship("DecisionRecord", back_populates="feedbacks")
