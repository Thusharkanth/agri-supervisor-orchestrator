"""
Soil / Water Agent Node (Deterministic Logic — $0 Token Overhead)
-----------------------------------------------------------------
Evaluates root-zone soil volumetric moisture from Open-Meteo telemetry
against permanent wilting point and field capacity thresholds.
"""
from datetime import datetime, timezone
import logging
from app.graph.state import AgentEvidence, OverallGraphState
from app.services.open_meteo import open_meteo_service

logger = logging.getLogger("agri.soil_agent")

# Standard Agronomic Loam Thresholds (FAO-56 defaults)
DEFAULT_FIELD_CAPACITY = 0.32   # 32% volumetric water content
DEFAULT_WILTING_POINT = 0.22    # 22% critical wilting point
DEFAULT_RAW_THRESHOLD = 0.27    # 27% readily available water threshold


async def soil_water_agent_node(state: OverallGraphState) -> dict:
    """
    Evaluates soil moisture levels and determines irrigation demand.
    """
    logger.info(f"[SoilAgent] Evaluating soil moisture for farm={state.farm_id} at ({state.latitude}, {state.longitude})")

    telemetry = await open_meteo_service.get_forecast(state.latitude, state.longitude)
    
    # Extract current root-zone moisture (3-9cm layer)
    soil_readings = telemetry.hourly.soil_moisture_3_to_9cm
    current_moisture = soil_readings[0] if soil_readings else 0.25
    
    field_capacity = DEFAULT_FIELD_CAPACITY
    wilting_point = DEFAULT_WILTING_POINT
    raw_threshold = DEFAULT_RAW_THRESHOLD

    # Base confidence score
    confidence = 0.95
    staleness = telemetry.staleness_warning

    if current_moisture < wilting_point:
        claim = "IRRIGATE"
        volume = round((field_capacity - current_moisture) * 100, 1)
        evidence = (
            f"Root-zone soil moisture ({current_moisture * 100:.1f}%) is below the critical wilting point "
            f"({wilting_point * 100:.1f}%). Plant is experiencing severe water stress. "
            f"Recommended replenishment: {volume} L/m² to achieve field capacity ({field_capacity * 100:.1f}%)."
        )
    elif current_moisture < raw_threshold:
        claim = "IRRIGATE"
        volume = round((field_capacity - current_moisture) * 100, 1)
        evidence = (
            f"Root-zone soil moisture ({current_moisture * 100:.1f}%) has depleted below the readily available water "
            f"threshold ({raw_threshold * 100:.1f}%). Irrigation of {volume} L/m² recommended to prevent growth suppression."
        )
    else:
        claim = "DO_NOT_IRRIGATE"
        volume = 0.0
        evidence = (
            f"Root-zone soil moisture ({current_moisture * 100:.1f}%) is in the optimal range "
            f"(above RAW {raw_threshold * 100:.1f}%, Field Capacity: {field_capacity * 100:.1f}%). No irrigation required."
        )

    # SLA Staleness Penalty: deduct 0.30 if telemetry is degraded
    if staleness:
        confidence = max(0.1, confidence - 0.30)
        evidence += " [Staleness Warning: Telemetry from fallback source; confidence adjusted]."

    agent_output = AgentEvidence(
        agent_name="SoilWaterAgent",
        claim=claim,
        recommended_volume_liters_sqm=volume,
        confidence_score=round(confidence, 2),
        primary_evidence=evidence,
        telemetry_timestamp=telemetry.fetched_at,
        data_freshness_seconds=0 if not telemetry.cached else 1800,
        staleness_warning=staleness,
    )

    return {"agent_outputs": [agent_output]}
