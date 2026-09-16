import React, { useState } from "react";
import { MapPin, Navigation, ChevronDown, ChevronUp, Play, Loader2, Sparkles } from "lucide-react";
import { DecisionRequest } from "../lib/types";
import { SRI_LANKA_LOCATIONS } from "../lib/locations";
import { CROPS_CATALOG } from "../lib/crops";

interface Props {
  formData: DecisionRequest;
  onChange: (field: keyof DecisionRequest, value: string | number) => void;
  onRunEngine: () => void;
  loading: boolean;
  onLocationSelect: (lat: number, lon: number, townName: string) => void;
}

export const FarmSelector: React.FC<Props> = ({
  formData,
  onChange,
  onRunEngine,
  loading,
  onLocationSelect,
}) => {
  const [selectedTown, setSelectedTown] = useState<string>("Anuradhapura");
  const [locating, setLocating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Group crops by category
  const categories = Array.from(new Set(CROPS_CATALOG.map((c) => c.category)));

  const handleTownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const townName = e.target.value;
    setSelectedTown(townName);
    const loc = SRI_LANKA_LOCATIONS.find((l) => l.name === townName);
    if (loc) {
      onLocationSelect(loc.latitude, loc.longitude, loc.name);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setSelectedTown("My Current Location (GPS)");
        onLocationSelect(lat, lon, "My Location");
        setLocating(false);
      },
      (err) => {
        alert("Could not access GPS location. Please choose your nearest town from the list.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div>
          <h2 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Select Your Farm &amp; Crop</span>
          </h2>
          <p className="text-xs text-slate-400">Tell us where your farm is and what you are growing</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Location Selection: 1-Click GPS Button & Town Dropdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. Farm Location</span>
            </label>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="text-[11px] font-bold px-3 py-1 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-sm"
            >
              {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
              <span>📍 Use My Current Location</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedTown}
              onChange={handleTownChange}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
            >
              <option disabled value="">Select your town or district...</option>
              {selectedTown === "My Current Location (GPS)" && (
                <option value="My Current Location (GPS)">📍 My Current Location (Detected via Device GPS)</option>
              )}
              {SRI_LANKA_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} ({loc.district} District • {loc.province} Province)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Categorized Crop Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 block">
            <span>2. Crop Planted</span>
          </label>

          <div className="relative">
            <select
              value={formData.crop_type}
              onChange={(e) => onChange("crop_type", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <optgroup key={cat} label={`── ${cat} ──`} className="bg-slate-900 text-slate-300 font-bold">
                  {CROPS_CATALOG.filter((c) => c.category === cat).map((crop) => (
                    <option key={crop.id} value={crop.id} className="text-slate-100 py-1">
                      {crop.emoji} {crop.name} — ({crop.localName})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Planting Date Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 block">
            <span>3. When Was It Planted?</span>
          </label>
          <input
            type="date"
            value={formData.planting_date}
            onChange={(e) => onChange("planting_date", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs md:text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
        </div>

        {/* Collapsible Advanced GPS & Plot ID (Hidden by default) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1.5 transition"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showAdvanced ? "Hide Technical Coordinates" : "🔧 Advanced: View/Edit Raw GPS Coordinates"}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-3 text-xs animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => onChange("latitude", parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => onChange("longitude", parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Farm Plot Code</label>
                <input
                  type="text"
                  value={formData.farm_id}
                  onChange={(e) => onChange("farm_id", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Big Action Button */}
        <button
          type="button"
          onClick={onRunEngine}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Satellite &amp; Soil Data...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Get Today's Irrigation Advice</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
