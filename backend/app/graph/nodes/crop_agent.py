"""
Crop Stage Agent Node — STUB VERSION (Day 2)
---------------------------------------------
Returns hardcoded AgentEvidence for now.
Will be replaced with real GDD + phenology stage logic on Day 5.
"""
from datetime import datetime, timezone
from app.graph.state import AgentEvidence, OverallGraphState


async def crop_stage_agent_node(state: OverallGraphState) -> dict:
    """
    Stub: Always returns NEUTRAL (crop stage doesn't override).
    Day 5: Will calculate Growing Degree Days from planting date,
    determine crop phenology stage, and assess drought sensitivity.
    """
    print(f"[CropAgent] Running for crop={state.crop_type}, planted={state.planting_date}")

    evidence = AgentEvidence(
        agent_name="CropStageAgent",
        claim="NEUTRAL",
        recommended_volume_liters_sqm=0.0,
        confidence_score=0.60,
        primary_evidence="[STUB] Maize at V6 vegetative stage. Moderate drought sensitivity.",
        telemetry_timestamp=datetime.now(timezone.utc),
        data_freshness_seconds=0,
        staleness_warning=False,
    )

    return {"agent_outputs": [evidence]}
