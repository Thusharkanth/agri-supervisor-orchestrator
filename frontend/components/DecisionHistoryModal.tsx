import React, { useEffect, useState } from "react";
import { History, X, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { fetchDecisionHistory } from "../lib/api";
import { DecisionHistoryItem } from "../lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  farmId?: string;
}

export const DecisionHistoryModal: React.FC<Props> = ({ isOpen, onClose, farmId }) => {
  const [history, setHistory] = useState<DecisionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchDecisionHistory(farmId)
        .then((data) => setHistory(data))
        .catch((err) => console.error("Error loading history:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, farmId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Decision Audit History</h3>
              <p className="text-xs text-slate-400">
                PostgreSQL historical execution logs &amp; human-in-the-loop records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Fetching audit history from database...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No historical decisions found for this farm ID yet.
            </div>
          ) : (
            history.map((item) => {
              const isIrrigate = item.final_decision === "IRRIGATE";
              const isDelay = item.final_decision === "DELAY_IRRIGATION";

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        #{item.id}
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {item.farm_id} ({item.crop_type})
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                        isIrrigate
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : isDelay
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {item.final_decision.replace(/_/g, " ")} ({Math.round(item.final_confidence * 100)}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-mono bg-slate-900/60 p-2 rounded border border-slate-800/60">
                    {item.final_recommendation_text || item.conflict_resolution_trace}
                  </p>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                    <span>GPS: ({item.latitude.toFixed(2)}, {item.longitude.toFixed(2)})</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
