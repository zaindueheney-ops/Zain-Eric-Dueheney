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
  Sparkles,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useCommand } from '../../context/CommandContext';
import { BelizeDistrict, EmergencyIncident } from '../../types';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { FireLayers } from '../FireLayers';
import { FirmsHotspot, BELIZE_FIRMS_BBOX } from '../../services/firmsService';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDSNW7IXPGZ0wh7K3gppFnXkRTwlJS580k';

// NASA FIRMS exact URL requested by the user
const NASA_FIRMS_OFFICIAL_URL = 'https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@-87.0,17.7,7.9z';

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

  // Dynamic FIRMS active hotspots loaded by FireLayers
  const [liveHotspots, setLiveHotspots] = useState<FirmsHotspot[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [selectedIncidentFire, setSelectedIncidentFire] = useState<EmergencyIncident | null>(null);

  // Dynamic Layer Controls
  const [layerVisible, setLayerVisible] = useState<boolean>(true);
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high_nominal' | 'high'>('all');
  const [sensorFilter, setSensorFilter] = useState<'all' | 'VIIRS' | 'MODIS'>('all');
  const [districtFilter, setDistrictFilter] = useState<BelizeDistrict | 'all'>('all');
  const [fireTypeFilter, setFireTypeFilter] = useState<'all' | 'agricultural' | 'wildland' | 'reported'>('all');

  const [dataSource, setDataSource] = useState<'live_nrt' | 'cached_nrt'>('live_nrt');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Map camera state focused on the Belize area coordinates
  // Default coordinates: @-87.0, 17.7, 7.9z (centered on mainland at 17.25, -88.45)
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
  const handleFocusLocation = (lat: number, lng: number, zoomLevel = 12, hotspotId?: string) => {
    setCameraCenter({ lat, lng });
    setCameraZoom(zoomLevel);
    if (hotspotId) {
      setSelectedHotspotId(hotspotId);
      setSelectedIncidentFire(null);
    }
    // Scroll smoothly to map on mobile
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 900);
  };

  // Filtered hotspots for list below map
  const displayedListHotspots = liveHotspots.filter((h) => {
    if (districtFilter !== 'all' && h.district !== districtFilter) return false;
    if (sensorFilter !== 'all' && h.sensor !== sensorFilter) return false;
    if (confidenceFilter === 'high' && h.confidence !== 'high') return false;
    if (confidenceFilter === 'high_nominal' && h.confidence === 'low') return false;
    if (fireTypeFilter === 'agricultural' && h.estimatedType !== 'Agricultural Burn') return false;
    if (fireTypeFilter === 'wildland' && (h.estimatedType !== 'Wildland / Forest' && h.estimatedType !== 'Bush / Savanna')) return false;
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
              Real-time thermal anomalies and active wildfire hotspots detected by NASA MODIS & VIIRS satellite sensors across Belize. Dynamic layer fetched via the NASA FIRMS API for the Belize Bounding Box.
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-400">Belize Bounding Box:</span>
              <code className="px-2 py-0.5 rounded bg-black/60 text-[#f3c853] font-mono border border-slate-700">
                [{BELIZE_FIRMS_BBOX.west}°W, {BELIZE_FIRMS_BBOX.south}°N] to [{BELIZE_FIRMS_BBOX.east}°W, {BELIZE_FIRMS_BBOX.north}°N]
              </code>
              <span className="text-slate-400">• Center Target:</span>
              <code className="px-1.5 py-0.5 rounded bg-black/60 text-orange-300 font-mono border border-slate-700">
                @-87.0, 17.7 (7.9z)
              </code>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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

      {/* Dynamic Layer Status Bar & Filter Controls */}
      <div className="bg-[#0b1220] p-3 rounded-2xl border border-[#1e2e4a] flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        {/* Layer Toggle & Telemetry Count */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setLayerVisible(!layerVisible)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow ${
              layerVisible
                ? 'bg-orange-600 text-white border-orange-400'
                : 'bg-[#141e30] text-slate-400 border-[#233555] hover:text-white'
            }`}
            title="Toggle NASA FIRMS Thermal Layer visibility"
          >
            {layerVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>FIRMS Layer: {layerVisible ? 'Active' : 'Hidden'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-xl bg-[#141e30] hover:bg-[#1f2b45] text-slate-200 border border-[#233555] transition flex items-center gap-1.5 font-bold"
            title="Re-query latest NASA FIRMS satellite pass"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080e1a] border border-[#1e293b] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Detected:</span>
            <strong className="text-white font-mono">{liveHotspots.length} Hotspots</strong>
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                • Updated {lastUpdated}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Layer Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sensor Selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Sensor:</span>
            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value as any)}
              className="bg-[#121c2e] border border-[#233555] rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Sensors (VIIRS + MODIS)</option>
              <option value="VIIRS">VIIRS Only (375m High-Res)</option>
              <option value="MODIS">MODIS Only (1km)</option>
            </select>
          </div>

          {/* Confidence Selector */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Confidence:</span>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value as any)}
              className="bg-[#121c2e] border border-[#233555] rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Confidences</option>
              <option value="high_nominal">High & Nominal</option>
              <option value="high">High Confidence Only</option>
            </select>
          </div>

          {/* District Selector */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Belize Districts</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE MAP WITH DYNAMIC FIRE LAYERS */}
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

            {/* DYNAMIC NASA FIRMS WILDFIRE LAYER */}
            <FireLayers
              visible={layerVisible}
              selectedHotspotId={selectedHotspotId}
              onSelectHotspot={(hotspot) => {
                setSelectedHotspotId(hotspot?.id || null);
                setSelectedIncidentFire(null);
              }}
              onHotspotsLoaded={(loaded, source, updatedTime) => {
                setLiveHotspots(loaded);
                setDataSource(source);
                setLastUpdated(updatedTime);
              }}
              confidenceFilter={confidenceFilter}
              sensorFilter={sensorFilter}
              districtFilter={districtFilter}
              fireTypeFilter={fireTypeFilter}
              refreshTrigger={refreshTrigger}
            />

            {/* Render Verified Civil Fire Incident Reports */}
            {reportedFireIncidents.map((incident) => (
              <AdvancedMarker
                key={incident.id}
                position={{ lat: incident.latitude, lng: incident.longitude }}
                onClick={() => {
                  setSelectedIncidentFire(incident);
                  setSelectedHotspotId(null);
                }}
              >
                <div className="relative cursor-pointer group">
                  <div className="relative w-8 h-8 rounded-xl bg-red-600 border-2 border-yellow-300 text-white flex items-center justify-center shadow-xl group-hover:scale-125 transition duration-200">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            ))}

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
          <span className="font-bold text-white">NASA FIRMS Dynamic Layer</span>
          <span className="text-slate-400 font-mono text-[10px]">
            {liveHotspots.length} Hotspots • {dataSource === 'live_nrt' ? 'Live NRT' : 'Near Real-Time'}
          </span>
        </div>

        {/* Legend in Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-black/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#233555] text-[11px] shadow-xl space-y-1 hidden sm:block">
          <div className="font-bold text-slate-300 text-[10px] uppercase">Fire Layers Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 border border-white" />
            <span className="text-slate-200">High FRP (&gt;15 MW) / Intense Heat Core</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white/80" />
            <span className="text-slate-200">Moderate FIRMS Thermal Hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-600 border border-yellow-300" />
            <span className="text-slate-200">Citizen / BNFS Reported Fire</span>
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
                {displayedListHotspots.length + reportedFireIncidents.length} Active Alerts
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

          {/* NASA Satellite Thermal Detections from Dynamic FireLayers */}
          {displayedListHotspots.map((hotspot) => {
            const isSelected = selectedHotspotId === hotspot.id;

            return (
              <div
                key={hotspot.id}
                onClick={() => handleFocusLocation(hotspot.latitude, hotspot.longitude, 12, hotspot.id)}
                className={`bg-[#0b1220] rounded-2xl border ${
                  isSelected ? 'border-orange-400 shadow-orange-950/50 ring-2 ring-orange-500/50' : 'border-[#1e2e4a] hover:border-orange-500/70'
                } p-4 shadow-lg cursor-pointer transition group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          hotspot.estimatedType === 'Wildland / Forest'
                            ? 'bg-red-950 text-red-300 border-red-500/40'
                            : hotspot.estimatedType === 'Agricultural Burn'
                            ? 'bg-amber-950 text-yellow-300 border-amber-500/40'
                            : 'bg-orange-950 text-orange-300 border-orange-500/40'
                        }`}
                      >
                        {hotspot.estimatedType}
                      </span>

                      <h3 className="font-bold text-white text-sm mt-1.5 group-hover:text-orange-300 transition leading-snug">
                        {hotspot.nearestLocation}
                      </h3>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                        <span>{hotspot.district} District • {hotspot.daynight} Detection</span>
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-[#141e30] text-orange-400 border border-[#233555] group-hover:scale-110 group-hover:border-orange-500/50 transition shrink-0">
                      <Crosshair className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Thermal Specs */}
                  <div className="mt-3 bg-[#070c17] p-2.5 rounded-xl border border-[#182338] grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                    <div>
                      Sensor: <strong className="text-slate-200">{hotspot.sensorLabel}</strong>
                    </div>
                    <div>
                      Confidence: <strong className="text-orange-300 uppercase">{hotspot.confidence}</strong>
                    </div>
                    <div>
                      Brightness: <strong className="text-slate-200">{hotspot.brightness.toFixed(1)} K</strong>
                    </div>
                    <div>
                      FRP Power: <strong className="text-red-400">{hotspot.frp.toFixed(2)} MW</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1e2e4a] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px]">
                    Acquired {hotspot.acqDate} ({hotspot.acqTime} UTC)
                  </span>
                  <span className="text-orange-400 font-bold flex items-center gap-1 group-hover:underline">
                    <span>Focus Map</span>
                    <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                  </span>
                </div>
              </div>
            );
          })}
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
        Satellite Data Source: NASA Earth Observing System Data and Information System (EOSDIS) • Fire Information for Resource Management System (FIRMS) API • VIIRS & MODIS Near Real-Time Active Fire Data for Belize Bounding Box [-89.3, 15.8, -87.4, 18.6].
      </div>
    </div>
  );
};
