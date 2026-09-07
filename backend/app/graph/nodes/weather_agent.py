"""
Weather Agent Node — STUB VERSION (Day 2)
------------------------------------------
Returns hardcoded AgentEvidence for now.
Will be replaced with real Open-Meteo forecast logic on Day 4.
"""
from datetime import datetime, timezone
from app.graph.state import AgentEvidence, OverallGraphState


async def weather_agent_node(state: OverallGraphState) -> dict:
    """
    Stub: Always says DELAY_IRRIGATION (rain coming).
    Day 4: Will call Open-Meteo API to fetch precipitation probability
    and volume for the farm's lat/lon coordinates.
    """
    print(f"[WeatherAgent] Running for lat={state.latitude}, lon={state.longitude}")

    evidence = AgentEvidence(
        agent_name="WeatherAgent",
        claim="DELAY_IRRIGATION",
        recommended_volume_liters_sqm=0.0,
        confidence_score=0.78,
        primary_evidence="[STUB] Rain probability 72% in next 12h. Forecast: 14mm expected.",
        telemetry_timestamp=datetime.now(timezone.utc),
        data_freshness_seconds=0,
        staleness_warning=False,
    )

    return {"agent_outputs": [evidence]}
