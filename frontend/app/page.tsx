"use client";

import React, { useState, useEffect } from "react";
import { Leaf, History, Trophy, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { FarmSelector } from "../components/FarmSelector";
import { LiveTelemetryStrip } from "../components/LiveTelemetryStrip";
import { DecisionHeroCard } from "../components/DecisionHeroCard";
import { ConflictTraceAccordion } from "../components/ConflictTraceAccordion";
import { DomainEvidenceGrid } from "../components/DomainEvidenceGrid";
import { FeedbackOverrideBar } from "../components/FeedbackOverrideBar";
import { GoldenBenchmarkTab } from "../components/GoldenBenchmarkTab";
import { DecisionHistoryModal } from "../components/DecisionHistoryModal";
import { fetchLiveTelemetry, requestIrrigationDecision } from "../lib/api";
import { DecisionRequest, DecisionResponse, TelemetryPayload } from "../lib/types";

export default function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "benchmark">("dashboard");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<DecisionRequest>({
    farm_id: "FARM-LK-01",
    crop_type: "Maize",
    latitude: 8.3114,
    longitude: 80.4037,
    planting_date: "2026-07-15",
  });

  // Telemetry & Decision State
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFieldChange = (field: keyof DecisionRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadPreset = (farmId: string, crop: string, lat: number, lon: number, plantDate: string) => {
    setFormData({
      farm_id: farmId,
      crop_type: crop,
      latitude: lat,
      longitude: lon,
      planting_date: plantDate,
    });
    fetchTelemetry(lat, lon);
  };

  const fetchTelemetry = async (lat: number, lon: number, forceRefresh: boolean = false) => {
    setLoadingTelemetry(true);
    try {
      const data = await fetchLiveTelemetry(lat, lon, forceRefresh);
      setTelemetry(data);
    } catch (err: any) {
      console.warn("Could not fetch telemetry:", err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const handleRunEngine = async () => {
    setLoadingDecision(true);
    try {
      // Sync telemetry first
      await fetchTelemetry(formData.latitude, formData.longitude);

      // Run decision pipeline
      const res = await requestIrrigationDecision(formData);
      setDecision(res);
      showToast("Multi-Agent decision computed successfully!");
    } catch (err: any) {
      alert("Pipeline Execution Error: " + err.message);
    } finally {
      setLoadingDecision(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(formData.latitude, formData.longitude);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">AgriDecision Advisory</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Next.js 14 App Router
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                LangGraph Parallel Fan-Out → Fan-In Multi-Agent Architecture
              </p>
            </div>
          </div>

          {/* Action Tabs & Buttons */}
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-800/80 border border-slate-700/80 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "dashboard"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("benchmark")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "benchmark"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Golden Benchmark</span>
              </button>
            </div>

            <button
              onClick={() => setHistoryModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-1.5"
              title="View Decision Audit History"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Audit Logs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === "dashboard" ? (
          <>
            {/* Top Grid: Form Inputs + Live Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <FarmSelector
                  formData={formData}
                  onChange={handleFieldChange}
                  onRunEngine={handleRunEngine}
                  loading={loadingDecision}
                  onPresetSelect={loadPreset}
                />
              </div>

              <div className="lg:col-span-3">
                <LiveTelemetryStrip
                  telemetry={telemetry}
                  loading={loadingTelemetry}
                  onRefresh={() => fetchTelemetry(formData.latitude, formData.longitude, true)}
                />
              </div>
            </div>

            {/* Tier 1: Immediate Action (Decision Hero Card) */}
            <DecisionHeroCard decision={decision} loading={loadingDecision} />

            {/* Tier 2: The "Why" (Coordinator Conflict Trace Accordion) */}
            <ConflictTraceAccordion decision={decision} />

            {/* Tier 3: Domain Evidence Grid */}
            <DomainEvidenceGrid decision={decision} />

            {/* Tier 4: Feedback Override Bar */}
            <FeedbackOverrideBar decision={decision} onFeedbackSubmitted={showToast} />
          </>
        ) : (
          <GoldenBenchmarkTab />
        )}
      </main>

      {/* Decision Audit History Modal */}
      <DecisionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        farmId={formData.farm_id}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
