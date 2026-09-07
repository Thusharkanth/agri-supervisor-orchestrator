"""
Quick smoke test -- run the full LangGraph graph locally.
Usage: python smoke_test.py
"""
import asyncio
import sys

# Fix Windows console encoding for unicode output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.graph.workflow import agri_graph
from app.graph.state import OverallGraphState


async def main():
    print("\n" + "=" * 60)
    print("  [AGRI] DECISION-SUPPORT -- GRAPH SMOKE TEST")
    print("=" * 60)

    initial_state = OverallGraphState(
        farm_id="FARM-001",
        crop_type="Maize",
        latitude=7.8731,   # Sri Lanka center
        longitude=80.7718,
        planting_date="2026-07-01",
    )

    print(f"\n📍 Farm: {initial_state.farm_id}")
    print(f"🌱 Crop: {initial_state.crop_type}")
    print(f"📌 Location: ({initial_state.latitude}, {initial_state.longitude})")
    print(f"📅 Planted: {initial_state.planting_date}")
    print("\n⚡ Running parallel agent graph...\n")

    result = await agri_graph.ainvoke(initial_state.model_dump())

    print("\n" + "=" * 60)
    print("  AGENT EVIDENCE COLLECTED")
    print("=" * 60)
    for evidence in result["agent_outputs"]:
        # evidence may be a dict or Pydantic model depending on LangGraph version
        if isinstance(evidence, dict):
            name = evidence["agent_name"]
            claim = evidence["claim"]
            conf = evidence["confidence_score"]
            text = evidence["primary_evidence"]
        else:
            name = evidence.agent_name
            claim = evidence.claim
            conf = evidence.confidence_score
            text = evidence.primary_evidence
        print(f"\n  [{name}]")
        print(f"    Claim     : {claim}")
        print(f"    Confidence: {conf:.0%}")
        print(f"    Evidence  : {text}")

    print("\n" + "=" * 60)
    print("  COORDINATOR FINAL DECISION")
    print("=" * 60)
    print(f"\n  Decision  : {result['final_decision']}")
    print(f"  Confidence: {result['final_confidence']:.0%}")
    print(f"  Conflict  : {result['conflict_detected']}")
    print(f"\n  Recommendation:\n  {result['final_recommendation_text']}")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
