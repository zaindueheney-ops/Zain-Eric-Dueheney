import React, { useState } from 'react';
import {
  MapPin,
  Filter,
  Layers,
  Flame,
  AlertTriangle,
  Radio,
  Home,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react';
import { BelizeGoogleIncidentMap } from '../BelizeGoogleIncidentMap';
import { IncidentCard } from '../IncidentCard';
import { IncidentFilterBar } from '../IncidentFilterBar';
import { useIncidents } from '../../context/IncidentContext';
import { useCommand } from '../../context/CommandContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { EmergencyIncident, BelizeDistrict } from '../../types';

interface NationalIncidentMapViewProps {
  onSetPinnedLocation?: (coords: { lat: number; lng: number }, district: BelizeDistrict, isCurrentLocation: boolean) => void;
}

export const NationalIncidentMapView: React.FC<NationalIncidentMapViewProps> = ({
  onSetPinnedLocation,
}) => {
  const {
    filteredIncidents,
    selectedIncident,
    setSelectedIncident,
    filters,
    setFilters,
  } = useIncidents();

  const { evacuationCentres, responseTeams, setActiveTab } = useCommand();

  const [showSheltersLayer, setShowSheltersLayer] = useState(false);
  const [showTeamsLayer, setShowTeamsLayer] = useState(false);

  return (
    <div className="space-y-3">
      {/* Top Map Control Bar */}
      <div className="bg-[#0b1220] p-3 rounded-2xl border border-[#1e2e4a] flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#17253d] text-[#d4af37] border border-[#d4af37]/40 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white leading-tight">
              National Incident Monitoring Map
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive Belize GIS operations with automated marker clustering
            </p>
          </div>
        </div>

        {/* Quick Toggles: Shelters & Response Teams */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setShowSheltersLayer(!showSheltersLayer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              showSheltersLayer
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/80 shadow'
                : 'bg-[#121c2e] text-slate-300 border-[#233555] hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shelters ({evacuationCentres.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTeamsLayer(!showTeamsLayer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
              showTeamsLayer
                ? 'bg-blue-950 text-blue-300 border-blue-500/80 shadow'
                : 'bg-[#121c2e] text-slate-300 border-[#233555] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Response Teams ({responseTeams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('satellite_fire_monitoring')}
            className="px-3 py-1.5 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-950/80 to-[#1e1008] text-orange-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            title="Open NASA FIRMS Satellite Fire Surveillance & Belize Fire Alerts"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>NASA FIRMS Fires</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <IncidentFilterBar />

      {/* Main Grid: Map (8 cols) + Incident Stream (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Map Container */}
        <div className="lg:col-span-8 space-y-2">
          <div className="rounded-2xl overflow-hidden border-2 border-[#1e2e4a] shadow-2xl relative">
            <BelizeGoogleIncidentMap
              incidents={filteredIncidents}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              selectedIncidentId={selectedIncident?.id}
              className="h-[560px] sm:h-[650px] w-full"
              onReportAtCoordinates={(coords, district, isAtCurrentLocation) => {
                if (onSetPinnedLocation) {
                  onSetPinnedLocation(coords, district, Boolean(isAtCurrentLocation));
                }
              }}
            />
          </div>

          {/* Map Legend */}
          <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-black text-[#f3c853]">Legend:</span>
              <div className="flex items-center gap-2.5 flex-wrap text-[11px] font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white" />
                  Critical
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
                  High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                  Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                  Resolved
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Click anywhere on Belize territory to lock coordinates for incident report.
            </div>
          </div>
        </div>

        {/* Sidebar Live Feed */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a] flex items-center justify-between">
            <div>
              <h3 className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Live Operational Stream</span>
              </h3>
              <p className="text-[10px] text-slate-400">Verified by Belize Central Dispatch</p>
            </div>
            <span className="text-[11px] font-mono text-[#f3c853] font-bold">
              {filteredIncidents.length} Records
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredIncidents.length === 0 ? (
              <div className="bg-[#0b1220] p-6 rounded-2xl border border-[#1e2e4a] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white">No Incidents Matching Filter</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  All monitored Belize zones operate under normal status. To file an incident, tap any location on the map.
                </p>
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  isSelected={selectedIncident?.id === incident.id}
                  onClick={() => setSelectedIncident(incident)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
