import React from 'react';
import {
  AlertTriangle,
  FileText,
  Radio,
  Users,
  ShieldAlert,
  Home,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Activity,
  MapPin,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  CloudRain
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import { useAdvisories } from '../../context/AdvisoryContext';
import { TopAdvisoryBanner } from '../TopAdvisoryBanner';
import { DailyIncidentTrends } from '../DailyIncidentTrends';
import { IncidentCard } from '../IncidentCard';
import { EmergencyIncident } from '../../types';

export const CommandDashboardView: React.FC = () => {
  const {
    nationalStatus,
    setActiveTab,
    responseTeams,
    evacuationCentres,
    communities,
    auditLogs,
  } = useCommand();

  const { user, profile, isAdmin } = useAuth();
  const {
    incidents,
    approvedIncidents,
    pendingIncidents,
    myPendingIncidents,
    setSelectedIncident,
    approveIncident,
    rejectIncident,
  } = useIncidents();

  const { advisories } = useAdvisories();

  // Actual KPI counts computed strictly from live Firebase state
  const activeEmergencies = approvedIncidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'false_alarm'
  );

  const criticalEmergencies = activeEmergencies.filter((i) => i.severity === 'critical');
  const activeAlerts = advisories.filter((a) => a.active);
  const activeDeployedTeams = responseTeams.filter((t) => t.status === 'deployed');
  const openShelters = evacuationCentres.filter((c) => c.status === 'open');

  // Communities with active emergency reports
  const activeDistricts = new Set(activeEmergencies.map((i) => i.district));
  const communitiesAtRisk = communities.filter((c) => activeDistricts.has(c.district)).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1424] via-[#121c33] to-[#0c1424] rounded-2xl border border-[#233555] p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_#d4af37_0%,_transparent_70%)]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#f3c853]">
                National Emergency Operations Centre (EOC)
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1">
              BELIZE ALERTS – NATIONAL EMERGENCY MANAGEMENT DASHBOARD
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Welcome, <strong className="text-white">{profile?.displayName || user?.email || 'Officer'}</strong>. Live unified situational awareness across Belize’s six districts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('national_map')}
              className="px-3.5 py-2 rounded-xl bg-[#1b2742] hover:bg-[#25365c] text-amber-200 hover:text-white border border-[#2e4370] text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <MapPin className="w-4 h-4 text-[#d4af37]" />
              <span>Open National Map</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('emergency_alerts')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-[#8b152e] hover:from-red-600 text-white text-xs font-black border border-red-400 shadow-md transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
                <span>Issue Public Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Weather Advisory Desk (Live NMS Belize Sync) */}
      <TopAdvisoryBanner />

      {/* 2.1 Key Performance Indicators (6 Cards from Real Data) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* KPI 1: Active Emergencies */}
        <div
          onClick={() => setActiveTab('national_map')}
          className="bg-[#0e1626] rounded-xl border border-[#233555] hover:border-[#d4af37] p-3 sm:p-3.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Active Emergencies
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-950/80 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {activeEmergencies.length}
            </span>
            {criticalEmergencies.length > 0 && (
              <span className="text-[10px] text-red-400 font-bold">
                ({criticalEmergencies.length} Critical)
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Verified by EOC</span>
            <ArrowRight className="w-3 h-3 text-[#d4af37] opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* KPI 2: Open Incident Reports */}
        <div
          onClick={() => setActiveTab('incident_management')}
          className="bg-[#0e1626] rounded-xl border border-[#233555] hover:border-[#d4af37] p-3 sm:p-3.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Open Incident Reports
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {incidents.filter((i) => i.status !== 'resolved' && i.status !== 'false_alarm').length}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>All active files</span>
            <ArrowRight className="w-3 h-3 text-[#d4af37] opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* KPI 3: Active Public Alerts */}
        <div
          onClick={() => setActiveTab('emergency_alerts')}
          className="bg-[#0e1626] rounded-xl border border-[#233555] hover:border-[#d4af37] p-3 sm:p-3.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Active Public Alerts
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 text-yellow-400 border border-yellow-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {activeAlerts.length}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Broadcast tier</span>
            <ArrowRight className="w-3 h-3 text-[#d4af37] opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* KPI 4: Communities at Risk */}
        <div
          onClick={() => setActiveTab('community_safety')}
          className="bg-[#0e1626] rounded-xl border border-[#233555] hover:border-[#d4af37] p-3 sm:p-3.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Communities at Risk
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {communitiesAtRisk}
            </span>
            <span className="text-[10px] text-slate-400">/ {communities.length}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Monitored hubs</span>
            <ArrowRight className="w-3 h-3 text-[#d4af37] opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* KPI 5: Active Response Teams */}
        <div
          onClick={() => setActiveTab('response_operations')}
          className="bg-[#0e1626] rounded-xl border border-[#233555] hover:border-[#d4af37] p-3 sm:p-3.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Active Teams
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {activeDeployedTeams.length}
            </span>
            <span className="text-[10px] text-slate-400">/ {responseTeams.length} total</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Deployed field units</span>
            <ArrowRight className="w-3 h-3 text-[#d4af37] opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* KPI 6: Reports Awaiting Verification */}
        <div
          onClick={() => setActiveTab('incident_management')}
          className="bg-[#0e1626] rounded-xl border border-[#233555] hover:border-[#d4af37] p-3 sm:p-3.5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Needs Verification
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              pendingIncidents.length > 0
                ? 'bg-amber-500/20 text-yellow-300 border border-amber-500/60 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-yellow-300 font-mono">
              {pendingIncidents.length}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Pending approval</span>
            <ArrowRight className="w-3 h-3 text-[#d4af37] opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>
      </div>

      {/* 2.2 Operational Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column (8 cols): Incident Verification Queue & 7-Day Trends */}
        <div className="lg:col-span-8 space-y-3">
          {/* Verification Banner if pending reports exist */}
          {pendingIncidents.length > 0 && (
            <div className="bg-[#141824] rounded-2xl border-2 border-amber-500/80 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-yellow-300 border border-amber-500/50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      Reports Requiring Administrator Verification ({pendingIncidents.length})
                    </h3>
                    <p className="text-xs text-amber-200/80">
                      Citizen-submitted reports are isolated from the public network until authenticated.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('incident_management')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                >
                  Review All
                </button>
              </div>

              {/* Top 2 Pending Items */}
              <div className="space-y-2">
                {pendingIncidents.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0b0f19] p-3 rounded-xl border border-[#233555] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-red-950 text-red-300 border border-red-500/40">
                          {item.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.district} District • {item.locationName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Reporter: <strong>{item.reporterName}</strong> {item.reporterPhone && `(${item.reporterPhone})`}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => approveIncident(item.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectIncident(item.id)}
                          className="px-2.5 py-1 rounded bg-red-900/80 hover:bg-red-800 text-red-200 text-xs transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citizen Reporter Notice if user has personal pending reports */}
          {!isAdmin && myPendingIncidents.length > 0 && (
            <div className="bg-[#121c30] border border-amber-500/60 p-3 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-yellow-300 animate-pulse shrink-0" />
                <span>
                  Your submitted report is under verification by Belize Central Dispatch and will appear on the map upon approval.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-yellow-300 font-bold text-[10px] shrink-0 border border-amber-500/40">
                In Review
              </span>
            </div>
          )}

          {/* Daily Trends Chart */}
          <DailyIncidentTrends incidents={incidents} />

          {/* Latest Verified Emergency Incidents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Latest Active Emergency Operations</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('national_map')}
                className="text-xs text-[#d4af37] hover:underline font-bold"
              >
                View on Map ({filteredIncidentsCount(approvedIncidents)})
              </button>
            </div>

            {activeEmergencies.length === 0 ? (
              <div className="bg-[#0b101d] p-6 rounded-2xl border border-[#1e293b] text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">All Clear Across Belize</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No verified life-threat emergencies currently active in Belize. Normal civil readiness maintained across all districts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeEmergencies.slice(0, 4).map((inc) => (
                  <IncidentCard
                    key={inc.id}
                    incident={inc}
                    isSelected={false}
                    onClick={() => {
                      setSelectedIncident(inc);
                      setActiveTab('national_map');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Evacuation Shelters & Recent Administrative Activity */}
        <div className="lg:col-span-4 space-y-3">

          {/* Evacuation Shelters Status Summary */}
          <div className="bg-[#0c1424] p-3.5 rounded-2xl border border-[#233555] shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Shelter & Safe Havens</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('evacuation_centres')}
                className="text-[10px] text-[#d4af37] hover:underline font-bold"
              >
                View ({evacuationCentres.length})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-[#070c17] p-2 rounded-xl border border-[#1e293b]">
                <div className="text-lg font-black text-white font-mono">{openShelters.length}</div>
                <div className="text-[10px] text-emerald-400 font-bold">Open Shelters</div>
              </div>
              <div className="bg-[#070c17] p-2 rounded-xl border border-[#1e293b]">
                <div className="text-lg font-black text-white font-mono">
                  {evacuationCentres.reduce((acc, s) => acc + s.capacity, 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold">National Capacity</div>
              </div>
            </div>
          </div>

          {/* Recent Administrative Activity Feed */}
          <div className="bg-[#0c1424] p-3.5 rounded-2xl border border-[#233555] shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Administrative Activity</h3>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('audit_logs')}
                  className="text-[10px] text-[#d4af37] hover:underline font-bold"
                >
                  Audit Log
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {auditLogs.slice(0, 4).length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No recent administrative events recorded.</p>
              ) : (
                auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="bg-[#070c17] p-2.5 rounded-xl border border-[#1e293b]">
                    <div className="font-bold text-white text-[11px] leading-tight">{log.action}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>By: {log.actorName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function filteredIncidentsCount(approvedIncidents: EmergencyIncident[]): number {
  return approvedIncidents.filter((i) => i.status !== 'resolved' && i.status !== 'false_alarm').length;
}
