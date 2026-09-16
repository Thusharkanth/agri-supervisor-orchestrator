"""
Prompts for LLM Agri-Assistant
------------------------------
Injects exact multi-agent state (Soil, Weather, Crop stage, Coordinator conflict trace)
into the prompt so the LLM has complete context on why decisions were made.
"""
from typing import List
from app.chatbot.schemas import ChatAdvisoryRequest, AgentEvidenceItem


def build_system_prompt() -> str:
    return (
        "You are an expert Agricultural Decision Explainer and Agronomic Advisor for Sri Lankan farmers. "
        "You speak in clear, simple, farmer-friendly terms (avoid overly complex academic jargon unless explained simply). "
        "You have direct access to the live Multi-Agent System decision, telemetry, and evidence traces. "
        "CRITICAL INSTRUCTIONS:\n"
        "1. Never contradict the current system decision or agent telemetry.\n"
        "2. If the decision is 'DO_NOT_IRRIGATE' because soil moisture is already optimal, explain that the root-zone already has enough water, even if no rain is forecast.\n"
        "3. If the decision is 'DELAY_IRRIGATION', explain that rain is expected soon and watering now would waste pump fuel/electricity.\n"
        "4. If the decision is 'IRRIGATE', explain how much water to apply and practical conversions (e.g. standard 10L buckets or drip line run time).\n"
        "5. If asked about fertilizer, advise waiting if heavy rain is coming, or applying with water if soil is dry, or proceeding normally if moisture is optimal.\n"
        "6. Always keep answers concise (2-4 sentences) and highly actionable."
    )


def build_user_prompt(req: ChatAdvisoryRequest) -> str:
    agent_breakdown = ""
    if req.agent_outputs:
        for ev in req.agent_outputs:
            agent_breakdown += f"  • {ev.agent_name}: Vote={ev.claim}, Evidence: {ev.primary_evidence}\n"
    else:
        agent_breakdown = f"  • Telemetry Evidence: {req.evidence_summary or 'Optimal moisture thresholds evaluated.'}\n"

    prompt = f"""FARM CONTEXT:
- Farm ID: {req.farm_id or 'FARM-01'}
- Crop: {req.crop_type}
- Planting Date: {req.planting_date or 'N/A'}

MULTI-AGENT SYSTEM STATE & DECISION:
- Final Decision: {req.decision} (Confidence: {int((req.confidence or 0.9) * 100)}%)
- Recommended Water Volume: {req.volume_liters_sqm or 0.0} L/m²
- Coordinator Conflict Trace: {req.conflict_trace or 'No conflicts detected; consensus achieved.'}
- Agent Evidence Breakdown:
{agent_breakdown}

FARMER'S QUESTION:
"{req.question}"

Provide a clear, farmer-friendly answer and actionable guidance strictly adhering to the Multi-Agent state above.
"""
    return prompt
