"""
Crop Stage Agent Node (UN FAO-56 Phenology & Drought Sensitivity Model)
-----------------------------------------------------------------------
Computes Days After Planting (DAP), Growing Degree Days (GDD), and crop
phenological growth stage to evaluate water demand and drought vulnerability.
"""
from datetime import datetime, timezone, date
import logging
from app.graph.state import AgentEvidence, OverallGraphState
from app.services.open_meteo import open_meteo_service

logger = logging.getLogger("agri.crop_agent")

# Base temperatures (°C) for common crops
CROP_BASE_TEMPS = {
    "maize": 10.0,
    "corn": 10.0,
    "rice": 10.0,
    "paddy": 10.0,
    "wheat": 4.5,
    "potato": 7.0,
    "tomato": 10.0,
    "soybean": 10.0,
}


def compute_phenology_stage(crop_type: str, dap: int) -> tuple[str, float, str, str]:
    """
    Returns (stage_name, crop_coefficient_kc, sensitivity_level, claim)
    based on FAO-56 stage length benchmarks.
    """
    crop = crop_type.strip().lower()

    if dap <= 20:
        return ("Initial / Germination", 0.40, "LOW", "NEUTRAL")
    elif dap <= 50:
        return ("Vegetative / Rapid Growth", 0.80, "MODERATE", "NEUTRAL")
    elif dap <= 80:
        # Critical reproductive / flowering stage: high yield sensitivity to water stress
        return ("Flowering & Pollination (Critical Mid-Season)", 1.20, "HIGH", "IRRIGATE")
    elif dap <= 110:
        return ("Yield Formation / Grain Filling", 0.85, "MODERATE", "NEUTRAL")
    else:
        # Ripening / harvest readiness: irrigation should cease
        return ("Maturation & Senescence (Pre-Harvest)", 0.35, "NONE", "DO_NOT_IRRIGATE")


async def crop_stage_agent_node(state: OverallGraphState) -> dict:
    """
    Calculates crop phenology stage and water requirement multiplier (Kc).
    """
    logger.info(f"[CropAgent] Calculating phenology for {state.crop_type} (Planted: {state.planting_date})")

    # 1. Calculate Days After Planting (DAP)
    try:
        plant_dt = datetime.strptime(state.planting_date, "%Y-%m-%d").date()
    except Exception:
        plant_dt = date(2026, 7, 1)

    today = date.today()
    dap = max(1, (today - plant_dt).days)

    stage_name, kc, sensitivity, pheno_claim = compute_phenology_stage(state.crop_type, dap)

    # 2. Fetch temperature to estimate thermal time
    telemetry = await open_meteo_service.get_forecast(state.latitude, state.longitude)
    temps = telemetry.hourly.temperature_2m or [28.0]
    avg_temp = sum(temps[:24]) / max(len(temps[:24]), 1)
    base_temp = CROP_BASE_TEMPS.get(state.crop_type.lower(), 10.0)
    daily_gdd = max(0.0, round(avg_temp - base_temp, 1))

    # Base confidence
    confidence = 0.92
    staleness = telemetry.staleness_warning

    if pheno_claim == "IRRIGATE" and sensitivity == "HIGH":
        evidence = (
            f"{state.crop_type} is at DAP {dap} in '{stage_name}' (Crop Coefficient Kc={kc:.2f}). "
            f"Reproductive stage has HIGH drought vulnerability; water deficits will directly depress yield."
        )
    elif pheno_claim == "DO_NOT_IRRIGATE":
        evidence = (
            f"{state.crop_type} is at DAP {dap} in '{stage_name}' (Kc={kc:.2f}). "
            f"Pre-harvest maturation phase requires soil drying to facilitate harvest and prevent rot."
        )
    else:
        evidence = (
            f"{state.crop_type} is at DAP {dap} in '{stage_name}' (Kc={kc:.2f}, Daily GDD={daily_gdd}°C-d). "
            f"Growth stage sensitivity is {sensitivity}. Normal moisture thresholds apply."
        )

    if staleness:
        confidence = max(0.1, confidence - 0.20)

    agent_output = AgentEvidence(
        agent_name="CropStageAgent",
        claim=pheno_claim,
        recommended_volume_liters_sqm=0.0,
        confidence_score=round(confidence, 2),
        primary_evidence=evidence,
        telemetry_timestamp=telemetry.fetched_at,
        data_freshness_seconds=0 if not telemetry.cached else 1800,
        staleness_warning=staleness,
    )

    return {"agent_outputs": [agent_output]}
