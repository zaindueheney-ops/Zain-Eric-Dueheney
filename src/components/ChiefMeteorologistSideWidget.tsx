// Source: National Meteorological Service of Belize (NMS) - https://nms.gov.bz/
import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  Thermometer,
  Waves,
  Wind,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { NmsChiefMeteorologistModal } from './NmsChiefMeteorologistModal';
import {
  fetchNmsGeneralForecast,
  fetchNmsMarineForecast,
  CHIEF_METEOROLOGIST_INFO,
  NmsGeneralForecast,
  NmsMarineForecast,
  FALLBACK_NMS_GENERAL_FORECAST,
  FALLBACK_NMS_MARINE_FORECAST
} from '../services/nmsWeatherService';

interface ChiefMeteorologistSideWidgetProps {
  variant?: 'card' | 'floating' | 'compact';
}

export const ChiefMeteorologistSideWidget: React.FC<ChiefMeteorologistSideWidgetProps> = ({
  variant = 'card'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generalForecast, setGeneralForecast] = useState<NmsGeneralForecast>(
    FALLBACK_NMS_GENERAL_FORECAST
  );
  const [marineForecast, setMarineForecast] = useState<NmsMarineForecast>(
    FALLBACK_NMS_MARINE_FORECAST
  );
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [genResult, marResult] = await Promise.all([
        fetchNmsGeneralForecast(),
        fetchNmsMarineForecast()
      ]);
      setGeneralForecast(genResult.data);
      setMarineForecast(marResult.data);
      setIsLive(genResult.isLive || marResult.isLive);
    } catch (err) {
      console.warn('Chief Meteorologist Desk sync notice (using cached data):', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Floating Side Tab variant (fixed to right margin)
  if (variant === 'floating') {
    return (
      <>
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 px-3 py-2.5 rounded-l-2xl bg-gradient-to-l from-[#0c1a30] via-[#091529] to-[#060f1e] border-y border-l border-cyan-500/50 hover:border-cyan-400 text-white shadow-2xl shadow-cyan-950/80 transition-all duration-300 hover:-translate-x-1 hover:shadow-cyan-500/20"
            title="Chief Meteorologist Weather & Marine Desk • Ronald Gordon (NMS)"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <CloudSun className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="text-left pr-1 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  NMS Belize
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs font-bold text-white">Chief Met Desk</div>
              <div className="text-[10px] text-slate-300 font-mono">
                {generalForecast.coast_high_f || 87}°F • Sea: {generalForecast.sea_state_m2m?.[0] || 'Moderate'}
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        <NmsChiefMeteorologistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          generalForecast={generalForecast}
          marineForecast={marineForecast}
          isLive={isLive}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
        />
      </>
    );
  }

  // Compact badge variant
  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d182b] hover:bg-[#152542] text-cyan-200 hover:text-white border border-cyan-500/40 text-xs font-bold transition shadow-sm"
        >
          <CloudSun className="w-4 h-4 text-cyan-400" />
          <span>Chief Met Desk ({generalForecast.coast_high_f || 87}°F)</span>
        </button>

        <NmsChiefMeteorologistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          generalForecast={generalForecast}
          marineForecast={marineForecast}
          isLive={isLive}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
        />
      </>
    );
  }

  // Dedicated Side Card Variant (Default)
  return (
    <>
      <div className="bg-gradient-to-br from-[#0a1426] via-[#0d1a33] to-[#081020] rounded-2xl border border-cyan-500/30 hover:border-cyan-400/60 p-4 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <CloudSun className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  NMS Belize
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-emerald-400 font-bold uppercase">
                  {isLive ? 'Live Sync' : 'Active'}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
                Chief Meteorologist Desk
              </h4>
            </div>
          </div>

          <a
            href="https://nms.gov.bz/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Open Official National Meteorological Service Portal (nms.gov.bz)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </a>
        </div>

        {/* Lead Officer Info */}
        <div className="bg-[#060c17]/80 p-2.5 rounded-xl border border-[#172744] space-y-1 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Chief Officer:</span>
            <span className="font-bold text-[#f3c853]">{CHIEF_METEOROLOGIST_INFO.name}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Forecast Schedule:</span>
            <span className="text-slate-300 font-mono">{generalForecast.forecast_time || '6:00 AM / 12:00 PM'}</span>
          </div>
        </div>

        {/* Weather Conditions Quick Strip */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#060c17]/60 p-2 rounded-xl border border-[#172744] flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Coast Temp</span>
              <span className="font-black text-white font-mono">{generalForecast.coast_high_f || 87}°F</span>
            </div>
          </div>

          <div className="bg-[#060c17]/60 p-2 rounded-xl border border-[#172744] flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Sea State</span>
              <span className="font-black text-white font-mono">{generalForecast.sea_state_m2m?.[0] || 'Moderate'}</span>
            </div>
          </div>
        </div>

        {/* Open Desk CTA */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Open Full Weather & Marine Desk</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <NmsChiefMeteorologistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        generalForecast={generalForecast}
        marineForecast={marineForecast}
        isLive={isLive}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />
    </>
  );
};
