"use client";

import React, { useState, useEffect } from "react";
import { Leaf, History, Trophy, Sparkles, AlertCircle, CheckCircle2, CloudSun, MapPin, Calendar, Sprout } from "lucide-react";
import { FarmSelector } from "../components/FarmSelector";
import { DecisionHeroCard } from "../components/DecisionHeroCard";
import { FeedbackOverrideBar } from "../components/FeedbackOverrideBar";
import { TechnicalDetailsDrawer } from "../components/TechnicalDetailsDrawer";
import { AgriChatWidget } from "../components/chatbot/AgriChatWidget";
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

  const handleLocationSelect = (lat: number, lon: number, townName: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
      farm_id: `FARM-${townName.toUpperCase().replace(/\s+/g, "-")}`,
    }));
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
      showToast("Agri-Decision computed successfully!");
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
                  Sri Lanka Smart Farming
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-Agent Real-Time Irrigation & Agronomic Advisory
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
                <span>Farmer Advisory</span>
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
            {/* Top Row: Farm & Location Selector + Quick Weather Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                <FarmSelector
                  formData={formData}
                  onChange={handleFieldChange}
                  onRunEngine={handleRunEngine}
                  loading={loadingDecision}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              {/* Quick Farm & Live Weather Snapshot */}
              <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">Live Field Snapshot</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                      ● Active Field Telemetry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Temperature</div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {telemetry?.hourly?.temperature_2m?.[0] !== undefined
                          ? `${telemetry.hourly.temperature_2m[0].toFixed(1)}°C`
                          : "--"}
                      </div>
                      <div className="text-[10px] text-slate-500">Live Field Reading</div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Rain Forecast</div>
                      <div className="text-lg font-bold text-cyan-400 mt-0.5">
                        {telemetry?.hourly?.precipitation?.slice(0, 24)
                          ? `${telemetry.hourly.precipitation.slice(0, 24).reduce((a, b) => a + b, 0).toFixed(1)} mm`
                          : "--"}
                      </div>
                      <div className="text-[10px] text-slate-500">Next 24 Hours</div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Soil Moisture</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">
                        {telemetry?.hourly?.soil_moisture_3_to_9cm?.[0] !== undefined
                          ? `${(telemetry.hourly.soil_moisture_3_to_9cm[0] * 100).toFixed(1)}%`
                          : "--"}
                      </div>
                      <div className="text-[10px] text-slate-500">Root-zone (3-9cm)</div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Crop Selected</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5 truncate">
                        {formData.crop_type}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Planted {formData.planting_date}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practical Quick Tip Banner */}
                <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-950 border border-emerald-800/30 rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    <strong className="text-emerald-300">Quick Farmer Tip:</strong> When you change location or crop, tap <span className="text-emerald-400 font-semibold">"Get Irrigation Advisory"</span> to update decisions with live soil moisture and rain forecasts.
                  </p>
                </div>
              </div>
            </div>

            {/* Tier 1: Actionable Farmer Hero Card */}
            <DecisionHeroCard decision={decision} loading={loadingDecision} cropName={formData.crop_type} />

            {/* Tier 2: Feedback & Farmer Override */}
            <FeedbackOverrideBar decision={decision} onFeedbackSubmitted={showToast} />

            {/* Tier 3: Collapsible Technical Drawer (For Researchers & Supervisors) */}
            <TechnicalDetailsDrawer
              decision={decision}
              telemetry={telemetry}
              loadingTelemetry={loadingTelemetry}
              onRefreshTelemetry={() => fetchTelemetry(formData.latitude, formData.longitude, true)}
            />

            {/* Floating LLM Agronomic Assistant Widget */}
            <AgriChatWidget
              cropType={formData.crop_type}
              plantingDate={formData.planting_date}
              farmId={formData.farm_id}
              decision={decision}
              telemetry={telemetry}
            />
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

