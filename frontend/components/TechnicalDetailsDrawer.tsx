"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Cpu, FlaskConical, BarChart3, Database } from "lucide-react";
import { LiveTelemetryStrip } from "./LiveTelemetryStrip";
import { ConflictTraceAccordion } from "./ConflictTraceAccordion";
import { DomainEvidenceGrid } from "./DomainEvidenceGrid";
import { DecisionResponse, TelemetryPayload } from "../lib/types";

interface Props {
  decision: DecisionResponse | null;
  telemetry: TelemetryPayload | null;
  loadingTelemetry: boolean;
  onRefreshTelemetry: () => void;
}

export const TechnicalDetailsDrawer: React.FC<Props> = ({
  decision,
  telemetry,
  loadingTelemetry,
  onRefreshTelemetry,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-800/80 bg-slate-900/40 rounded-3xl overflow-hidden transition-all shadow-lg">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/80 hover:bg-slate-850 text-left transition border-b border-slate-800/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Advanced Agronomic Telemetry & Multi-Agent Research Audit
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                For Researchers & Supervisors
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Explore raw sensor streams (ET₀, GDD, Volumetric Moisture), parallel agent outputs, and LangGraph trace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <span>{isOpen ? "Hide Scientific Details" : "View Scientific Details"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content Body */}
      {isOpen && (
        <div className="p-6 space-y-6 bg-slate-950/60 animate-fadeIn">
          {/* Live Sensor & Telemetry Strip */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Microclimate & Soil Physical Sensor Telemetry
              </h4>
            </div>
            <LiveTelemetryStrip
              telemetry={telemetry}
              loading={loadingTelemetry}
              onRefresh={onRefreshTelemetry}
            />
          </div>

          {/* LangGraph Coordinator Trace */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                2. LangGraph Coordinator Multi-Agent Conflict Trace
              </h4>
            </div>
            <ConflictTraceAccordion decision={decision} />
          </div>

          {/* Individual Domain Agent Outputs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Parallel Fan-Out Agent Evidence & Metrics Grid
              </h4>
            </div>
            <DomainEvidenceGrid decision={decision} />
          </div>
        </div>
      )}
    </div>
  );
};
