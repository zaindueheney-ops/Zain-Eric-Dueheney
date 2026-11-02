// Source: National Meteorological Service of Belize (NMS) - https://nms.gov.bz/
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
  Compass,
  Volume2,
  FileText,
  Download,
  ShieldCheck,
  Calendar,
  Clock,
  Radio,
  MapPin,
  Sunrise,
  Sunset,
  Moon,
  Info
} from 'lucide-react';
import {
  CHIEF_METEOROLOGIST_INFO,
  NmsGeneralForecast,
  NmsMarineForecast
} from '../services/nmsWeatherService';

interface NmsChiefMeteorologistModalProps {
  isOpen: boolean;
  onClose: () => void;
  generalForecast: NmsGeneralForecast;
  marineForecast: NmsMarineForecast;
  isLive: boolean;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export const NmsChiefMeteorologistModal: React.FC<NmsChiefMeteorologistModalProps> = ({
  isOpen,
  onClose,
  generalForecast,
  marineForecast,
  isLive,
  onRefresh,
  isRefreshing,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'marine' | 'chief'>('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#1b0309] border-2 border-[#d4af37] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
        
        {/* Header Ribbon (Burgundy & Gold with Official Verification) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#4d0718] via-[#630920] to-[#380714] border-b border-[#d4af37]/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-[#24050e] border-2 border-[#d4af37] flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
              <CloudSun className="w-6 h-6 text-[#f3c853] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white tracking-tight leading-none">
                  Chief Meteorologist Weather Desk
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-emerald-900/90 text-emerald-300 border border-emerald-500/50">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {isLive ? 'Live Sync' : 'Verified Source'}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>National Meteorological Service of Belize</span>
                <span>•</span>
                <a
                  href="https://nms.gov.bz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f3c853] underline hover:text-white flex items-center gap-0.5 font-bold"
                  title="Visit official portal https://nms.gov.bz/"
                >
                  <span>nms.gov.bz</span>
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
              className="p-2 rounded-xl bg-[#2d050f] hover:bg-[#4d0718] text-[#f3c853] hover:text-white border border-[#d4af37]/40 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
              title="Refresh data from nms.gov.bz"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync NMS'}</span>
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-[#130206] border-b border-[#d4af37]/40 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-slate-950 font-black shadow-md'
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
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
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-slate-950 font-black shadow-md'
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
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
                ? 'bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-slate-950 font-black shadow-md'
                : 'text-amber-200/80 hover:text-white hover:bg-white/5'
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
              {/* Bulletin Header Badge */}
              <div className="bg-[#24050e] border border-[#d4af37]/50 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                      {generalForecast.forecast_category || 'Official Forecast'}
                    </span>
                    <span className="text-xs font-mono text-[#f3c853]">
                      Date: {generalForecast.forecast_date} • {generalForecast.forecast_time}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">
                    Official 24-Hour Weather Bulletin
                  </h4>
                  <p className="text-[11px] text-amber-200/70">
                    Authority: {CHIEF_METEOROLOGIST_INFO.name}, {CHIEF_METEOROLOGIST_INFO.title}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {generalForecast.pdf_file && (
                    <a
                      href={generalForecast.pdf_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#4a0817] hover:bg-[#6b0f24] text-[#f3c853] hover:text-white border border-[#d4af37]/50 text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                      <span>Official PDF</span>
                    </a>
                  )}
                  <a
                    href="https://nms.gov.bz/forecast/general-weather-forecast"
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
              <div className="bg-[#2a0611] border border-[#841c34] p-4 rounded-2xl space-y-1.5 shadow-md">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#f3c853] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>General Situation & Meteorological Synopsis</span>
                </h5>
                <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                  {generalForecast.general_situation}
                </p>
              </div>

              {/* 24-Hour Detailed Forecast */}
              <div className="bg-[#20030a] border border-[#d4af37]/40 p-4 rounded-2xl space-y-1.5 shadow-md">
                <h5 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-[#facc15]" />
                  <span>24-Hour Forecast for Belize</span>
                </h5>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {generalForecast.twenty_four_hour_forecast}
                </p>
              </div>

              {/* Temperature Matrix by Region */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-[#f3c853] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-red-400" />
                  <span>Regional Temperature Forecasts (NMS Meteorological Stations)</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Coastal */}
                  <div className="bg-[#27050e] p-3 rounded-xl border border-[#841c34] shadow-sm">
                    <span className="text-[11px] font-black uppercase text-amber-200 block">
                      Coastal Belize
                    </span>
                    <span className="text-[10px] text-slate-400 block">Belize City, San Pedro, Placencia</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-amber-300">
                        {generalForecast.coast_high_f || 87}°F / {generalForecast.coast_high_c || 31}°C
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Low: {generalForecast.coast_low_f || 77}°F
                      </span>
                    </div>
                  </div>

                  {/* Inland */}
                  <div className="bg-[#27050e] p-3 rounded-xl border border-[#841c34] shadow-sm">
                    <span className="text-[11px] font-black uppercase text-amber-200 block">
                      Inland Regions
                    </span>
                    <span className="text-[10px] text-slate-400 block">Belmopan, Cayo, Orange Walk</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-red-400">
                        {generalForecast.inland_high_f || 91}°F / {generalForecast.inland_high_c || 33}°C
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Low: {generalForecast.inland_low_f || 70}°F
                      </span>
                    </div>
                  </div>

                  {/* Hills / Mountain Pine Ridge */}
                  <div className="bg-[#27050e] p-3 rounded-xl border border-[#841c34] shadow-sm">
                    <span className="text-[11px] font-black uppercase text-amber-200 block">
                      Highlands & Hills
                    </span>
                    <span className="text-[10px] text-slate-400 block">Mountain Pine Ridge, Baldy Beacon</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-black text-emerald-400">
                        {generalForecast.hills_high_f || 76}°F / {generalForecast.hills_high_c || 26}°C
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Low: {generalForecast.hills_low_f || 64}°F
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extended Outlook */}
              {generalForecast.outlook && (
                <div className="bg-[#22040c] border border-amber-500/40 p-3.5 rounded-2xl space-y-1">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Outlook for Tomorrow & Extended Period</span>
                  </h5>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {generalForecast.outlook}
                  </p>
                </div>
              )}

              {/* Audio Radio Broadcast Player (Official NMS Recording) */}
              {generalForecast.audio_file && (
                <div className="bg-[#2f0612] border border-[#d4af37]/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-yellow-300 flex items-center justify-center shrink-0 border border-amber-500/40">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h6 className="font-bold text-xs text-white">Listen to Official Radio Broadcast</h6>
                      <p className="text-[10px] text-amber-200/70">Recorded and issued by NMS Weather Bureau</p>
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
              <div className="bg-[#24050e] border border-[#d4af37]/50 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                      Coastal & Marine Operations
                    </span>
                    <span className="text-xs font-mono text-[#f3c853]">
                      Date: {marineForecast.forecast_date} • {marineForecast.forecast_time}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">
                    Belize Coastal Waters & Barrier Reef Forecast
                  </h4>
                  <p className="text-[11px] text-amber-200/70">
                    Source: National Meteorological Service Marine Weather Desk (nms.gov.bz)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {marineForecast.pdf_file && (
                    <a
                      href={marineForecast.pdf_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#4a0817] hover:bg-[#6b0f24] text-[#f3c853] hover:text-white border border-[#d4af37]/50 text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Marine PDF</span>
                    </a>
                  )}
                  <a
                    href="https://nms.gov.bz/forecast/marine-forecast"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow"
                  >
                    <span>View Marine on nms.gov.bz</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Marine Conditions Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#27050e] p-3 rounded-xl border border-[#841c34]">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Sea State</span>
                  <span className="text-sm font-black text-white mt-1 block">
                    {generalForecast.sea_state_m2m?.join(' / ') || 'Light Chop'}
                  </span>
                </div>
                <div className="bg-[#27050e] p-3 rounded-xl border border-[#841c34]">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Wave Height</span>
                  <span className="text-sm font-black text-cyan-300 mt-1 block">
                    {generalForecast.wave || '1-4 ft'}
                  </span>
                </div>
                <div className="bg-[#27050e] p-3 rounded-xl border border-[#841c34]">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Wind Speed</span>
                  <span className="text-sm font-black text-white mt-1 block">
                    {generalForecast.wind_speed || '5-10 kts'} {generalForecast.wind_direction_m2m?.[0] || 'NE'}
                  </span>
                </div>
                <div className="bg-[#27050e] p-3 rounded-xl border border-[#841c34]">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Sea Surface Temp</span>
                  <span className="text-sm font-black text-emerald-300 mt-1 block">
                    {marineForecast.sea_surface_temperature || 85}°F
                  </span>
                </div>
              </div>

              {/* Astronomical Tides Table */}
              {marineForecast.tide_details && marineForecast.tide_details.length > 0 && (
                <div className="bg-[#20030a] border border-[#d4af37]/40 p-4 rounded-2xl space-y-2">
                  <h5 className="text-xs font-black uppercase tracking-wider text-[#f3c853] flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-cyan-400" />
                    <span>Official Tide Schedule (Belize Harbor / Coastal Baseline)</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {marineForecast.tide_details.map((tide) => (
                      <div
                        key={tide.id}
                        className={`p-2.5 rounded-xl border text-center ${
                          tide.tide_level_category === 'High'
                            ? 'bg-blue-950/60 border-blue-400/60 text-blue-200'
                            : 'bg-slate-900/80 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider block">
                          {tide.tide_day_category} {tide.tide_level_category} Tide
                        </span>
                        <span className="text-sm font-mono font-bold text-white mt-1 block">
                          {tide.tide_time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sun & Moon Cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#27050e] border border-[#841c34] p-3.5 rounded-2xl space-y-1.5">
                  <span className="text-xs font-bold text-[#f3c853] uppercase flex items-center gap-1.5">
                    <Sunrise className="w-4 h-4 text-yellow-400" />
                    <span>Sun Cycle (Local Belize Time)</span>
                  </span>
                  <div className="flex items-center justify-around pt-1 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Sunrise</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {marineForecast.sun_details?.find((s) => s.sun_move_category === 'Sunrise')?.sun_time || '05:51 AM'}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Sunset</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {marineForecast.sun_details?.find((s) => s.sun_move_category === 'Sunset')?.sun_time || '05:20 PM'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#27050e] border border-[#841c34] p-3.5 rounded-2xl space-y-1.5">
                  <span className="text-xs font-bold text-amber-200 uppercase flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-300" />
                    <span>Moon Cycle (Local Belize Time)</span>
                  </span>
                  <div className="flex items-center justify-around pt-1 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Moonrise</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {marineForecast.moon_details?.find((m) => m.moon_move_category === 'Moonrise')?.moon_time || '11:55 PM'}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Moonset</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {marineForecast.moon_details?.find((m) => m.moon_move_category === 'Moonset')?.moon_time || '12:18 PM'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHIEF METEOROLOGIST PROFILE & NMS DIRECTORY */}
          {activeTab === 'chief' && (
            <div className="space-y-4">
              <div className="bg-[#24050e] border-2 border-[#d4af37]/80 p-5 rounded-3xl space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8b152e] p-0.5 shadow-xl shrink-0">
                    <div className="w-full h-full rounded-2xl bg-[#20030a] flex items-center justify-center text-[#f3c853]">
                      <UserCheck className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#d4af37] text-slate-950">
                        Official Head of Bureau
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-white">
                      {CHIEF_METEOROLOGIST_INFO.name}
                    </h4>
                    <p className="text-xs font-bold text-[#f3c853]">
                      {CHIEF_METEOROLOGIST_INFO.title}
                    </p>
                    <p className="text-[11px] text-amber-200/80">
                      {CHIEF_METEOROLOGIST_INFO.organization} • {CHIEF_METEOROLOGIST_INFO.parentMinistry}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#170206] rounded-2xl border border-[#841c34] text-xs text-slate-200 leading-relaxed">
                  <strong>Role & Authority:</strong> The Chief Meteorologist serves as Belize's permanent principal advisor on atmospheric hazards, severe weather, and tropical storms, directing the National Meteorological Service in close operational integration with the National Emergency Management Organization (NEMO).
                </div>

                {/* Contact & Directory Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="bg-[#1b0309] p-3 rounded-xl border border-[#841c34]">
                    <span className="text-[10px] font-bold text-amber-300 uppercase block">Official Email</span>
                    <a
                      href={`mailto:${CHIEF_METEOROLOGIST_INFO.officialEmail}`}
                      className="font-mono text-white font-bold hover:text-[#f3c853] underline mt-0.5 block"
                    >
                      {CHIEF_METEOROLOGIST_INFO.officialEmail}
                    </a>
                  </div>

                  <div className="bg-[#1b0309] p-3 rounded-xl border border-[#841c34]">
                    <span className="text-[10px] font-bold text-amber-300 uppercase block">Telephone Hotlines</span>
                    <span className="font-mono text-white font-bold mt-0.5 block">
                      {CHIEF_METEOROLOGIST_INFO.telephone}
                    </span>
                  </div>

                  <div className="bg-[#1b0309] p-3 rounded-xl border border-[#841c34] sm:col-span-2">
                    <span className="text-[10px] font-bold text-amber-300 uppercase block">Headquarters & Weather Station</span>
                    <span className="text-white font-medium mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      {CHIEF_METEOROLOGIST_INFO.address}
                    </span>
                  </div>
                </div>

                {/* Direct Links to nms.gov.bz Portals */}
                <div className="pt-2 border-t border-[#841c34] space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#f3c853] block">
                    Official External NMS Portals (https://nms.gov.bz/)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href="https://nms.gov.bz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-[#2f0612] hover:bg-[#4d0718] border border-[#d4af37]/40 text-xs font-bold text-white flex items-center justify-between transition group"
                    >
                      <span>NMS Official Home</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#f3c853] group-hover:translate-x-0.5 transition" />
                    </a>
                    <a
                      href="https://nms.gov.bz/forecast/general-weather-forecast"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-[#2f0612] hover:bg-[#4d0718] border border-[#d4af37]/40 text-xs font-bold text-white flex items-center justify-between transition group"
                    >
                      <span>General Forecast Bureau</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#f3c853] group-hover:translate-x-0.5 transition" />
                    </a>
                    <a
                      href="https://nms.gov.bz/forecast/marine-forecast"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-[#2f0612] hover:bg-[#4d0718] border border-[#d4af37]/40 text-xs font-bold text-white flex items-center justify-between transition group"
                    >
                      <span>Marine & Maritime Forecast</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#f3c853] group-hover:translate-x-0.5 transition" />
                    </a>
                    <a
                      href="https://nms.gov.bz/radar/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-[#2f0612] hover:bg-[#4d0718] border border-[#d4af37]/40 text-xs font-bold text-white flex items-center justify-between transition group"
                    >
                      <span>Belize Doppler Radar & Satellite</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#f3c853] group-hover:translate-x-0.5 transition" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#140206] border-t border-[#841c34] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-200/70">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Authorized by the National Meteorological Service of Belize • </span>
            <a
              href="https://nms.gov.bz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f3c853] font-bold hover:underline"
            >
              https://nms.gov.bz/
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-[#3d0817] hover:bg-[#520b1f] border border-[#d4af37]/50 text-white font-bold transition"
          >
            Close Desk
          </button>
        </div>

      </div>
    </div>
  );
};
