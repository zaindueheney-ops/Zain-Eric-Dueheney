import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Users,
  Shield,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Flame,
  Truck,
  Anchor,
  Activity
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useIncidents } from '../../context/IncidentContext';
import { useAuth } from '../../context/AuthContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { ResponseTeam, BelizeDistrict } from '../../types';

export const ResponseOperationsView: React.FC = () => {
  const { responseTeams, updateResponseTeam, addResponseTeam } = useCommand();
  const { approvedIncidents, updateIncidentStatus } = useIncidents();
  const { isAdmin } = useAuth();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [selectedTeamForDispatch, setSelectedTeamForDispatch] = useState<ResponseTeam | null>(null);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamOrg, setNewTeamOrg] = useState('NEMO District Taskforce');
  const [newTeamDistrict, setNewTeamDistrict] = useState<BelizeDistrict | 'National'>('Belize');
  const [newTeamCategory, setNewTeamCategory] = useState<ResponseTeam['category']>('nemo');
  const [newLeadOfficer, setNewLeadOfficer] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('+501 ');
  const [newPersonnelCount, setNewPersonnelCount] = useState('8');
  const [newEquipment, setNewEquipment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dispatch Assignment Form State
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');

  const availableTeams = responseTeams.filter((t) => t.status === 'available');
  const deployedTeams = responseTeams.filter((t) => t.status === 'deployed');
  const standbyTeams = responseTeams.filter((t) => t.status === 'standby');

  const filteredTeams = responseTeams.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterDistrict !== 'all' && t.district !== filterDistrict) return false;
    return true;
  });

  const handleAddTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Operational dispatch and team registration are restricted to authorized administrators.');
      return;
    }
    if (!newTeamName.trim() || !newLeadOfficer.trim()) return;

    setIsSubmitting(true);
    try {
      await addResponseTeam({
        name: newTeamName.trim(),
        organization: newTeamOrg.trim(),
        district: newTeamDistrict,
        category: newTeamCategory,
        status: 'available',
        leadOfficer: newLeadOfficer.trim(),
        contactPhone: newContactPhone.trim(),
        personnelCount: Number(newPersonnelCount) || 6,
        equipmentSummary: newEquipment.trim() || 'Standard Response Gear',
      });

      setIsAddTeamModalOpen(false);
      setNewTeamName('');
      setNewLeadOfficer('');
      setNewEquipment('');
    } catch (err: any) {
      alert(`Error creating response team: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Incident dispatching is restricted to authorized administrators.');
      return;
    }
    if (!selectedTeamForDispatch || !selectedIncidentId) return;

    const targetInc = approvedIncidents.find((i) => i.id === selectedIncidentId);
    if (!targetInc) return;

    setIsSubmitting(true);
    try {
      // 1. Update team status to deployed
      await updateResponseTeam(selectedTeamForDispatch.id, {
        status: 'deployed',
        activeIncidentId: targetInc.id,
        activeIncidentTitle: targetInc.title,
      });

      // 2. Update incident assignedUnit and status to dispatched
      await updateIncidentStatus(
        targetInc.id,
        'dispatched',
        `Dispatched ${selectedTeamForDispatch.name}. ${dispatchNote}`.trim(),
        selectedTeamForDispatch.name
      );

      setSelectedTeamForDispatch(null);
      setSelectedIncidentId('');
      setDispatchNote('');
    } catch (err: any) {
      alert(`Dispatch error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecallTeam = async (team: ResponseTeam) => {
    if (!isAdmin) {
      alert('Only authorized administrators can recall deployed units.');
      return;
    }
    if (!confirm(`Recall ${team.name} to available standby status?`)) return;
    await updateResponseTeam(team.id, {
      status: 'available',
      activeIncidentId: undefined,
      activeIncidentTitle: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Ribbon */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Emergency Response Operations & Strike Forces
            </h2>
            <p className="text-[11px] text-slate-400">
              Field deployment tracking, unit dispatching, and multi-agency responder coordination across Belize
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddTeamModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 text-white font-black text-xs border border-blue-400/60 shadow-lg flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Response Team</span>
          </button>
        )}
      </div>

      {/* Citizen View Mode Operational Notice */}
      {!isAdmin && (
        <div className="bg-[#07111e] border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Read-Only Operational View:</strong> Central dispatching and tactical team deployment are managed exclusively by the National Emergency Operations Centre & Authorized Administrators. Citizens have read-only visibility into unit statuses.
          </span>
        </div>
      )}

      {/* Force Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Deployed On Scene</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
              {deployedTeams.length}
            </span>
            <span className="text-[10px] text-slate-400">Active</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Ready on Standby</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {availableTeams.length}
            </span>
            <span className="text-[10px] text-slate-400">Available</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">On Standby Post</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-yellow-300 font-mono">
              {standbyTeams.length}
            </span>
            <span className="text-[10px] text-slate-400">Reserve</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Field Personnel</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {responseTeams.reduce((sum, t) => sum + t.personnelCount, 0)}
            </span>
            <span className="text-[10px] text-slate-400">Officers</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a]">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#121c2e] border border-[#233555] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">All Disciplines</option>
          <option value="nemo">NEMO / Disaster Taskforce</option>
          <option value="fire">Fire & Rescue</option>
          <option value="medical">Paramedic & Ambulance</option>
          <option value="police">Police & Security</option>
          <option value="marine">Coast Guard / Marine SAR</option>
        </select>

        <select
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          className="bg-[#121c2e] border border-[#233555] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">All Jurisdictions</option>
          <option value="National">National Coverage</option>
          {BELIZE_DISTRICTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <span className="text-[11px] font-mono text-slate-400 ml-auto font-bold">
          {filteredTeams.length} Teams
        </span>
      </div>

      {/* Response Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="bg-[#0b1220] rounded-xl border border-[#1e2e4a] hover:border-[#2e4370] p-4 shadow-lg flex flex-col justify-between space-y-3 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight">{team.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {team.organization} • {team.district}
                  </p>
                </div>

                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    team.status === 'deployed'
                      ? 'bg-blue-600 text-white border-blue-400 animate-pulse'
                      : team.status === 'available'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950 text-yellow-300 border-amber-500/40'
                  }`}
                >
                  {team.status}
                </span>
              </div>

              {/* Active Incident Tag if deployed */}
              {team.status === 'deployed' && team.activeIncidentTitle && (
                <div className="mt-2.5 bg-blue-950/80 p-2 rounded-lg border border-blue-500/40 text-xs text-blue-200 space-y-0.5">
                  <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span>Engaged At Scene:</span>
                  </div>
                  <p className="font-semibold text-white text-[11px] truncate">
                    {team.activeIncidentTitle}
                  </p>
                </div>
              )}

              {/* Specs Box */}
              <div className="mt-2.5 bg-[#070c17] p-2.5 rounded-lg border border-[#182338] space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Lead Officer:</span>
                  <span className="text-white font-bold">{team.leadOfficer}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Emergency Phone:</span>
                  <a href={`tel:${team.contactPhone}`} className="text-emerald-300 font-mono hover:underline">
                    {team.contactPhone}
                  </a>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Crew Strength:</span>
                  <span className="text-slate-200">{team.personnelCount} Responders</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-[#182338]">
                  Gear: <span className="text-slate-300">{team.equipmentSummary}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">
                Sync: {new Date(team.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  {team.status === 'deployed' ? (
                    <button
                      type="button"
                      onClick={() => handleRecallTeam(team)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                    >
                      Recall Unit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedTeamForDispatch(team)}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
                    >
                      Dispatch
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Assignment Modal */}
      {selectedTeamForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-blue-500 text-white max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  Dispatch {selectedTeamForDispatch.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeamForDispatch(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Select Verified Incident Target:
                </label>
                <select
                  required
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="">-- Choose Incident to Assign --</option>
                  {approvedIncidents
                    .filter((i) => i.status !== 'resolved' && i.status !== 'false_alarm')
                    .map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        [{inc.severity.toUpperCase()}] {inc.title} ({inc.district} - {inc.locationName})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Dispatch Orders & Instructions:
                </label>
                <textarea
                  rows={2}
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="e.g. Proceed with sirens on Western Highway. Coordinate with Scene Commander."
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeamForDispatch(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New Response Team Modal */}
      {isAddTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-[#d4af37] text-white max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <h3 className="font-bold text-sm sm:text-base">Register Response Force Unit</h3>
              <button
                type="button"
                onClick={() => setIsAddTeamModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeamSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Team / Strike Force Name:
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. San Pedro Fire Station Engine 1"
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Affiliation / Agency:
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeamOrg}
                    onChange={(e) => setNewTeamOrg(e.target.value)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Jurisdiction / District:
                  </label>
                  <select
                    value={newTeamDistrict}
                    onChange={(e) => setNewTeamDistrict(e.target.value as any)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="National">National Coverage</option>
                    {BELIZE_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Lead Officer:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadOfficer}
                    onChange={(e) => setNewLeadOfficer(e.target.value)}
                    placeholder="e.g. Station Officer John Doe"
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Contact Phone:
                  </label>
                  <input
                    type="text"
                    required
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Equipment / Vehicle Summary:
                </label>
                <input
                  type="text"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  placeholder="e.g. Heavy Pumper, Hazmat kit, 4x4 rescue truck"
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTeamModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Register Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
