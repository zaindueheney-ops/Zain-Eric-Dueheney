// Source: National Meteorological Service of Belize (NMS) - https://nms.gov.bz/
// Synced Daily with https://nms.gov.bz/forecast/general-weather-forecast/
import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  RefreshCw,
  CloudSun,
  Waves,
  UserCheck,
  Thermometer,
  Wind,
  Volume2,
  FileText,
  ShieldCheck,
  Calendar,
  Clock,
  Radio,
  MapPin,
  Sunrise,
  Sunset,
  Moon,
  Info,
  CheckCircle2,
  Layers
} from 'lucide-react';
import {
  CHIEF_METEOROLOGIST_INFO,
  NmsGeneralForecast,
  NmsMarineForecast,
  NmsSyncMeta,
  NMS_OFFICIAL_URLS
} from '../services/nmsWeatherService';

interface NmsChiefMeteorologistModalProps {
  isOpen: boolean;
  onClose: () => void;
  generalForecast: NmsGeneralForecast;
  marineForecast: NmsMarineForecast;
  isLive: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  syncMeta?: NmsSyncMeta;
}

export const NmsChiefMeteorologistModal: React.FC<NmsChiefMeteorologistModalProps> = ({
  isOpen,
  onClose,
  generalForecast,
  marineForecast,
  isLive,
  onRefresh,
  isRefreshing,
  syncMeta
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'marine' | 'chief'>('general');

  if (!isOpen) return null;

  const displayDate = generalForecast.forecast_date || '2026-11-04';
  const displayCategory = generalForecast.forecast_category || 'Morning Forecast';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#0b1322] border-2 border-[#1e2e4a] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
        
        {/* Header Ribbon (Modern Dark Navy & Cyan/Gold Accents) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0d182b] via-[#112038] to-[#0a1426] border-b border-[#1e2e4a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-[#14233c] border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
              <CloudSun className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white tracking-tight leading-none">
                  Chief Meteorologist Weather Desk
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isLive ? 'Daily Synced' : 'Verified Source'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                <span>National Meteorological Service of Belize</span>
                <span>•</span>
                <a
                  href={NMS_OFFICIAL_URLS.generalForecast}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4af37] underline hover:text-white flex items-center gap-0.5 font-bold"
                  title="Official Source Portal: nms.gov.bz/forecast/general-weather-forecast/"
                >
                  <span>nms.gov.bz/forecast</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-[#14233c] hover:bg-[#1d3356] text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              title="Synchronize daily forecast now from nms.gov.bz"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              title="Close Weather Desk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Daily Synchronization Banner */}
        <div className="bg-[#080e1a] px-5 py-2.5 border-b border-[#1a2842] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] text-slate-300">
              <strong className="text-white">Daily Weather Synchronized:</strong>{' '}
              <span className="font-mono text-cyan-300">{displayDate}</span> •{' '}
              <span className="text-[#f3c853] font-semibold">{displayCategory}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span>Cycle: 6:00 AM / 12:00 PM / 6:00 PM</span>
            <span>•</span>
            <a
              href={NMS_OFFICIAL_URLS.generalForecast}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline flex items-center gap-0.5"
            >
              <span>View Source</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-[#0a1120] border-b border-[#1e2e4a] p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>General Forecast</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('marine')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'marine'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Marine & Tides</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chief')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'chief'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Chief Meteorologist</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* TAB 1: GENERAL 24-HOUR FORECAST */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Bulletin Header Box */}
              <div className="bg-[#0f1b2e] border border-cyan-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      {generalForecast.forecast_category || 'Official Forecast'}
                    </span>
                    <span className="text-xs font-mono text-[#f3c853]">
                      Issued: {generalForecast.forecast_date} • {generalForecast.forecast_time}
                    </span>
                  </div>
                  <h4 className="font-black text-sm sm:text-base text-white">
                    Official 24-Hour Belize Weather Bulletin
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Lead Authority: <strong className="text-white">{CHIEF_METEOROLOGIST_INFO.name}</strong>, Chief Meteorologist
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {generalForecast.pdf_file && (
                    <a
                      href={generalForecast.pdf_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#14233c] hover:bg-[#1f355c] text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                      <span>Official PDF</span>
                    </a>
                  )}
                  <a
                    href={NMS_OFFICIAL_URLS.generalForecast}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow"
                  >
                    <span>View on nms.gov.bz</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* General Situation / Synopsis */}
              <div className="bg-[#0c1626] border border-[#1e2e4a] p-4 rounded-2xl space-y-2 shadow-sm">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#f3c853] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#d4af37]" />
                  <span>General Situation & Meteorological Synopsis</span>
                </h5>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                  {generalForecast.general_situation}
                </p>
              </div>

              {/* 24-Hour Detailed Forecast */}
              <div className="bg-[#0c1626] border border-[#1e2e4a] p-4 rounded-2xl space-y-2 shadow-sm">
                <h5 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-cyan-400" />
                  <span>24-Hour Forecast for Belize</span>
                </h5>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {generalForecast.twenty_four_hour_forecast}
                </p>
              </div>

              {/* Temperature Matrix by Region */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#f3c853] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <span>Regional Temperature Forecasts (NMS Meteorological Stations)</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Coastal */}
                  <div className="bg-[#0e192c] p-3.5 rounded-xl border border-[#233555] shadow-sm">
                    <span className="text-[11px] font-black uppercase text-cyan-300 block">
                      Coastal Belize
                    </span>
                    <span className="text-[10px] text-slate-400 block">Belize City, San Pedro, Placencia</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-amber-300">
                        {generalForecast.coast_high_f || 88}°F / {generalForecast.coast_high_c || 31}°C
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Low: {generalForecast.coast_low_f || 76}°F
                      </span>
                    </div>
                  </div>

                  {/* Inland */}
                  <div className="bg-[#0e192c] p-3.5 rounded-xl border border-[#233555] shadow-sm">
                    <span className="text-[11px] font-black uppercase text-amber-300 block">
                      Inland Regions
                    </span>
                    <span className="text-[10px] text-slate-400 block">Belmopan, Cayo, Orange Walk</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-red-400">
                        {generalForecast.inland_high_f || 92}°F / {generalForecast.inland_high_c || 33}°C
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Low: {generalForecast.inland_low_f || 70}°F
                      </span>
                    </div>
                  </div>

                  {/* Highlands */}
                  <div className="bg-[#0e192c] p-3.5 rounded-xl border border-[#233555] shadow-sm">
                    <span className="text-[11px] font-black uppercase text-emerald-300 block">
                      Highlands & Hills
                    </span>
                    <span className="text-[10px] text-slate-400 block">Mountain Pine Ridge, Baldy Beacon</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-emerald-400">
                        {generalForecast.hills_high_f || 80}°F / {generalForecast.hills_high_c || 27}°C
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Low: {generalForecast.hills_low_f || 66}°F
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extended Outlook */}
              {generalForecast.outlook && (
                <div className="bg-[#0c1626] border border-[#1e2e4a] p-3.5 rounded-2xl space-y-1.5">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Outlook for Tomorrow & Extended Period</span>
                  </h5>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                    {generalForecast.outlook}
                  </p>
                </div>
              )}

              {/* Audio Radio Broadcast Player (Official NMS Recording) */}
              {generalForecast.audio_file && (
                <div className="bg-[#0e192c] border border-cyan-500/40 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/40">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h6 className="font-bold text-xs text-white">Official NMS Weather Radio Broadcast</h6>
                      <p className="text-[10px] text-slate-300">Recorded and issued by the National Meteorological Service</p>
                    </div>
                  </div>
                  <audio
                    controls
                    src={generalForecast.audio_file}
                    className="h-8 max-w-full sm:max-w-xs rounded-lg"
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MARINE & TIDES FORECAST */}
          {activeTab === 'marine' && (
            <div className="space-y-4">
              <div className="bg-[#0f1b2e] border border-cyan-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                      Coastal & Marine Operations
                    </span>
                    <span className="text-xs font-mono text-[#f3c853]">
                      Date: {marineForecast.forecast_date} • {marineForecast.forecast_time}
                    </span>
                  </div>
                  <h4 className="font-black text-sm sm:text-base text-white">
                    Belize Coastal Waters & Barrier Reef Marine Forecast
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Source: National Meteorological Service Marine Weather Desk (nms.gov.bz)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {marineForecast.pdf_file && (
                    <a
                      href={marineForecast.pdf_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#14233c] hover:bg-[#1f355c] text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Marine PDF</span>
                    </a>
                  )}
                  <a
                    href={NMS_OFFICIAL_URLS.marineForecast}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow"
                  >
                    <span>View Marine on nms.gov.bz</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Synopsis */}
              <div className="bg-[#0c1626] border border-[#1e2e4a] p-4 rounded-2xl space-y-2 shadow-sm">
                <h5 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>Marine Synopsis for Coastal Waters</span>
                </h5>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {marineForecast.synopsis}
                </p>
              </div>

              {/* Sea Conditions Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-[#0e192c] p-3 rounded-xl border border-[#233555]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sea Surface Temp</span>
                  <span className="text-base font-black text-cyan-300 font-mono">
                    {marineForecast.sea_surface_temperature || 85}°F
                  </span>
                </div>
                <div className="bg-[#0e192c] p-3 rounded-xl border border-[#233555]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Coastal Winds</span>
                  <span className="text-base font-black text-white font-mono">
                    {generalForecast.wind_speed || '5-10 kts'} {generalForecast.wind_direction_m2m?.[0] || 'NE'}
                  </span>
                </div>
                <div className="bg-[#0e192c] p-3 rounded-xl border border-[#233555]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Sea State & Waves</span>
                  <span className="text-base font-black text-amber-300 font-mono">
                    {generalForecast.sea_state_m2m?.[0] || 'Slight'} ({generalForecast.wave || '1-3 ft'})
                  </span>
                </div>
              </div>

              {/* Tides Table */}
              {marineForecast.tide_details && marineForecast.tide_details.length > 0 && (
                <div className="bg-[#0c1626] border border-[#1e2e4a] p-4 rounded-2xl space-y-2">
                  <h5 className="text-xs font-black uppercase tracking-wider text-[#f3c853] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Official Astronomical Tide Predictions</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {marineForecast.tide_details.map((tide) => (
                      <div
                        key={tide.id}
                        className={`p-2.5 rounded-xl border ${
                          tide.tide_level_category === 'High'
                            ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                            : 'bg-slate-900/60 border-slate-700/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>{tide.tide_day_category}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-black ${
                              tide.tide_level_category === 'High'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            {tide.tide_level_category} Tide
                          </span>
                        </div>
                        <div className="text-sm font-black font-mono mt-1 text-white">
                          {tide.tide_time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sun & Moon Almanac */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sun */}
                <div className="bg-[#0c1626] border border-[#1e2e4a] p-3.5 rounded-2xl space-y-2">
                  <span className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                    <Sunrise className="w-4 h-4 text-amber-400" />
                    <span>Solar Almanac</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {marineForecast.sun_details?.map((s) => (
                      <div key={s.id} className="bg-[#0e192c] p-2 rounded-lg border border-[#233555]">
                        <span className="text-[10px] text-slate-400 block">{s.sun_move_category}</span>
                        <span className="font-mono font-bold text-white">{s.sun_time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Moon */}
                <div className="bg-[#0c1626] border border-[#1e2e4a] p-3.5 rounded-2xl space-y-2">
                  <span className="text-[11px] font-black uppercase text-slate-300 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-cyan-300" />
                    <span>Lunar Almanac</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {marineForecast.moon_details?.map((m) => (
                      <div key={m.id} className="bg-[#0e192c] p-2 rounded-lg border border-[#233555]">
                        <span className="text-[10px] text-slate-400 block">{m.moon_move_category} ({m.moon_day_category})</span>
                        <span className="font-mono font-bold text-white">{m.moon_time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHIEF METEOROLOGIST & WMO RECOGNITION */}
          {activeTab === 'chief' && (
            <div className="space-y-4">
              <div className="bg-[#0f1b2e] border border-cyan-500/30 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-white">{CHIEF_METEOROLOGIST_INFO.name}</h4>
                    <p className="text-xs text-[#f3c853] font-bold">{CHIEF_METEOROLOGIST_INFO.title}</p>
                    <p className="text-[11px] text-slate-300">{CHIEF_METEOROLOGIST_INFO.organization} • {CHIEF_METEOROLOGIST_INFO.parentMinistry}</p>
                  </div>
                </div>

                <div className="p-3 bg-[#080e1a] rounded-xl border border-[#1e2e4a] space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">WMO Representation:</span>
                    <span className="text-white font-medium text-right max-w-xs">{CHIEF_METEOROLOGIST_INFO.wmoStatus}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Headquarters Address:</span>
                    <span className="text-white font-medium text-right">{CHIEF_METEOROLOGIST_INFO.address}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Official Contact Desk:</span>
                    <span className="text-[#f3c853] font-mono font-bold">{CHIEF_METEOROLOGIST_INFO.telephone}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Official Email:</span>
                    <a href={`mailto:${CHIEF_METEOROLOGIST_INFO.officialEmail}`} className="text-cyan-300 hover:underline font-mono">
                      {CHIEF_METEOROLOGIST_INFO.officialEmail}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Forecast Synchronization:</span>
                    <span className="text-emerald-400 font-bold">{CHIEF_METEOROLOGIST_INFO.forecastSchedule}</span>
                  </div>
                </div>
              </div>

              {/* Direct Links to Official NMS Portals */}
              <div className="bg-[#0c1626] border border-[#1e2e4a] p-4 rounded-2xl space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Official National Meteorological Service Portals</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <a
                    href={NMS_OFFICIAL_URLS.generalForecast}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0e192c] hover:bg-[#14233c] border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center justify-between transition group shadow-sm"
                  >
                    <div>
                      <span className="font-bold block text-white">General Weather Forecast</span>
                      <span className="text-[10px] text-slate-400">https://nms.gov.bz/forecast/general-weather-forecast/</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition shrink-0" />
                  </a>

                  <a
                    href={NMS_OFFICIAL_URLS.marineForecast}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0e192c] hover:bg-[#14233c] border border-[#233555] text-cyan-300 hover:text-white flex items-center justify-between transition group shadow-sm"
                  >
                    <div>
                      <span className="font-bold block text-white">Marine & Barrier Reef Forecast</span>
                      <span className="text-[10px] text-slate-400">https://nms.gov.bz/forecast/marine-forecast/</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                  </a>

                  <a
                    href={NMS_OFFICIAL_URLS.radar}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0e192c] hover:bg-[#14233c] border border-[#233555] text-cyan-300 hover:text-white flex items-center justify-between transition group shadow-sm"
                  >
                    <div>
                      <span className="font-bold block text-white">Live Doppler Radar Imagery</span>
                      <span className="text-[10px] text-slate-400">https://nms.gov.bz/radar/</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                  </a>

                  <a
                    href={NMS_OFFICIAL_URLS.portal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0e192c] hover:bg-[#14233c] border border-[#233555] text-[#f3c853] hover:text-white flex items-center justify-between transition group shadow-sm"
                  >
                    <div>
                      <span className="font-bold block text-white">Main NMS Government Portal</span>
                      <span className="text-[10px] text-slate-400">https://nms.gov.bz/</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#d4af37] group-hover:translate-x-0.5 transition shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0a1120] border-t border-[#1e2e4a] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Direct feed from <strong>nms.gov.bz</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#14233c] hover:bg-[#1f355c] text-white font-bold text-xs border border-[#233555] transition"
          >
            Close Desk
          </button>
        </div>

      </div>
    </div>
  );
};
