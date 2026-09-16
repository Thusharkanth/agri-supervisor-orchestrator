import React from "react";
import { Droplets, CloudSunRain, Sprout, ShieldAlert, Cpu } from "lucide-react";
import { DecisionResponse, AgentEvidence } from "../lib/types";

interface Props {
  decision: DecisionResponse | null;
}

export const DomainEvidenceGrid: React.FC<Props> = ({ decision }) => {
  if (!decision) return null;

  const outputs = decision.agent_outputs || [];
  const soil = outputs.find((o) => o.agent_name === "SoilWaterAgent");
  const weather = outputs.find((o) => o.agent_name === "WeatherAgent");
  const crop = outputs.find((o) => o.agent_name === "CropStageAgent");

  const renderClaimBadge = (claim: string) => {
    switch (claim) {
      case "IRRIGATE":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">IRRIGATE</span>;
      case "DELAY_IRRIGATION":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">DELAY</span>;
      case "DO_NOT_IRRIGATE":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">DO NOT IRRIGATE</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">NEUTRAL</span>;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tier 3 • Parallel Domain Agent Evidence</span>
        </h3>
        <span className="text-[11px] text-slate-500">Concurrent Fan-Out Execution</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Soil Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-blue-400">Soil / Water Agent</span>
              </div>
              {soil && renderClaimBadge(soil.claim)}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3 font-normal">
              {soil ? soil.primary_evidence : "Awaiting root-zone telemetry..."}
            </p>

            {soil?.staleness_warning && (
              <div className="mb-2 text-[10px] text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Staleness penalty applied (-0.30)</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span>Deterministic Math ($0)</span>
            <span className="font-semibold text-slate-300">
              {soil ? `${Math.round(soil.confidence_score * 100)}% Conf` : "--"}
            </span>
          </div>
        </div>

        {/* 2. Weather Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <CloudSunRain className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-cyan-400">Weather Forecast Agent</span>
              </div>
              {weather && renderClaimBadge(weather.claim)}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3 font-normal">
              {weather ? weather.primary_evidence : "Awaiting 12–24h precipitation forecast..."}
            </p>

            {weather?.staleness_warning && (
              <div className="mb-2 text-[10px] text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Staleness penalty applied (-0.30)</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span>Open-Meteo Live</span>
            <span className="font-semibold text-slate-300">
              {weather ? `${Math.round(weather.confidence_score * 100)}% Conf` : "--"}
            </span>
          </div>
        </div>

        {/* 3. Crop Stage Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Sprout className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-emerald-400">Crop Stage Agent</span>
              </div>
              {crop && renderClaimBadge(crop.claim)}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3 font-normal">
              {crop ? crop.primary_evidence : "Awaiting FAO-56 phenology calculation..."}
            </p>
          </div>

          <div className="text-[11px] text-slate-500 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span>UN FAO-56 Standard</span>
            <span className="font-semibold text-slate-300">
              {crop ? `${Math.round(crop.confidence_score * 100)}% Conf` : "--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
