import React, { useState } from "react";
import { Brain, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";
import { DecisionResponse } from "../lib/types";

interface Props {
  decision: DecisionResponse | null;
}

export const ConflictTraceAccordion: React.FC<Props> = ({ decision }) => {
  const [expanded, setExpanded] = useState(true);

  if (!decision) return null;

  const hasConflict = decision.conflict_detected;

  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-2xl overflow-hidden transition-all shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition border-b border-slate-800/60"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tier 2 • Coordinator Reconciliation Trace ("The Why")
            </span>
            <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
              Transparent multi-agent trade-off resolution
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasConflict ? (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3 h-3" />
              <span>Conflict Reconciled</span>
            </span>
          ) : (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3 h-3" />
              <span>Consensus Reached</span>
            </span>
          )}

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-5 bg-slate-950/60">
          <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            {decision.conflict_resolution_trace || "No conflicting claims identified across domain agents."}
          </p>
        </div>
      )}
    </div>
  );
};
