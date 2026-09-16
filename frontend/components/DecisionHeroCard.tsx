import React from "react";
import { Droplet, Clock, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";
import { DecisionResponse } from "../lib/types";

interface Props {
  decision: DecisionResponse | null;
  loading: boolean;
  cropName?: string;
}

export const DecisionHeroCard: React.FC<Props> = ({ decision, loading, cropName }) => {
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
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
          <Droplet className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Awaiting Farming Advisory Calculation</h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Select your location and crop on the left, then tap <strong className="text-emerald-400">"Get Irrigation Advisory"</strong> to receive real-time farmer guidance.
        </p>
      </div>
    );
  }

  const isIrrigate = decision.final_decision === "IRRIGATE";
  const isDelay = decision.final_decision === "DELAY_IRRIGATION";
  const isDoNot = decision.final_decision === "DO_NOT_IRRIGATE";

  // Extract soil volume if available
  const soilOutput = decision.agent_outputs?.find((o) => o.agent_name === "SoilWaterAgent");
  const volumeLitersPerSqm = soilOutput?.recommended_volume_liters_sqm || 0;

  // Practical farmer conversions:
  // 1 standard Sri Lankan bucket ≈ 10 Litres
  // 1 Perch ≈ 25.3 m²
  const bucketsPerPerch = Math.round((volumeLitersPerSqm * 25.3) / 10);
  const estDripMinutes = Math.round(volumeLitersPerSqm * 15);

  const cardStyle = isIrrigate
    ? "bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/50 shadow-emerald-950/40"
    : isDelay
    ? "bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-amber-500/50 shadow-amber-950/40"
    : "bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-700/40 shadow-cyan-950/30";

  const confPercent = Math.round(decision.final_confidence * 100);

  // Status headline in plain terms
  const actionHeadline = isIrrigate
    ? "💧 Water Your Crop Today"
    : isDelay
    ? "⏳ Hold / Delay Irrigation — Rain is Approaching"
    : "✅ No Water Needed Today — Soil Moisture is Sufficient";

  return (
    <div className={`border rounded-3xl p-6 md:p-8 shadow-2xl transition-all ${cardStyle}`}>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-400/90 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Farmer Action Advisory
            </span>
            {cropName && (
              <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300 border border-slate-700">
                {cropName}
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {actionHeadline}
          </h2>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">AI Agreement</div>
            <div className="text-lg font-black text-white">{confPercent}%</div>
          </div>
          <div className="w-24 bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isIrrigate ? "bg-emerald-500" : isDelay ? "bg-amber-500" : "bg-cyan-400"
              }`}
              style={{ width: `${confPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Practical Farmer Volume Guide (If Irrigating) */}
      {isIrrigate && volumeLitersPerSqm > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <div className="bg-slate-950/70 border border-emerald-800/40 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Watering Depth
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {volumeLitersPerSqm} <span className="text-sm font-semibold text-slate-300">L/m² (mm)</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Target crop root zone refill
            </div>
          </div>

          <div className="bg-slate-950/70 border border-emerald-800/40 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              🪣 Bucket Estimation
            </div>
            <div className="text-2xl font-black text-cyan-300">
              ~{bucketsPerPerch} <span className="text-sm font-semibold text-slate-300">buckets / perch</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Based on standard 10L bucket
            </div>
          </div>

          <div className="bg-slate-950/70 border border-emerald-800/40 rounded-2xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              ⏱️ Drip System Runtime
            </div>
            <div className="text-2xl font-black text-amber-300">
              ~{estDripMinutes} <span className="text-sm font-semibold text-slate-300">minutes</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Recommended early morning or dusk
            </div>
          </div>
        </div>
      )}

      {/* Primary Advisory Explanation */}
      <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60">
        <div className="text-xs uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          Agronomic Explanation
        </div>
        <p className="text-sm md:text-base text-slate-100 leading-relaxed font-medium">
          {decision.final_recommendation_text || "Irrigation conditions evaluated."}
        </p>
      </div>
    </div>
  );
};
