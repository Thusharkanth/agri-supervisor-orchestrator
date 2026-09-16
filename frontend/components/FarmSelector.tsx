import React from "react";
import { Sliders, MapPin, Play, Loader2 } from "lucide-react";
import { DecisionRequest } from "../lib/types";

interface Props {
  formData: DecisionRequest;
  onChange: (field: keyof DecisionRequest, value: string | number) => void;
  onRunEngine: () => void;
  loading: boolean;
  onPresetSelect: (farmId: string, crop: string, lat: number, lon: number, plantDate: string) => void;
}

export const FarmSelector: React.FC<Props> = ({
  formData,
  onChange,
  onRunEngine,
  loading,
  onPresetSelect,
}) => {
  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sri Lankan Agricultural Presets</span>
          </div>
          <span className="text-[11px] text-slate-500">Quick 1-click test configurations</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onPresetSelect("FARM-LK-01", "Maize", 8.3114, 80.4037, "2026-07-15")}
            className="p-2.5 rounded-xl text-left bg-slate-800/70 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-700/60 transition group"
          >
            <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-400">🌽 Anuradhapura</div>
            <div className="text-[10px] text-slate-400">Maize • Flowering (DAP 55)</div>
          </button>

          <button
            type="button"
            onClick={() => onPresetSelect("FARM-LK-02", "Tomato", 6.9497, 80.7891, "2026-08-01")}
            className="p-2.5 rounded-xl text-left bg-slate-800/70 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-700/60 transition group"
          >
            <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-400">🍅 Nuwara Eliya</div>
            <div className="text-[10px] text-slate-400">Tomato • Vegetative (DAP 38)</div>
          </button>

          <button
            type="button"
            onClick={() => onPresetSelect("FARM-LK-03", "Paddy", 7.8731, 80.7718, "2026-04-10")}
            className="p-2.5 rounded-xl text-left bg-slate-800/70 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-700/60 transition group"
          >
            <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-400">🌾 Polonnaruwa</div>
            <div className="text-[10px] text-slate-400">Paddy • Pre-Harvest (DAP 151)</div>
          </button>

          <button
            type="button"
            onClick={() => onPresetSelect("FARM-LK-04", "Chili", 9.6615, 80.0255, "2026-07-20")}
            className="p-2.5 rounded-xl text-left bg-slate-800/70 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-700/60 transition group"
          >
            <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-400">🌶️ Jaffna</div>
            <div className="text-[10px] text-slate-400">Chili • Fruit Set (DAP 50)</div>
          </button>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Field Configuration</h3>
          </div>
          <span className="text-[11px] text-slate-500">Live GPS Coordinates</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Farm / Plot ID</label>
            <input
              type="text"
              value={formData.farm_id}
              onChange={(e) => onChange("farm_id", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Crop Species</label>
              <select
                value={formData.crop_type}
                onChange={(e) => onChange("crop_type", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Maize">🌽 Maize</option>
                <option value="Tomato">🍅 Tomato</option>
                <option value="Paddy">🌾 Paddy / Rice</option>
                <option value="Potato">🥔 Potato</option>
                <option value="Chili">🌶️ Chili</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Planting Date</label>
              <input
                type="date"
                value={formData.planting_date}
                onChange={(e) => onChange("planting_date", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Latitude (°N)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => onChange("latitude", parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => onChange("longitude", parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRunEngine}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing LangGraph Parallel Fan-Out...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run LangGraph Multi-Agent Engine</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
