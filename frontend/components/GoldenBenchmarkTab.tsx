import React, { useState } from "react";
import { Trophy, Play, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { requestIrrigationDecision } from "../lib/api";
import { DecisionResponse } from "../lib/types";

interface BenchmarkScenario {
  scenario_id: string;
  name: string;
  farm_id: string;
  crop_type: string;
  latitude: number;
  longitude: number;
  planting_date: string;
  expected_decision: string;
  expected_conflict: boolean;
}

const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  {
    scenario_id: "SCENARIO-01",
    name: "Severe Drought during Maize Flowering",
    farm_id: "FARM-ANURADHAPURA-01",
    crop_type: "Maize",
    latitude: 8.3114,
    longitude: 80.4037,
    planting_date: "2026-07-15",
    expected_decision: "IRRIGATE",
    expected_conflict: false,
  },
  {
    scenario_id: "SCENARIO-02",
    name: "Low Soil Moisture with Imminent Heavy Rain",
    farm_id: "FARM-KURUNEGALA-01",
    crop_type: "Maize",
    latitude: 7.4863,
    longitude: 80.3623,
    planting_date: "2026-07-10",
    expected_decision: "DELAY_IRRIGATION",
    expected_conflict: true,
  },
  {
    scenario_id: "SCENARIO-03",
    name: "Sufficient Soil Moisture in Vegetative Stage",
    farm_id: "FARM-KANDY-01",
    crop_type: "Tomato",
    latitude: 7.2906,
    longitude: 80.6337,
    planting_date: "2026-08-01",
    expected_decision: "DO_NOT_IRRIGATE",
    expected_conflict: false,
  },
  {
    scenario_id: "SCENARIO-04",
    name: "Pre-Harvest Paddy Drying Phase",
    farm_id: "FARM-POLONNARUWA-01",
    crop_type: "Paddy",
    latitude: 7.9403,
    longitude: 81.0188,
    planting_date: "2026-04-10",
    expected_decision: "DO_NOT_IRRIGATE",
    expected_conflict: true,
  },
  {
    scenario_id: "SCENARIO-05",
    name: "Early Vegetative Maize Moderate Moisture",
    farm_id: "FARM-MONARAGALA-01",
    crop_type: "Maize",
    latitude: 6.8728,
    longitude: 81.3507,
    planting_date: "2026-08-15",
    expected_decision: "DO_NOT_IRRIGATE",
    expected_conflict: false,
  },
];

export const GoldenBenchmarkTab: React.FC = () => {
  const [results, setResults] = useState<Record<string, DecisionResponse>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  const runScenario = async (sc: BenchmarkScenario) => {
    setRunningId(sc.scenario_id);
    try {
      const res = await requestIrrigationDecision({
        farm_id: sc.farm_id,
        crop_type: sc.crop_type,
        latitude: sc.latitude,
        longitude: sc.longitude,
        planting_date: sc.planting_date,
      });
      setResults((prev) => ({ ...prev, [sc.scenario_id]: res }));
    } catch (err: any) {
      console.error("Benchmark scenario error:", err);
    } finally {
      setRunningId(null);
    }
  };

  const runAll = async () => {
    for (const sc of BENCHMARK_SCENARIOS) {
      await runScenario(sc);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Golden Dataset Evaluation Harness</h3>
              <p className="text-xs text-slate-400">
                Automated regression test suite validating multi-agent conflict resolution accuracy
              </p>
            </div>
          </div>

          <button
            onClick={runAll}
            disabled={runningId !== null}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            {runningId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>Run All Benchmark Scenarios</span>
          </button>
        </div>

        <div className="space-y-3">
          {BENCHMARK_SCENARIOS.map((sc) => {
            const res = results[sc.scenario_id];
            const isRunning = runningId === sc.scenario_id;
            const isPass = res && res.final_decision === sc.expected_decision;

            return (
              <div
                key={sc.scenario_id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {sc.scenario_id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">{sc.name}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {sc.crop_type} • ({sc.latitude}, {sc.longitude}) • Expected:{" "}
                    <strong className="text-slate-300">{sc.expected_decision}</strong> (Conflict: {String(sc.expected_conflict)})
                  </p>

                  {res && (
                    <p className="text-[11px] text-slate-300 font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800 mt-2">
                      <strong>Trace:</strong> {res.conflict_resolution_trace}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  {res && (
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {isPass ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS ({res.final_decision})</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAIL ({res.final_decision})</span>
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => runScenario(sc)}
                    disabled={isRunning}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1 disabled:opacity-50"
                  >
                    {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    <span>Test</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
