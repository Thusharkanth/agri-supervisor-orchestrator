"""
Comprehensive test script for real multi-agent pipeline.
Tests real live Open-Meteo telemetry and conflict scenarios.
Usage: python test_pipeline.py
"""
import asyncio
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.graph.workflow import agri_graph
from app.graph.state import OverallGraphState


async def test_farm(farm_id: str, crop: str, lat: float, lon: float, plant_date: str):
    print("\n" + "=" * 70)
    print(f"  RUNNING TEST FOR: {farm_id} ({crop}) @ ({lat:.4f}, {lon:.4f})")
    print("=" * 70)

    state = OverallGraphState(
        farm_id=farm_id,
        crop_type=crop,
        latitude=lat,
        longitude=lon,
        planting_date=plant_date,
    )

    result = await agri_graph.ainvoke(state.model_dump())

    print("\n--- DOMAIN AGENT EVIDENCE (Parallel Fan-Out) ---")
    for ev in result["agent_outputs"]:
        if isinstance(ev, dict):
            name, claim, conf, ev_text = ev["agent_name"], ev["claim"], ev["confidence_score"], ev["primary_evidence"]
        else:
            name, claim, conf, ev_text = ev.agent_name, ev.claim, ev.confidence_score, ev.primary_evidence

        print(f"\n  [{name}]")
        print(f"    Claim      : {claim}")
        print(f"    Confidence : {conf:.0%}")
        print(f"    Evidence   : {ev_text}")

    print("\n--- COORDINATOR SYNTHESIS (Fan-In & Conflict Resolution) ---")
    print(f"  Final Decision : {result['final_decision']}")
    print(f"  Confidence     : {result['final_confidence']:.0%}")
    print(f"  Conflict Found : {result['conflict_detected']}")
    print(f"  Conflict Trace : {result['conflict_resolution_trace']}")
    print(f"  Advisory Text  :\n  {result['final_recommendation_text']}")


async def main():
    # 1. Test Anuradhapura (Dry Zone Agricultural Hub, Sri Lanka)
    await test_farm("FARM-LK-01", "Maize", 8.3114, 80.4037, "2026-07-15")

    # 2. Test Nuwara Eliya (Highland Tea & Vegetable, Sri Lanka)
    await test_farm("FARM-LK-02", "Tomato", 6.9497, 80.7891, "2026-08-01")

    # 3. Test Pre-Harvest Maturation Crop
    await test_farm("FARM-LK-03", "Paddy", 7.8731, 80.7718, "2026-04-10")

    print("\n" + "=" * 70)
    print("  ALL PIPELINE SCENARIOS COMPLETED SUCCESSFULLY!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
