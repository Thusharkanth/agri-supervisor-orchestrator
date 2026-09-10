import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.schemas.decision import (
    DecisionRequest,
    DecisionResponse,
    FeedbackRequest,
    FeedbackResponse,
)
from app.graph.state import OverallGraphState, AgentEvidence
from app.graph.workflow import agri_graph
from app.services.db import get_db
from app.db.models import DecisionRecord, FeedbackRecord

logger = logging.getLogger("agri.api.decisions")
router = APIRouter()


@router.post(
    "/irrigate",
    response_model=DecisionResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute multi-agent irrigation decision graph",
    description=(
        "Triggers the LangGraph Parallel Fan-Out / Fan-In pipeline across Soil, Weather, "
        "and Crop agents, then resolves any agronomic conflicts in the Coordinator."
    ),
)
async def request_irrigation_decision(
    payload: DecisionRequest,
    db: AsyncSession = Depends(get_db),
) -> DecisionResponse:
    logger.info(f"Received irrigation advisory request for farm={payload.farm_id}, crop={payload.crop_type}")

    # 1. Prepare initial graph state
    initial_state = OverallGraphState(
        farm_id=payload.farm_id,
        crop_type=payload.crop_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        planting_date=payload.planting_date,
    )

    # 2. Run LangGraph Multi-Agent Orchestrator
    try:
        graph_result = await agri_graph.ainvoke(initial_state.model_dump())
    except Exception as exc:
        logger.error(f"LangGraph execution error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent workflow execution failed: {str(exc)}",
        )

    # 3. Format Agent Evidence list
    raw_outputs = graph_result.get("agent_outputs", [])
    parsed_evidences: List[AgentEvidence] = []
    for item in raw_outputs:
        if isinstance(item, dict):
            parsed_evidences.append(AgentEvidence(**item))
        else:
            parsed_evidences.append(item)

    final_decision = graph_result.get("final_decision", "DELAY_IRRIGATION")
    final_confidence = graph_result.get("final_confidence", 0.70)
    conflict_detected = graph_result.get("conflict_detected", False)
    conflict_trace = graph_result.get("conflict_resolution_trace", "")
    recommendation_text = graph_result.get("final_recommendation_text", "")

    # 4. Save Decision Record to PostgreSQL for audit / evaluation
    decision_id = None
    try:
        serialized_outputs = json.dumps([ev.model_dump() for ev in parsed_evidences], default=str)
        record = DecisionRecord(
            request_id=payload.request_id,
            farm_id=payload.farm_id,
            crop_type=payload.crop_type,
            latitude=payload.latitude,
            longitude=payload.longitude,
            planting_date=payload.planting_date,
            final_decision=final_decision,
            final_confidence=final_confidence,
            conflict_detected=conflict_detected,
            conflict_resolution_trace=conflict_trace,
            final_recommendation_text=recommendation_text,
            agent_outputs_json=serialized_outputs,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        decision_id = record.id
    except Exception as db_err:
        logger.warning(f"Could not persist decision record to DB ({db_err}). Response delivered safely.")

    return DecisionResponse(
        decision_id=decision_id,
        request_id=payload.request_id,
        farm_id=payload.farm_id,
        crop_type=payload.crop_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        planting_date=payload.planting_date,
        final_decision=final_decision,
        final_confidence=final_confidence,
        conflict_detected=conflict_detected,
        conflict_resolution_trace=conflict_trace,
        final_recommendation_text=recommendation_text,
        agent_outputs=parsed_evidences,
    )


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit farmer acceptance or manual override",
    description="Captures human-in-the-loop review to expand the evaluation dataset and train future iterations.",
)
async def submit_farmer_feedback(
    payload: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    logger.info(f"Received feedback for decision_id={payload.decision_id}: action={payload.action}")

    try:
        feedback = FeedbackRecord(
            decision_id=payload.decision_id,
            action=payload.action,
            override_decision=payload.override_decision if payload.action == "OVERRIDE" else None,
            notes=payload.notes,
        )
        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)

        return FeedbackResponse(
            status="success",
            message=f"Feedback recorded: {payload.action}",
            feedback_id=feedback.id,
            decision_id=payload.decision_id,
            action=payload.action,
            created_at=feedback.created_at,
        )
    except Exception as exc:
        logger.error(f"Error recording feedback: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record farmer feedback: {str(exc)}",
        )


@router.get(
    "/history",
    summary="Get recent decision audit history",
)
async def get_decision_history(
    farm_id: Optional[str] = Query(None, description="Filter by farm ID"),
    limit: int = Query(20, ge=1, le=100, description="Max number of records to return"),
    db: AsyncSession = Depends(get_db),
):
    try:
        stmt = select(DecisionRecord).order_by(desc(DecisionRecord.created_at)).limit(limit)
        if farm_id:
            stmt = stmt.where(DecisionRecord.farm_id == farm_id)

        result = await db.execute(stmt)
        records = result.scalars().all()

        return [
            {
                "id": r.id,
                "farm_id": r.farm_id,
                "crop_type": r.crop_type,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "planting_date": r.planting_date,
                "final_decision": r.final_decision,
                "final_confidence": r.final_confidence,
                "conflict_detected": r.conflict_detected,
                "conflict_resolution_trace": r.conflict_resolution_trace,
                "final_recommendation_text": r.final_recommendation_text,
                "created_at": r.created_at,
            }
            for r in records
        ]
    except Exception as exc:
        logger.warning(f"Error fetching history ({exc})")
        return []
