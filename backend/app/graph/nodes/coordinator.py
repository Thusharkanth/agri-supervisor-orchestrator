"""
Coordinator Fan-In Node (Reconciliation & Explainable Trace Synthesis)
----------------------------------------------------------------------
Executes after all parallel domain agents complete. Evaluates evidence,
identifies conflicting claims, applies agronomic trade-off rules, and
synthesizes natural language explanations for the farmer dashboard.
"""
import logging
from typing import Optional
from app.graph.state import OverallGraphState, AgentEvidence

logger = logging.getLogger("agri.coordinator")


async def coordinator_node(state: OverallGraphState) -> dict:
    """
    Fan-In node aggregating agent outputs and resolving agronomic conflicts.
    """
    logger.info(f"[Coordinator] Reconciling evidence from {len(state.agent_outputs)} parallel agents")

    outputs = {ev.agent_name: ev for ev in state.agent_outputs}
    soil_ev: Optional[AgentEvidence] = outputs.get("SoilWaterAgent")
    weather_ev: Optional[AgentEvidence] = outputs.get("WeatherAgent")
    crop_ev: Optional[AgentEvidence] = outputs.get("CropStageAgent")

    conflict_detected = False
    final_decision = "DO_NOT_IRRIGATE"
    final_volume = 0.0
    trace = ""
    confidence = 0.90

    # ── Rule 1: Pre-Harvest Drying Priority ───────────────────────────────────
    if crop_ev and crop_ev.claim == "DO_NOT_IRRIGATE":
        final_decision = "DO_NOT_IRRIGATE"
        final_volume = 0.0
        confidence = 0.93
        if soil_ev and soil_ev.claim == "IRRIGATE":
            conflict_detected = True
            trace = (
                "Agronomic Override: Crop is in pre-harvest maturation/senescence stage. "
                "Irrigation is stopped despite low soil moisture to allow grain dry-down and prevent fungal rotting."
            )
        else:
            trace = "Crop is in maturation stage. Normal dry-down proceeding."

    # ── Rule 2: Soil Depleted vs Weather Imminent Rain (Classic Conflict) ────
    elif soil_ev and soil_ev.claim == "IRRIGATE" and weather_ev and weather_ev.claim == "DELAY_IRRIGATION":
        conflict_detected = True
        final_decision = "DELAY_IRRIGATION"
        final_volume = 0.0
        confidence = round((soil_ev.confidence_score + weather_ev.confidence_score) / 2, 2)
        trace = (
            f"Conflict Detected & Reconciled: Root-zone moisture is depleted ({soil_ev.primary_evidence}), "
            f"but imminent natural precipitation ({weather_ev.primary_evidence}) will hydrate crops. "
            f"Irrigation delayed to conserve pumping energy and prevent root waterlogging."
        )

    # ── Rule 3: Soil Depleted & Dry Weather (Clear Irrigate Action) ───────────
    elif soil_ev and soil_ev.claim == "IRRIGATE":
        conflict_detected = False
        final_decision = "IRRIGATE"
        final_volume = soil_ev.recommended_volume_liters_sqm
        confidence = soil_ev.confidence_score
        
        crop_note = f" Crop status: {crop_ev.primary_evidence}" if crop_ev else ""
        trace = (
            f"Consensus Reached: Root-zone moisture is depleted below threshold ({soil_ev.primary_evidence}). "
            f"Weather forecast indicates no incoming rainfall to offset water deficit.{crop_note}"
        )

    # ── Rule 4: Soil Sufficient ───────────────────────────────────────────────
    elif soil_ev and soil_ev.claim == "DO_NOT_IRRIGATE":
        conflict_detected = False
        final_decision = "DO_NOT_IRRIGATE"
        final_volume = 0.0
        confidence = soil_ev.confidence_score
        trace = (
            f"No Irrigation Needed: Soil moisture remains in the optimal buffer range ({soil_ev.primary_evidence})."
        )

    # ── Rule 5: Fallback ──────────────────────────────────────────────────────
    else:
        conflict_detected = False
        final_decision = "DELAY_IRRIGATION"
        final_volume = 0.0
        confidence = 0.70
        trace = "Telemetry inconclusive across domain agents. Recommend holding irrigation pending sensor sync."

    recommendation_text = _format_farmer_advisory(final_decision, final_volume, trace, confidence)

    logger.info(f"[Coordinator] Decision: {final_decision} (Conflict: {conflict_detected}, Confidence: {confidence:.0%})")

    return {
        "conflict_detected": conflict_detected,
        "conflict_resolution_trace": trace,
        "final_decision": final_decision,
        "final_confidence": confidence,
        "final_recommendation_text": recommendation_text,
    }


def _format_farmer_advisory(decision: str, volume: float, trace: str, confidence: float) -> str:
    """Format glanceable, high-contrast advisory text for the Farmer Dashboard."""
    if decision == "IRRIGATE":
        return f"Apply {volume} L/m² of water today. {trace}"
    elif decision == "DELAY_IRRIGATION":
        return f"Hold irrigation for the next 12–24 hours. {trace}"
    elif decision == "DO_NOT_IRRIGATE":
        return f"No irrigation required today. {trace}"
    return f"Monitor soil conditions closely. {trace}"
