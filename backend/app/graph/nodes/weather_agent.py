"""
Weather Forecast Agent Node (Open-Meteo 12h-24h Precipitation Analysis)
-----------------------------------------------------------------------
Analyzes precipitation probability and rainfall volume to determine if
natural precipitation will replenish root-zone moisture.
"""
from datetime import datetime, timezone
import logging
from app.graph.state import AgentEvidence, OverallGraphState
from app.services.open_meteo import open_meteo_service

logger = logging.getLogger("agri.weather_agent")


async def weather_agent_node(state: OverallGraphState) -> dict:
    """
    Evaluates weather forecast window (next 12-24 hours) for precipitation events.
    """
    logger.info(f"[WeatherAgent] Fetching forecast for ({state.latitude}, {state.longitude})")

    telemetry = await open_meteo_service.get_forecast(state.latitude, state.longitude)
    
    # Analyze next 12 hours forecast
    window_hours = 12
    probs = telemetry.hourly.precipitation_probability[:window_hours]
    vols = telemetry.hourly.precipitation[:window_hours]

    max_rain_prob = max(probs) if probs else 0
    total_rain_mm = round(sum(vols), 1) if vols else 0.0

    staleness = telemetry.staleness_warning
    confidence = 0.90

    if max_rain_prob > 60 and total_rain_mm >= 8.0:
        claim = "DELAY_IRRIGATION"
        confidence = 0.92
        evidence = (
            f"Significant natural rainfall forecasted in next {window_hours}h: {max_rain_prob}% probability with "
            f"cumulative {total_rain_mm}mm precipitation. Irrigation should be delayed to prevent water logging and reduce pumping costs."
        )
    elif max_rain_prob > 40 and total_rain_mm >= 3.0:
        claim = "DELAY_IRRIGATION"
        confidence = 0.78
        evidence = (
            f"Moderate rainfall likely within {window_hours}h ({max_rain_prob}% probability, {total_rain_mm}mm expected). "
            f"Temporary irrigation delay advised pending weather confirmation."
        )
    elif max_rain_prob <= 20 and total_rain_mm < 1.0:
        claim = "NEUTRAL"
        confidence = 0.90
        evidence = (
            f"Dry conditions with negligible precipitation probability (max {max_rain_prob}%, {total_rain_mm}mm total in next {window_hours}h). "
            f"Weather will not contribute to root-zone hydration."
        )
    else:
        claim = "NEUTRAL"
        confidence = 0.80
        evidence = (
            f"Low precipitation impact expected in next {window_hours}h ({max_rain_prob}% probability, {total_rain_mm}mm). "
            f"Standard irrigation scheduling remains unconstrained by weather."
        )

    # SLA Staleness Penalty
    if staleness:
        confidence = max(0.1, confidence - 0.30)
        evidence += " [Staleness Warning: Forecast data from fallback source; confidence deducted by 0.30]."

    agent_output = AgentEvidence(
        agent_name="WeatherAgent",
        claim=claim,
        recommended_volume_liters_sqm=0.0,
        confidence_score=round(confidence, 2),
        primary_evidence=evidence,
        telemetry_timestamp=telemetry.fetched_at,
        data_freshness_seconds=0 if not telemetry.cached else 1800,
        staleness_warning=staleness,
    )

    return {"agent_outputs": [agent_output]}
