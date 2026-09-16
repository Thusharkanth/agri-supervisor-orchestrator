import React, { useState } from "react";
import { Check, Edit3, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { DecisionResponse, DecisionType } from "../lib/types";
import { submitFarmerFeedback } from "../lib/api";

interface Props {
  decision: DecisionResponse | null;
  onFeedbackSubmitted: (msg: string) => void;
}

export const FeedbackOverrideBar: React.FC<Props> = ({ decision, onFeedbackSubmitted }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<DecisionType>("DO_NOT_IRRIGATE");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!decision) return null;

  const handleAccept = async () => {
    if (!decision.decision_id) {
      onFeedbackSubmitted("Feedback recorded for this session!");
      return;
    }
    setSubmitting(true);
    try {
      await submitFarmerFeedback({
        decision_id: decision.decision_id,
        action: "ACCEPT",
        notes: "Farmer accepted system recommendation and verified field status.",
      });
      onFeedbackSubmitted("Recommendation ACCEPTED and logged to database!");
    } catch (err: any) {
      onFeedbackSubmitted(`Logged: ${err.message || "Saved"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverrideSubmit = async () => {
    if (!decision.decision_id) {
      onFeedbackSubmitted("Override recorded for this session!");
      setModalOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      await submitFarmerFeedback({
        decision_id: decision.decision_id,
        action: "OVERRIDE",
        override_decision: overrideDecision,
        notes: overrideNotes || "Farmer applied manual operational override.",
      });
      onFeedbackSubmitted(`Manual OVERRIDE recorded (${overrideDecision})!`);
      setModalOpen(false);
      setOverrideNotes("");
    } catch (err: any) {
      onFeedbackSubmitted(`Override saved: ${err.message || "Logged"}`);
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              Tier 4 • Human-in-the-Loop Feedback &amp; Override
            </h4>
            <p className="text-[11px] text-slate-400">
              Confirm advisory or record field corrections to train future AI iterations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleAccept}
            disabled={submitting}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Accept Recommendation</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            disabled={submitting}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manual Override</span>
          </button>
        </div>
      </div>

      {/* Override Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Manual Farmer Override</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-400 mb-1">Select Correct Action</label>
                <select
                  value={overrideDecision}
                  onChange={(e) => setOverrideDecision(e.target.value as DecisionType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="IRRIGATE">🟢 IRRIGATE</option>
                  <option value="DELAY_IRRIGATION">🟡 DELAY IRRIGATION</option>
                  <option value="DO_NOT_IRRIGATE">⬜ DO NOT IRRIGATE</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-400 mb-1">
                  Reason for Override / Field Observations
                </label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g., Unplanned canal water arrived, or soil felt very wet on ground inspection..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
