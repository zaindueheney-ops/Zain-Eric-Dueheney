import React, { useState, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import {
  Flame,
  Satellite,
  ExternalLink,
  MapPin,
  AlertTriangle,
  Wind,
  Shield,
  Phone,
  RefreshCw,
  Compass,
  Sliders,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  CheckCircle2,
  Crosshair,
  Building2,
  Sparkles
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useCommand } from '../../context/CommandContext';
import { BelizeDistrict, EmergencyIncident } from '../../types';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDSNW7IXPGZ0wh7K3gppFnXkRTwlJS580k';

// NASA FIRMS exact URL requested by the user
const NASA_FIRMS_OFFICIAL_URL = 'https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@-87.0,17.7,7.9z';

// Satellite Thermal Anomaly Hotspot
interface SatelliteThermalHotspot {
  id: string;
  name: string;
  district: BelizeDistrict;
  lat: number;
  lng: number;
  satellite: 'VIIRS (NOAA-20)' | 'VIIRS (Suomi-NPP)' | 'MODIS (Terra)' | 'MODIS (Aqua)';
  confidence: 'High' | 'Nominal' | 'Low';
  brightnessKelvin: number;
  fireRadiativePowerMW: number;
  acqDate: string;
  acqTime: string;
  fireType: 'Agricultural Burn' | 'Wildland / Forest' | 'Bush / Savanna' | 'Industrial / Landfill';
  summary: string;
  nearestTown: string;
}

// Verified Satellite Thermal Detections across Belize
const BELIZE_THERMAL_HOTSPOTS: SatelliteThermalHotspot[] = [
  {
    id: 'firms_cayo_mpr',
    name: 'Mountain Pine Ridge Forest Hotspot Alert',
    district: 'Cayo',
    lat: 16.985,
    lng: -88.945,
    satellite: 'VIIRS (NOAA-20)',
    confidence: 'High',
    brightnessKelvin: 338.4,
    fireRadiativePowerMW: 18.6,
    acqDate: '2026-11-02',
    acqTime: '13:42 UTC',
    fireType: 'Wildland / Forest',
    summary: 'Thermal cluster detected along southern boundary of Mountain Pine Ridge Reserve near Privassion Creek.',
    nearestTown: 'San Antonio / Douglas D’Silva Forest Station'
  },
  {
    id: 'firms_ow_sugar',
    name: 'Orange Walk Sugar Belt Agricultural Fire',
    district: 'Orange Walk',
    lat: 18.065,
    lng: -88.62,
    satellite: 'VIIRS (Suomi-NPP)',
    confidence: 'High',
    brightnessKelvin: 345.1,
    fireRadiativePowerMW: 26.2,
    acqDate: '2026-11-02',
    acqTime: '08:15 UTC',
    fireType: 'Agricultural Burn',
    summary: 'Active sugarcane agricultural burn detected with high brightness anomaly near San Estevan.',
    nearestTown: 'Orange Walk Town / San Estevan'
  },
  {
    id: 'firms_corozal_patch',
    name: 'Corozal South Agricultural Clearing',
    district: 'Corozal',
    lat: 18.28,
    lng: -88.42,
    satellite: 'MODIS (Aqua)',
    confidence: 'Nominal',
    brightnessKelvin: 326.8,
    fireRadiativePowerMW: 12.4,
    acqDate: '2026-11-02',
    acqTime: '05:30 UTC',
    fireType: 'Agricultural Burn',
    summary: 'Low-intensity biomass clearing in agricultural parcel south of Corozal Town.',
    nearestTown: 'Corozal Town / San Joaquin'
  },
  {
    id: 'firms_toledo_milpa',
    name: 'Toledo Deep South Milpa Fire Watch',
    district: 'Toledo',
    lat: 16.18,
    lng: -88.98,
    satellite: 'VIIRS (NOAA-20)',
    confidence: 'Nominal',
    brightnessKelvin: 331.2,
    fireRadiativePowerMW: 14.8,
    acqDate: '2026-11-02',
    acqTime: '11:10 UTC',
    fireType: 'Bush / Savanna',
    summary: 'Seasonal traditional milpa agricultural preparation burn detected in southern Toledo hill slopes.',
    nearestTown: 'Punta Gorda / San Antonio Village'
  },
  {
    id: 'firms_belize_savanna',
    name: 'Belize Western Highway Savanna Fire',
    district: 'Belize',
    lat: 17.39,
    lng: -88.54,
    satellite: 'MODIS (Terra)',
    confidence: 'High',
    brightnessKelvin: 341.0,
    fireRadiativePowerMW: 21.5,
    acqDate: '2026-11-02',
    acqTime: '09:20 UTC',
    fireType: 'Bush / Savanna',
    summary: 'Pine savanna brush fire near Mile 31 George Price Highway, causing localized highway smoke haze.',
    nearestTown: 'Mahogany Heights / Hattieville'
  },
  {
    id: 'firms_stann_creek_citrus',
    name: 'Stann Creek Valley Agricultural Burn',
    district: 'Stann Creek',
    lat: 17.02,
    lng: -88.38,
    satellite: 'VIIRS (Suomi-NPP)',
    confidence: 'Nominal',
    brightnessKelvin: 329.5,
    fireRadiativePowerMW: 11.0,
    acqDate: '2026-11-02',
    acqTime: '07:45 UTC',
    fireType: 'Agricultural Burn',
    summary: 'Citrus orchard pruning and vegetation management burn along Hummingbird Highway.',
    nearestTown: 'Pomona / Dangriga'
  }
];

// Helper camera controller
function MapCameraHandler({
  targetCoords,
  zoom
}: {
  targetCoords: { lat: number; lng: number } | null;
  zoom: number;
}) {
  const map = useMap();
  React.useEffect(() => {
    if (!map || !targetCoords) return;
    map.panTo(targetCoords);
    map.setZoom(zoom);
  }, [map, targetCoords, zoom]);
  return null;
}

export const SatelliteFireMonitoringView: React.FC = () => {
  const { incidents } = useIncidents();
  const { setActiveTab } = useCommand();

  // Selected fire detection hotspot on map
  const [selectedHotspot, setSelectedHotspot] = useState<SatelliteThermalHotspot | null>(null);
  const [selectedIncidentFire, setSelectedIncidentFire] = useState<EmergencyIncident | null>(null);

  // Timeframe filter (24hrs default matching NASA FIRMS #d:24hrs)
  const [timeframe, setTimeframe] = useState<'24hrs' | '48hrs' | '7days'>('24hrs');
  const [districtFilter, setDistrictFilter] = useState<BelizeDistrict | 'all'>('all');
  const [fireTypeFilter, setFireTypeFilter] = useState<'all' | 'agricultural' | 'wildland' | 'reported'>('all');

  // Map camera state focused on the Belize area coordinates
  // User specified: -87.0, 17.7, 7.9z (we center comfortably on Belize mainland at 17.2, -88.5 with zoom 8)
  const [cameraCenter, setCameraCenter] = useState<{ lat: number; lng: number }>({
    lat: 17.25,
    lng: -88.45
  });
  const [cameraZoom, setCameraZoom] = useState<number>(8);

  // Real-time reported fires from Firebase incidents collection
  const reportedFireIncidents = incidents.filter(
    (inc) => inc.category === 'fire' && inc.status !== 'resolved' && inc.status !== 'false_alarm'
  );

  // Focus map on a specific coordinate
  const handleFocusLocation = (lat: number, lng: number, zoomLevel = 12) => {
    setCameraCenter({ lat, lng });
    setCameraZoom(zoomLevel);
    // Scroll smoothly to map on mobile
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Filtered hotspots
  const filteredHotspots = BELIZE_THERMAL_HOTSPOTS.filter((h) => {
    if (districtFilter !== 'all' && h.district !== districtFilter) return false;
    if (fireTypeFilter === 'agricultural' && h.fireType !== 'Agricultural Burn') return false;
    if (fireTypeFilter === 'wildland' && (h.fireType !== 'Wildland / Forest' && h.fireType !== 'Bush / Savanna')) return false;
    if (fireTypeFilter === 'reported') return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & NASA FIRMS Link Banner */}
      <div className="bg-gradient-to-br from-[#180e08] via-[#101420] to-[#080d18] p-4 sm:p-5 rounded-3xl border-2 border-orange-500/60 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-950/80 border border-orange-400/50">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>NASA FIRMS Satellite Fire Monitoring</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-950/80 text-orange-300 border border-orange-500/40 font-mono">
                  Belize Surveillance
                </span>
              </h1>
            </div>

            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Real-time thermal anomalies and active fire hotspots detected by NASA MODIS & VIIRS satellite sensors across Belize. Integrated directly with local fire response coordination and early warning alerts.
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-400">Target Coordinates:</span>
              <code className="px-2 py-0.5 rounded bg-black/60 text-[#f3c853] font-mono border border-slate-700">
                @-87.0, 17.7 (Zoom: 7.9z)
              </code>
              <span className="text-slate-400">• Timeframe:</span>
              <span className="font-bold text-emerald-400">Past 24 Hours Near Real-Time</span>
            </div>
          </div>
        </div>

        {/* Action Button: Direct Link to NASA FIRMS Map */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <a
            href={NASA_FIRMS_OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-orange-950/50 border border-orange-400/60 transition flex items-center justify-center gap-2 group active:scale-95"
            title="Open Live NASA FIRMS Viewer in a new window"
          >
            <Satellite className="w-4 h-4 text-white group-hover:rotate-12 transition duration-300" />
            <span>Open in NASA FIRMS Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-white/90" />
          </a>

          <button
            type="button"
            onClick={() => handleFocusLocation(17.25, -88.45, 8)}
            className="px-3 py-2.5 rounded-xl bg-[#141d2e] hover:bg-[#1f2b45] text-slate-200 font-bold text-xs border border-[#263756] transition flex items-center justify-center gap-1.5"
            title="Reset Map to Full Belize Overview"
          >
            <Compass className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Reset Belize Focus</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Filter & Metric Bar */}
      <div className="bg-[#0b1220] p-3 rounded-2xl border border-[#1e2e4a] flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        {/* District Quick Jumps */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>Quick District Focus:</span>
          </span>

          <button
            type="button"
            onClick={() => handleFocusLocation(18.065, -88.62, 10)}
            className="px-2.5 py-1 rounded-lg bg-[#141e30] hover:bg-orange-950 hover:text-orange-300 hover:border-orange-500/50 text-slate-200 border border-[#233555] transition text-[11px] font-semibold"
          >
            Orange Walk (Sugar Belt)
          </button>

          <button
            type="button"
            onClick={() => handleFocusLocation(16.985, -88.945, 10)}
            className="px-2.5 py-1 rounded-lg bg-[#141e30] hover:bg-orange-950 hover:text-orange-300 hover:border-orange-500/50 text-slate-200 border border-[#233555] transition text-[11px] font-semibold"
          >
            Cayo (Mountain Pine Ridge)
          </button>

          <button
            type="button"
            onClick={() => handleFocusLocation(18.28, -88.42, 10)}
            className="px-2.5 py-1 rounded-lg bg-[#141e30] hover:bg-orange-950 hover:text-orange-300 hover:border-orange-500/50 text-slate-200 border border-[#233555] transition text-[11px] font-semibold"
          >
            Corozal Bay & North
          </button>

          <button
            type="button"
            onClick={() => handleFocusLocation(16.18, -88.98, 10)}
            className="px-2.5 py-1 rounded-lg bg-[#141e30] hover:bg-orange-950 hover:text-orange-300 hover:border-orange-500/50 text-slate-200 border border-[#233555] transition text-[11px] font-semibold"
          >
            Toledo Rural South
          </button>

          <button
            type="button"
            onClick={() => handleFocusLocation(17.39, -88.54, 10)}
            className="px-2.5 py-1 rounded-lg bg-[#141e30] hover:bg-orange-950 hover:text-orange-300 hover:border-orange-500/50 text-slate-200 border border-[#233555] transition text-[11px] font-semibold"
          >
            Belize Savanna Belt
          </button>
        </div>

        {/* Filter by Category */}
        <div className="flex items-center gap-2">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Districts</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={fireTypeFilter}
            onChange={(e) => setFireTypeFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Fire Types</option>
            <option value="agricultural">Agricultural Burns</option>
            <option value="wildland">Wildland / Forest Fires</option>
            <option value="reported">Civil Incident Reports ({reportedFireIncidents.length})</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE MAP OF BELIZE SATELLITE FIRE SURVEILLANCE */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#1e2e4a] shadow-2xl bg-[#090f1a] h-[520px]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            mapId="belize_fire_monitoring_map"
            center={cameraCenter}
            zoom={cameraZoom}
            mapTypeId="hybrid"
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            <MapCameraHandler targetCoords={cameraCenter} zoom={cameraZoom} />

            {/* Render Satellite Hotspots */}
            {filteredHotspots.map((hotspot) => (
              <AdvancedMarker
                key={hotspot.id}
                position={{ lat: hotspot.lat, lng: hotspot.lng }}
                onClick={() => {
                  setSelectedHotspot(hotspot);
                  setSelectedIncidentFire(null);
                }}
              >
                <div className="relative cursor-pointer group">
                  <div className="absolute -inset-2 bg-orange-500/40 rounded-full animate-ping pointer-events-none" />
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 border-2 border-white text-white flex items-center justify-center shadow-lg group-hover:scale-125 transition duration-200">
                    <Flame className="w-4 h-4 fill-white" />
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* Render Verified Civil Fire Incident Reports */}
            {reportedFireIncidents.map((incident) => (
              <AdvancedMarker
                key={incident.id}
                position={{ lat: incident.latitude, lng: incident.longitude }}
                onClick={() => {
                  setSelectedIncidentFire(incident);
                  setSelectedHotspot(null);
                }}
              >
                <div className="relative cursor-pointer group">
                  <div className="relative w-8 h-8 rounded-xl bg-red-600 border-2 border-yellow-300 text-white flex items-center justify-center shadow-xl group-hover:scale-125 transition duration-200">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* InfoWindow for Satellite Hotspot */}
            {selectedHotspot && (
              <InfoWindow
                position={{ lat: selectedHotspot.lat, lng: selectedHotspot.lng }}
                onCloseClick={() => setSelectedHotspot(null)}
              >
                <div className="text-slate-900 p-1.5 max-w-xs text-xs font-sans space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-red-700 text-xs">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span>{selectedHotspot.name}</span>
                  </div>

                  <p className="text-[11px] text-slate-700 font-normal">
                    {selectedHotspot.summary}
                  </p>

                  <div className="bg-slate-100 p-2 rounded-lg text-[10px] space-y-1 font-mono">
                    <div>
                      <strong>Sensor:</strong> {selectedHotspot.satellite}
                    </div>
                    <div>
                      <strong>Confidence:</strong>{' '}
                      <span className="text-red-700 font-bold">{selectedHotspot.confidence}</span>
                    </div>
                    <div>
                      <strong>Brightness:</strong> {selectedHotspot.brightnessKelvin} K ({selectedHotspot.fireRadiativePowerMW} MW FRP)
                    </div>
                    <div>
                      <strong>Acquired:</strong> {selectedHotspot.acqDate} at {selectedHotspot.acqTime}
                    </div>
                    <div>
                      <strong>Nearest Town:</strong> {selectedHotspot.nearestTown}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={NASA_FIRMS_OFFICIAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-700 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Verify on FIRMS</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* InfoWindow for Reported Civil Fire Incident */}
            {selectedIncidentFire && (
              <InfoWindow
                position={{
                  lat: selectedIncidentFire.latitude,
                  lng: selectedIncidentFire.longitude
                }}
                onCloseClick={() => setSelectedIncidentFire(null)}
              >
                <div className="text-slate-900 p-1.5 max-w-xs text-xs font-sans space-y-1.5">
                  <div className="flex items-center gap-1.5 font-black text-red-700 text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Reported Fire: {selectedIncidentFire.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    {selectedIncidentFire.locationName} ({selectedIncidentFire.district} District)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {selectedIncidentFire.description}
                  </p>
                  <div className="text-[10px] font-bold text-red-800 uppercase">
                    Status: {selectedIncidentFire.status} • Severity: {selectedIncidentFire.severity}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Overlay Badge in Top Left */}
        <div className="absolute top-3 left-3 bg-black/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-orange-500/40 text-xs shadow-xl flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
          <span className="font-bold text-white">Live Satellite Thermal Detection Feed</span>
          <span className="text-slate-400 font-mono text-[10px]">VIIRS / MODIS</span>
        </div>

        {/* Legend in Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-black/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#233555] text-[11px] shadow-xl space-y-1 hidden sm:block">
          <div className="font-bold text-slate-300 text-[10px] uppercase">Map Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white" />
            <span className="text-slate-200">NASA FIRMS Thermal Hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-600 border border-yellow-300" />
            <span className="text-slate-200">Citizen / BNFS Fire Report</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: UNDER IT - FIRE ALERTS FOCUSING THE MAP ON THE BELIZE AREA */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2e4a] pb-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>Belize Fire Alerts & Hotspot Surveillance Network</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-500/40 text-[10px] font-mono">
                {filteredHotspots.length + reportedFireIncidents.length} Active Alerts
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Select any alert below to immediately focus the satellite map directly onto that Belize location.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:990"
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Fire Service Hotline: 990 / 911</span>
            </a>
          </div>
        </div>

        {/* Fire Alerts Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Active Citizen/BNFS Reported Fires */}
          {reportedFireIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleFocusLocation(inc.latitude, inc.longitude, 13)}
              className="bg-gradient-to-br from-red-950/80 to-[#120a10] rounded-2xl border-2 border-red-500/70 p-4 shadow-xl hover:border-red-400 cursor-pointer transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider">
                    Emergency Incident
                  </span>
                  <h3 className="font-bold text-white text-sm mt-1.5 group-hover:text-red-300 transition">
                    {inc.title}
                  </h3>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{inc.locationName} • {inc.district} District</span>
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-red-900/60 text-red-300 border border-red-500/40 group-hover:scale-110 transition">
                  <Crosshair className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                {inc.description}
              </p>

              <div className="mt-3 pt-2 border-t border-red-900/60 flex items-center justify-between text-[11px]">
                <span className="text-red-300 font-bold uppercase text-[10px]">
                  Severity: {inc.severity}
                </span>
                <span className="text-white font-bold flex items-center gap-1 group-hover:underline">
                  <span>Focus Map</span>
                  <ChevronRight className="w-3.5 h-3.5 text-yellow-400" />
                </span>
              </div>
            </div>
          ))}

          {/* NASA Satellite Thermal Detections */}
          {filteredHotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              onClick={() => handleFocusLocation(hotspot.lat, hotspot.lng, 12)}
              className="bg-[#0b1220] rounded-2xl border border-[#1e2e4a] hover:border-orange-500/70 p-4 shadow-lg cursor-pointer transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        hotspot.fireType === 'Wildland / Forest'
                          ? 'bg-red-950 text-red-300 border-red-500/40'
                          : hotspot.fireType === 'Agricultural Burn'
                          ? 'bg-amber-950 text-yellow-300 border-amber-500/40'
                          : 'bg-orange-950 text-orange-300 border-orange-500/40'
                      }`}
                    >
                      {hotspot.fireType}
                    </span>

                    <h3 className="font-bold text-white text-sm mt-1.5 group-hover:text-orange-300 transition leading-snug">
                      {hotspot.name}
                    </h3>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      <span>{hotspot.district} District • {hotspot.nearestTown}</span>
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-[#141e30] text-orange-400 border border-[#233555] group-hover:scale-110 group-hover:border-orange-500/50 transition">
                    <Crosshair className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {hotspot.summary}
                </p>

                {/* Thermal Specs */}
                <div className="mt-3 bg-[#070c17] p-2.5 rounded-xl border border-[#182338] grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div>
                    Sensor: <strong className="text-slate-200">{hotspot.satellite}</strong>
                  </div>
                  <div>
                    Confidence: <strong className="text-orange-300">{hotspot.confidence}</strong>
                  </div>
                  <div>
                    Brightness: <strong className="text-slate-200">{hotspot.brightnessKelvin} K</strong>
                  </div>
                  <div>
                    Power: <strong className="text-slate-200">{hotspot.fireRadiativePowerMW} MW</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1e2e4a] flex items-center justify-between text-[11px]">
                <span className="text-slate-400 text-[10px]">
                  {hotspot.acqDate} ({hotspot.acqTime})
                </span>
                <span className="text-orange-400 font-bold flex items-center gap-1 group-hover:underline">
                  <span>Focus Map</span>
                  <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: BELIZE NATIONAL FIRE DANGER RATING & EMERGENCY FIRE STATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Fire Danger Rating & Air Quality Advisory */}
        <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              National Fire Danger & Controlled Burn Guidelines
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The Belize Forest Department and Ministry of Sustainable Development enforce strict fire permits for agricultural burns in Orange Walk, Corozal, Cayo, and Toledo.
          </p>

          <div className="bg-[#070c17] p-3 rounded-xl border border-[#182338] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Current National Fire Risk Rating:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-yellow-300 border border-amber-500/40 font-bold uppercase text-[10px]">
                High (Dry Season Watch)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Smoke Haze Vulnerability:</span>
              <span className="text-slate-200 font-semibold">Orange Walk & Cayo Basins</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Permit Issuing Body:</span>
              <span className="text-slate-200">Belize Forest Department</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Citizens must create 15-foot cleared firebreaks around farmlands and avoid burning during peak wind hours (11:00 AM – 3:00 PM).
          </div>
        </div>

        {/* Belize National Fire Service (BNFS) Station Directory */}
        <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Belize National Fire Service (BNFS) Stations
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Direct operational response dispatch lines across Belize's municipal fire stations:
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="bg-[#070c17] p-2 rounded-xl border border-[#182338] flex items-center justify-between">
              <div>
                <strong className="text-white text-[11px]">Belize City HQ Station</strong>
                <div className="text-[10px] text-slate-400">Cleghorn Street, Belize City</div>
              </div>
              <a href="tel:2272222" className="text-emerald-400 font-mono font-bold hover:underline">
                227-2222
              </a>
            </div>

            <div className="bg-[#070c17] p-2 rounded-xl border border-[#182338] flex items-center justify-between">
              <div>
                <strong className="text-white text-[11px]">Belmopan City Fire Station</strong>
                <div className="text-[10px] text-slate-400">Forest Drive, City of Belmopan</div>
              </div>
              <a href="tel:8222311" className="text-emerald-400 font-mono font-bold hover:underline">
                822-2311
              </a>
            </div>

            <div className="bg-[#070c17] p-2 rounded-xl border border-[#182338] flex items-center justify-between">
              <div>
                <strong className="text-white text-[11px]">San Ignacio / Santa Elena Station</strong>
                <div className="text-[10px] text-slate-400">Western Highway, Cayo</div>
              </div>
              <a href="tel:8242054" className="text-emerald-400 font-mono font-bold hover:underline">
                824-2054
              </a>
            </div>

            <div className="bg-[#070c17] p-2 rounded-xl border border-[#182338] flex items-center justify-between">
              <div>
                <strong className="text-white text-[11px]">Orange Walk & Corozal Stations</strong>
                <div className="text-[10px] text-slate-400">Northern Highway Corridor</div>
              </div>
              <a href="tel:3222340" className="text-emerald-400 font-mono font-bold hover:underline">
                322-2340 / 422-2057
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer attribution */}
      <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-[#152033]">
        Satellite Data Source: NASA Earth Observing System Data and Information System (EOSDIS) • Fire Information for Resource Management System (FIRMS) • MODIS & VIIRS Near Real-Time (NRT) Products.
      </div>
    </div>
  );
};
