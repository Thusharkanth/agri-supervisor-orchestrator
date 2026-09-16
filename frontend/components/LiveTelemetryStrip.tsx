import React from "react";
import { Satellite, ShieldCheck, RefreshCw } from "lucide-react";
import { TelemetryPayload } from "../lib/types";

interface Props {
  telemetry: TelemetryPayload | null;
  loading: boolean;
  onRefresh: () => void;
}

export const LiveTelemetryStrip: React.FC<Props> = ({ telemetry, loading, onRefresh }) => {
  const m = telemetry?.hourly.soil_moisture_3_to_9cm?.[0] !== undefined
    ? `${(telemetry.hourly.soil_moisture_3_to_9cm[0] * 100).toFixed(1)}%`
    : "--%";

  const probs = telemetry?.hourly.precipitation_probability?.slice(0, 12) || [];
  const vols = telemetry?.hourly.precipitation?.slice(0, 12) || [];

  const maxP = probs.length > 0 ? `${Math.max(...probs)}%` : "--%";
  const sumV = vols.length > 0 ? `${vols.reduce((a, b) => a + b, 0).toFixed(1)} mm` : "-- mm";

  const temp = telemetry?.hourly.temperature_2m?.[0] !== undefined
    ? `${telemetry.hourly.temperature_2m[0].toFixed(1)}°C`
    : "--°C";

  const et0 = telemetry?.hourly.et0_fao_evapotranspiration?.[0] !== undefined
    ? `${telemetry.hourly.et0_fao_evapotranspiration[0].toFixed(1)} mm/d`
    : "--";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Live Open-Meteo Telemetry
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            {telemetry ? `Live (${telemetry.latitude.toFixed(2)}, ${telemetry.longitude.toFixed(2)})` : "Syncing..."}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 mb-1">Root-Zone Soil (3-9cm)</div>
          <div className="text-lg font-bold text-emerald-400">{m}</div>
          <div className="text-[10px] text-slate-500">Loam RAW buffer: 27%</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 mb-1">12h Rain Prob.</div>
          <div className="text-lg font-bold text-cyan-400">{maxP}</div>
          <div className="text-[10px] text-slate-500">Veto threshold: 60%</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 mb-1">12h Rain Forecast</div>
          <div className="text-lg font-bold text-blue-400">{sumV}</div>
          <div className="text-[10px] text-slate-500">Cumulative volume</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 mb-1">Temperature / ET0</div>
          <div className="text-lg font-bold text-amber-400">{temp}</div>
          <div className="text-[10px] text-slate-500">ET0: {et0}</div>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Safety Guardrail: Advisory Only (Zero Autonomous Actuation)</span>
        </div>
        <span className="text-[10px] text-slate-500">Redis Cache: 1h TTL</span>
      </div>
    </div>
  );
};
