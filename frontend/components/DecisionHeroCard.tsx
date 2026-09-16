import React from "react";
import { Droplet, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { DecisionResponse } from "../lib/types";

interface Props {
  decision: DecisionResponse | null;
  loading: boolean;
}

export const DecisionHeroCard: React.FC<Props> = ({ decision, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-slate-800 rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-slate-800 rounded w-full"></div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center shadow-lg">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <Droplet className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Awaiting Multi-Agent Execution</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Select a farm preset or enter GPS coordinates, then click <strong>Run Multi-Agent Engine</strong> to compute real-time agronomic recommendations.
        </p>
      </div>
    );
  }

  const isIrrigate = decision.final_decision === "IRRIGATE";
  const isDelay = decision.final_decision === "DELAY_IRRIGATION";
  const isDoNot = decision.final_decision === "DO_NOT_IRRIGATE";

  // Extract soil volume if available
  const soilOutput = decision.agent_outputs.find((o) => o.agent_name === "SoilWaterAgent");
  const volume = soilOutput?.recommended_volume_liters_sqm || 0;

  const cardStyle = isIrrigate
    ? "bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40"
    : isDelay
    ? "bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40"
    : "bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800";

  const badgeStyle = isIrrigate
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    : isDelay
    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
    : "bg-slate-800 text-slate-300 border-slate-700";

  const confPercent = Math.round(decision.final_confidence * 100);

  return (
    <div className={`border rounded-3xl p-6 shadow-xl transition-all ${cardStyle}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 block">
            Tier 1 • Immediate Recommended Action
          </span>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-xl text-sm font-extrabold border tracking-wide uppercase flex items-center gap-2 ${badgeStyle}`}>
              {isIrrigate && <Droplet className="w-4 h-4 text-emerald-400" />}
              {isDelay && <Clock className="w-4 h-4 text-amber-400" />}
              {isDoNot && <CheckCircle2 className="w-4 h-4 text-slate-400" />}
              <span>{decision.final_decision.replace(/_/g, " ")}</span>
            </span>

            {isIrrigate && (
              <span className="text-sm font-bold text-emerald-300 bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-800/40">
                {volume} L/m² ({volume} mm)
              </span>
            )}
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-2.5">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Confidence Score</div>
            <div className="text-base font-bold text-white">{confPercent}%</div>
          </div>
          <div className="w-24 bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${
                isIrrigate ? "bg-emerald-500" : isDelay ? "bg-amber-500" : "bg-slate-400"
              }`}
              style={{ width: `${confPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Advisory Text */}
      <div className="mb-2">
        <p className="text-sm md:text-base text-slate-100 leading-relaxed font-medium">
          {decision.final_recommendation_text || "Irrigation conditions evaluated."}
        </p>
      </div>
    </div>
  );
};
