"""
Soil/Water Agent Node — STUB VERSION (Day 2)
--------------------------------------------
Returns hardcoded AgentEvidence for now.
Will be replaced with real root-zone water balance logic on Day 4.
"""
from datetime import datetime, timezone
from app.graph.state import AgentEvidence, OverallGraphState


async def soil_water_agent_node(state: OverallGraphState) -> dict:
    """
    Stub: Always says IRRIGATE with hardcoded values.
    Day 4: Will fetch real soil moisture from Open-Meteo and compare
    against wilting point / field capacity thresholds.
    """
    print(f"[SoilAgent] Running for farm={state.farm_id}, crop={state.crop_type}")

    evidence = AgentEvidence(
        agent_name="SoilWaterAgent",
        claim="IRRIGATE",
        recommended_volume_liters_sqm=5.0,
        confidence_score=0.85,
        primary_evidence="[STUB] Soil moisture at 35% - below field capacity threshold of 60%.",
        telemetry_timestamp=datetime.now(timezone.utc),
        data_freshness_seconds=0,
        staleness_warning=False,
    )

    return {"agent_outputs": [evidence]}
