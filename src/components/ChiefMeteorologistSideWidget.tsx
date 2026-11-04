// Source: National Meteorological Service of Belize (NMS) - https://nms.gov.bz/
// Synced Daily with https://nms.gov.bz/forecast/general-weather-forecast/
import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  Thermometer,
  Waves,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Radio
} from 'lucide-react';
import { NmsChiefMeteorologistModal } from './NmsChiefMeteorologistModal';
import {
  syncDailyNmsWeather,
  getCachedGeneralForecast,
  getCachedMarineForecast,
  getNmsSyncMeta,
  CHIEF_METEOROLOGIST_INFO,
  NmsGeneralForecast,
  NmsMarineForecast,
  NmsSyncMeta,
  NMS_OFFICIAL_URLS
} from '../services/nmsWeatherService';

interface ChiefMeteorologistSideWidgetProps {
  variant?: 'card' | 'floating' | 'compact';
}

export const ChiefMeteorologistSideWidget: React.FC<ChiefMeteorologistSideWidgetProps> = ({
  variant = 'card'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generalForecast, setGeneralForecast] = useState<NmsGeneralForecast>(() =>
    getCachedGeneralForecast()
  );
  const [marineForecast, setMarineForecast] = useState<NmsMarineForecast>(() =>
    getCachedMarineForecast()
  );
  const [syncMeta, setSyncMeta] = useState<NmsSyncMeta>(() => getNmsSyncMeta());
  const [isLive, setIsLive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await syncDailyNmsWeather();
      setGeneralForecast(res.general);
      setMarineForecast(res.marine);
      setSyncMeta(res.syncMeta);
      setIsLive(res.syncMeta.isLive);
    } catch (err) {
      console.warn('Chief Meteorologist Desk sync notice (using cached data):', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load + periodic daily re-sync every 15 minutes + window focus check
  useEffect(() => {
    loadData();

    // Check periodically for thrice-daily forecast updates (6am, 12pm, 6pm)
    const interval = setInterval(() => {
      loadData();
    }, 15 * 60 * 1000);

    const onFocus = () => {
      loadData();
    };
    window.addEventListener('focus', onFocus);

    const onSyncEvent = (e: any) => {
      if (e.detail?.general) setGeneralForecast(e.detail.general);
      if (e.detail?.marine) setMarineForecast(e.detail.marine);
      if (e.detail?.syncMeta) {
        setSyncMeta(e.detail.syncMeta);
        setIsLive(e.detail.syncMeta.isLive);
      }
    };
    window.addEventListener('nms-daily-weather-synced', onSyncEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('nms-daily-weather-synced', onSyncEvent);
    };
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
            title="Chief Meteorologist Weather & Marine Desk • Ronald Gordon (NMS) • Daily Synced"
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
                {generalForecast.coast_high_f || 88}°F • Sea: {generalForecast.sea_state_m2m?.[0] || 'Slight'}
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
          syncMeta={syncMeta}
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
          <span>Chief Met Desk ({generalForecast.coast_high_f || 88}°F)</span>
        </button>

        <NmsChiefMeteorologistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          generalForecast={generalForecast}
          marineForecast={marineForecast}
          isLive={isLive}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          syncMeta={syncMeta}
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
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  Daily Synced
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
                Chief Meteorologist Desk
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition"
              title="Synchronize now with nms.gov.bz"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <a
              href={NMS_OFFICIAL_URLS.generalForecast}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Open Official NMS General Weather Forecast (nms.gov.bz/forecast/general-weather-forecast/)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>
          </div>
        </div>

        {/* Lead Officer Info & Daily Schedule */}
        <div className="bg-[#060c17]/80 p-2.5 rounded-xl border border-[#172744] space-y-1 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Chief Officer:</span>
            <span className="font-bold text-[#f3c853]">{CHIEF_METEOROLOGIST_INFO.name}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Forecast Date:</span>
            <span className="text-emerald-400 font-mono font-bold">
              {generalForecast.forecast_date} • {generalForecast.forecast_category || 'Morning'}
            </span>
          </div>
          <div className="pt-0.5 text-[9px] text-cyan-300 truncate font-mono">
            Direct Feed: {NMS_OFFICIAL_URLS.generalForecast}
          </div>
        </div>

        {/* Weather Conditions Quick Strip */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#060c17]/60 p-2 rounded-xl border border-[#172744] flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Coast Temp</span>
              <span className="font-black text-white font-mono">{generalForecast.coast_high_f || 88}°F / {generalForecast.coast_high_c || 31}°C</span>
            </div>
          </div>

          <div className="bg-[#060c17]/60 p-2 rounded-xl border border-[#172744] flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Sea State</span>
              <span className="font-black text-white font-mono">{generalForecast.sea_state_m2m?.[0] || 'Slight'} ({generalForecast.wave || '1-3 ft'})</span>
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
        syncMeta={syncMeta}
      />
    </>
  );
};
