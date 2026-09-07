"""
Coordinator Node — STUB VERSION (Day 2)
----------------------------------------
Simple rule-based conflict resolver for now.
Day 5: Will use Ollama LLM to generate the natural language explanation.
"""
from collections import Counter
from app.graph.state import OverallGraphState


async def coordinator_node(state: OverallGraphState) -> dict:
    """
    Reads all AgentEvidence from the state bus and applies
    conflict resolution rules to output a final decision.

    Conflict Rules (Priority Order):
    1. If Weather says DELAY and rain forecast > 10mm → DELAY wins (safety rule)
    2. If 2+ agents say IRRIGATE → IRRIGATE
    3. If 2+ agents say DO_NOT_IRRIGATE → DO_NOT_IRRIGATE
    4. Default fallback → DELAY_IRRIGATION (cautious)
    """
    print(f"[Coordinator] Received {len(state.agent_outputs)} agent outputs")

    outputs = state.agent_outputs
    claims = [o.claim for o in outputs]

    print(f"[Coordinator] Claims received: {claims}")

    # ── Rule 1: Weather veto — if weather says DELAY, it usually wins ─────────
    weather_out = next((o for o in outputs if o.agent_name == "WeatherAgent"), None)
    if weather_out and weather_out.claim == "DELAY_IRRIGATION" and weather_out.confidence_score >= 0.70:
        final_decision = "DELAY_IRRIGATION"
        conflict_detected = "IRRIGATE" in claims
        trace = (
            f"WeatherAgent flagged high-confidence rain forecast (confidence={weather_out.confidence_score:.0%}). "
            f"Evidence: {weather_out.primary_evidence}. "
            f"Overrides soil moisture deficit to avoid wasted irrigation."
        )
    else:
        # ── Rule 2 & 3: Majority vote ──────────────────────────────────────────
        claim_counts = Counter(claims)
        most_common_claim, count = claim_counts.most_common(1)[0]

        conflict_detected = len(set(c for c in claims if c != "NEUTRAL")) > 1

        if count >= 2:
            final_decision = most_common_claim if most_common_claim != "NEUTRAL" else "DELAY_IRRIGATION"
        else:
            # ── Rule 4: Cautious fallback ──────────────────────────────────────
            final_decision = "DELAY_IRRIGATION"

        trace = (
            f"Agent votes: {dict(claim_counts)}. "
            f"Majority rule applied. "
            f"Conflict detected: {conflict_detected}. "
            f"Final: {final_decision}."
        )

    # Calculate average confidence of agents that voted for the final decision
    supporting = [o for o in outputs if o.claim == final_decision or o.claim == "NEUTRAL"]
    avg_confidence = sum(o.confidence_score for o in supporting) / len(supporting) if supporting else 0.5

    recommendation_text = _build_recommendation_text(final_decision, trace, avg_confidence)

    print(f"[Coordinator] Final decision: {final_decision} | Confidence: {avg_confidence:.0%}")

    return {
        "conflict_detected": conflict_detected,
        "conflict_resolution_trace": trace,
        "final_decision": final_decision,
        "final_confidence": round(avg_confidence, 2),
        "final_recommendation_text": recommendation_text,
    }


def _build_recommendation_text(decision: str, trace: str, confidence: float) -> str:
    """Generate a simple natural language recommendation string."""
    action_map = {
        "IRRIGATE": "✅ Irrigate your crops now.",
        "DELAY_IRRIGATION": "⚠️ Delay irrigation — conditions suggest waiting.",
        "DO_NOT_IRRIGATE": "⛔ Do not irrigate — soil moisture levels are sufficient.",
    }
    action = action_map.get(decision, "⚠️ Please review conditions manually.")
    return f"{action} (Confidence: {confidence:.0%}) — Reasoning: {trace}"
