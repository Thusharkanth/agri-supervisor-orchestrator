"""
Automated Evaluation Harness for Golden Benchmark Scenarios
Runs edge-case scenarios against the multi-agent graph and validates accuracy.
Usage: python test_golden_evaluation.py
"""
import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from unittest.mock import patch

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.graph.workflow import agri_graph
from app.graph.state import OverallGraphState
from app.schemas.telemetry import TelemetryPayload, HourlyTelemetry


def build_mock_telemetry(lat: float, lon: float, moisture: float, rain_prob: int, rain_vol: float) -> TelemetryPayload:
    now_iso = datetime.now(timezone.utc).isoformat()
    hours = [f"{now_iso[:13]}:00" for _ in range(24)]
    
    return TelemetryPayload(
        latitude=lat,
        longitude=lon,
        hourly=HourlyTelemetry(
            time=hours,
            precipitation_probability=[rain_prob] * 24,
            precipitation=[rain_vol / 12.0] * 12 + [0.0] * 12,
            soil_moisture_0_to_1cm=[moisture] * 24,
            soil_moisture_3_to_9cm=[moisture] * 24,
            et0_fao_evapotranspiration=[4.0] * 24,
            temperature_2m=[30.0] * 24,
        ),
        fetched_at=datetime.now(timezone.utc),
        source="golden-benchmark-mock",
        cached=True,
        staleness_warning=False,
    )


async def run_benchmark():
    dataset_path = os.path.join(os.path.dirname(__file__), "tests", "golden_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        scenarios = json.load(f)

    print("\n" + "=" * 80)
    print("  🌾 MULTI-AGENT AGRICULTURAL SYSTEM — GOLDEN DATASET BENCHMARK")
    print("=" * 80)

    passed_count = 0
    total_count = len(scenarios)

    for sc in scenarios:
        mock_tel = build_mock_telemetry(
            sc["latitude"],
            sc["longitude"],
            sc["mock_soil_moisture"],
            sc["mock_rain_prob_12h"],
            sc["mock_rain_vol_12h"],
        )

        with patch("app.services.open_meteo.open_meteo_service.get_forecast", return_value=mock_tel):
            state = OverallGraphState(
                farm_id=sc["farm_id"],
                crop_type=sc["crop_type"],
                latitude=sc["latitude"],
                longitude=sc["longitude"],
                planting_date=sc["planting_date"],
            )

            result = await agri_graph.ainvoke(state.model_dump())
            actual_decision = result.get("final_decision")
            actual_conflict = result.get("conflict_detected")

            decision_match = (actual_decision == sc["expected_decision"])
            conflict_match = (actual_conflict == sc["expected_conflict"])

            if decision_match and conflict_match:
                status_icon = "✅ PASS"
                passed_count += 1
            else:
                status_icon = "❌ FAIL"

            print(f"\n{status_icon} | {sc['scenario_id']}: {sc['name']}")
            print(f"       Expected: {sc['expected_decision']} (Conflict: {sc['expected_conflict']})")
            print(f"       Actual  : {actual_decision} (Conflict: {actual_conflict}, Conf: {result['final_confidence']:.0%})")
            print(f"       Trace   : {result['conflict_resolution_trace'][:90]}...")

    print("\n" + "=" * 80)
    print(f"  BENCHMARK ACCURACY SCORE: {passed_count}/{total_count} ({passed_count/total_count:.1%})")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(run_benchmark())
