import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Radio,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Building,
  User,
  Phone,
  MessageSquare,
  Check
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { useCommand } from '../../context/CommandContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { EmergencyIncident, EmergencyStatus, EmergencySeverity, BelizeDistrict, ResponseTeam } from '../../types';

export const IncidentManagementView: React.FC = () => {
  const {
    incidents,
    selectedIncident,
    setSelectedIncident,
    updateIncidentStatus,
    approveIncident,
    rejectIncident,
    deleteIncident,
  } = useIncidents();

  const { isAdmin, user } = useAuth();
  const { responseTeams } = useCommand();

  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState<BelizeDistrict | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | 'all' | 'pending_verification'>('all');
  const [severityFilter, setSeverityFilter] = useState<EmergencySeverity | 'all'>('all');
  const [sortField, setSortField] = useState<'createdAt' | 'severity' | 'district'>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Verification & Status Action Modal State
  const [actionIncident, setActionIncident] = useState<EmergencyIncident | null>(null);
  const [modalMode, setModalMode] = useState<'verify' | 'status' | 'assign' | 'close' | null>(null);
  const [operationalNotes, setOperationalNotes] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [closureResolution, setClosureResolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered & Sorted Incidents
  const filteredList = useMemo(() => {
    return incidents.filter((inc) => {
      if (districtFilter !== 'all' && inc.district !== districtFilter) return false;
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;

      if (statusFilter === 'pending_verification') {
        if (inc.status !== 'reported' && inc.status !== 'under_verification') return false;
      } else if (statusFilter !== 'all') {
        if (inc.status !== statusFilter) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = inc.title.toLowerCase().includes(term);
        const matchId = inc.id.toLowerCase().includes(term);
        const matchLoc = inc.locationName.toLowerCase().includes(term);
        const matchReporter = inc.reporterName.toLowerCase().includes(term);
        if (!matchTitle && !matchId && !matchLoc && !matchReporter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'createdAt') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      }
      if (sortField === 'severity') {
        const rank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const diff = (rank[a.severity] || 0) - (rank[b.severity] || 0);
        return sortAsc ? diff : -diff;
      }
      return sortAsc ? a.district.localeCompare(b.district) : b.district.localeCompare(a.district);
    });
  }, [incidents, districtFilter, severityFilter, statusFilter, searchTerm, sortField, sortAsc]);

  // Handle Verify Action (Approve to Verified or Dispatched)
  const handleVerifySubmit = async (approved: boolean) => {
    if (!actionIncident) return;
    setIsSubmitting(true);
    try {
      if (approved) {
        await approveIncident(actionIncident.id);
      } else {
        await rejectIncident(actionIncident.id, operationalNotes || 'Declined during verification review');
      }
      setActionIncident(null);
      setModalMode(null);
      setOperationalNotes('');
    } catch (err: any) {
      alert(`Error updating incident: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Update / Team Assignment / Closure
  const handleOperationalUpdate = async (newStatus: EmergencyStatus) => {
    if (!actionIncident) return;
    setIsSubmitting(true);
    try {
      const assignedTeam = responseTeams.find((t) => t.id === selectedTeamId);
      const unitName = assignedTeam ? `${assignedTeam.name} (${assignedTeam.organization})` : actionIncident.assignedUnit;

      await updateIncidentStatus(
        actionIncident.id,
        newStatus,
        operationalNotes || (modalMode === 'close' ? `Closed: ${closureResolution}` : undefined),
        unitName
      );

      setActionIncident(null);
      setModalMode(null);
      setOperationalNotes('');
      setSelectedTeamId('');
      setClosureResolution('');
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Search Ribbon */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-white">
                Incident Management & Verification Desk
              </h2>
              <p className="text-[11px] text-slate-400">
                End-to-end incident lifecycle: Reported → Under Verification → Verified → Dispatched → Responding → Resolved → Closed
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-[#f3c853] font-bold bg-[#141f33] px-3 py-1.5 rounded-xl border border-[#233555] self-start sm:self-auto">
            {filteredList.length} Incidents Filtered
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, title, community, or reporter..."
              className="w-full bg-[#121c2e] border border-[#233555] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* District Dropdown */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-2 text-xs text-slate-300 font-bold focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">📍 All Districts</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-2 text-xs text-slate-300 font-bold focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">Status: All</option>
            <option value="pending_verification">⚠️ Pending Verification</option>
            <option value="reported">Reported</option>
            <option value="under_verification">Under Verification</option>
            <option value="verified">Verified</option>
            <option value="dispatched">Dispatched</option>
            <option value="responding">Responding</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="false_alarm">False Alarm</option>
          </select>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-2 text-xs text-slate-300 font-bold focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort Button */}
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="px-2.5 py-2 rounded-xl bg-[#121c2e] hover:bg-[#1b2740] border border-[#233555] text-slate-300 flex items-center gap-1.5 transition"
            title="Toggle Sort Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{sortAsc ? 'Asc' : 'Desc'}</span>
          </button>
        </div>
      </div>

      {/* Incident Table */}
      <div className="bg-[#0b1220] rounded-2xl border border-[#1e2e4a] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070c17] text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-[#1e2e4a]">
              <tr>
                <th className="py-3 px-3">Incident ID & Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">District & Location</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Lifecycle Status</th>
                <th className="py-3 px-3">Assigned Team</th>
                <th className="py-3 px-3">Reported Time</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182338]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No emergency incident reports matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((inc) => {
                  const isPending = inc.status === 'reported' || inc.status === 'under_verification';

                  return (
                    <tr
                      key={inc.id}
                      className="hover:bg-[#121b2d] transition group cursor-pointer"
                      onClick={() => setSelectedIncident(inc)}
                    >
                      {/* ID & Title */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white group-hover:text-[#f3c853] transition text-xs">
                          {inc.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{inc.id}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-300 capitalize text-[11px]">
                          {inc.category.replace('_', ' ')}
                        </span>
                      </td>

                      {/* District & Location */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-[11px]">{inc.district}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {inc.locationName}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            inc.severity === 'critical'
                              ? 'bg-red-950 text-red-300 border-red-500/50 animate-pulse'
                              : inc.severity === 'high'
                              ? 'bg-orange-950 text-orange-300 border-orange-500/50'
                              : inc.severity === 'medium'
                              ? 'bg-amber-950 text-yellow-300 border-yellow-500/50'
                              : 'bg-slate-800 text-slate-300 border-slate-600'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isPending
                              ? 'bg-amber-500/20 text-yellow-300 border-amber-500/60 animate-pulse'
                              : inc.status === 'dispatched' || inc.status === 'responding'
                              ? 'bg-blue-900/80 text-blue-300 border-blue-500/50'
                              : inc.status === 'resolved' || inc.status === 'closed'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {inc.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Assigned Unit */}
                      <td className="py-3 px-3 text-[11px]">
                        {inc.assignedUnit ? (
                          <span className="text-blue-300 font-semibold">{inc.assignedUnit}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Reported Time */}
                      <td className="py-3 px-3 text-[10px] text-slate-400 font-mono">
                        {new Date(inc.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionIncident(inc);
                                setModalMode('verify');
                              }}
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] transition"
                              title="Verify Citizen Submission"
                            >
                              Verify
                            </button>
                          )}

                          {isAdmin && !isPending && inc.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionIncident(inc);
                                setModalMode('status');
                              }}
                              className="px-2 py-1 rounded bg-[#1e2b45] hover:bg-[#2b3c60] text-slate-200 font-bold text-[10px] border border-[#2a3d66] transition"
                              title="Update Operational Status or Assign Unit"
                            >
                              Dispatch / Update
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedIncident(inc)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                            title="View Incident Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification & Action Modal */}
      {actionIncident && modalMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-[#d4af37] text-white max-w-lg w-full p-5 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-yellow-400 flex items-center justify-center border border-amber-500/50">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {modalMode === 'verify'
                      ? 'Incident Verification Review'
                      : 'Operational Status & Dispatch'}
                  </h3>
                  <p className="text-[11px] text-slate-400">ID: {actionIncident.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActionIncident(null);
                  setModalMode(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Target Incident Summary Card */}
            <div className="bg-[#070c17] p-3 rounded-xl border border-[#1e2e4a] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{actionIncident.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-950 text-red-300 border border-red-500/40">
                  {actionIncident.severity}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{actionIncident.description}</p>
              <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2 border-t border-[#1e2e4a]">
                <span>District: <strong>{actionIncident.district}</strong></span>
                <span>•</span>
                <span>Reporter: <strong>{actionIncident.reporterName}</strong></span>
                {actionIncident.reporterPhone && (
                  <span>({actionIncident.reporterPhone})</span>
                )}
              </div>
            </div>

            {/* Verification Mode Controls */}
            {modalMode === 'verify' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Operational Verification Notes / Reason (optional for rejection):
                  </label>
                  <textarea
                    rows={2}
                    value={operationalNotes}
                    onChange={(e) => setOperationalNotes(e.target.value)}
                    placeholder="e.g. Eyewitness confirmed, scene validated by Belize Central Dispatch..."
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2e4a]">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleVerifySubmit(false)}
                    className="px-3.5 py-2 rounded-xl bg-red-950 hover:bg-red-800 text-red-200 border border-red-700/60 font-bold transition disabled:opacity-50"
                  >
                    Reject as False Alarm
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleVerifySubmit(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Broadcast</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status / Dispatch Mode Controls */}
            {modalMode === 'status' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Assign Emergency Response Team:
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="">-- Keep Current Unit ({actionIncident.assignedUnit || 'None'}) --</option>
                    {responseTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.organization} - {team.district}) [{team.status.toUpperCase()}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Operational Log Note:
                  </label>
                  <input
                    type="text"
                    value={operationalNotes}
                    onChange={(e) => setOperationalNotes(e.target.value)}
                    placeholder="e.g. Unit en route with 2 fire engines and medical support..."
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="pt-2 border-t border-[#1e2e4a] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleOperationalUpdate('dispatched')}
                      className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold"
                    >
                      Set Dispatched
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleOperationalUpdate('responding')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                    >
                      Set Responding
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleOperationalUpdate('resolved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Set Resolved
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleOperationalUpdate('closed')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold"
                  >
                    Close Incident
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
