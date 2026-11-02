import React, { useState } from 'react';
import {
  GraduationCap,
  MapPin,
  Shield,
  Phone,
  Mail,
  Home,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useAuth } from '../../context/AuthContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { SchoolSafetyProfile, BelizeDistrict } from '../../types';

export const SchoolSafetyView: React.FC = () => {
  const { schools, updateSchoolStatus } = useCommand();
  const { isAdmin } = useAuth();

  const [selectedDistrict, setSelectedDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [editingSchool, setEditingSchool] = useState<SchoolSafetyProfile | null>(null);
  const [newStatus, setNewStatus] = useState<SchoolSafetyProfile['status']>('normal');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredSchools = schools.filter(
    (s) => selectedDistrict === 'all' || s.district === selectedDistrict
  );

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    setIsUpdating(true);
    try {
      await updateSchoolStatus(editingSchool.id, newStatus, notes);
      setEditingSchool(null);
    } catch (err: any) {
      alert(`Error updating school safety: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadge = (st: SchoolSafetyProfile['status']) => {
    switch (st) {
      case 'normal':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
      case 'delayed':
        return 'bg-amber-950 text-yellow-300 border-yellow-500/50';
      case 'closed':
        return 'bg-red-950 text-red-300 border-red-500/50';
      case 'evacuating':
        return 'bg-red-600 text-white border-red-400 animate-pulse';
      case 'designated_shelter':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/50';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Institutional & School Safety Coordination
            </h2>
            <p className="text-[11px] text-slate-400">
              Emergency readiness, delayed opening bulletins, and civil shelter designations across Belize schools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Districts ({schools.length})</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Institutional Privacy & Child Protection Notice */}
      <div className="bg-[#10192e] p-3 rounded-xl border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-200">
        <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Institutional Protection Protocol:</strong> Student emergency communications are transmitted through authenticated school liaisons. Minor personal data is never made publicly visible.
        </div>
      </div>

      {/* Schools Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-[#0b1220] rounded-xl border border-[#1e2e4a] hover:border-[#2e4370] p-4 shadow-lg flex flex-col justify-between space-y-3 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{school.name}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{school.district} District • {school.community}</span>
                  </p>
                </div>

                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusBadge(
                    school.status
                  )}`}
                >
                  {school.status.replace('_', ' ')}
                </span>
              </div>

              {/* Shelter Designation Tag */}
              {school.isDesignatedShelter && (
                <div className="mt-2.5 bg-cyan-950/80 p-2 rounded-lg border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-[10px] uppercase text-cyan-300">
                    <Home className="w-3.5 h-3.5" />
                    <span>Designated Civil Shelter</span>
                  </span>
                  <span className="font-mono text-[10px] text-white">
                    Cap: {school.shelterCapacity} Persons
                  </span>
                </div>
              )}

              {/* Specs Box */}
              <div className="mt-2.5 bg-[#070c17] p-2.5 rounded-lg border border-[#182338] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Principal / Admin:</span>
                  <span className="text-white font-bold">{school.principalName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Emergency Phone:</span>
                  <a href={`tel:${school.contactPhone}`} className="text-emerald-300 font-mono hover:underline">
                    {school.contactPhone}
                  </a>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Emergency Email:</span>
                  <span className="text-slate-300 truncate max-w-[170px]">{school.emergencyEmail}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Enrolled Students:</span>
                  <span className="text-slate-200 font-mono">{school.studentCount} Students</span>
                </div>

                {school.safetyNotes && (
                  <div className="text-[10px] text-slate-300 pt-1 border-t border-[#182338] italic">
                    "{school.safetyNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-between text-[10px] text-slate-400">
              <span>Updated: {new Date(school.lastReportedAt).toLocaleDateString()}</span>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSchool(school);
                    setNewStatus(school.status);
                    setNotes(school.safetyNotes || '');
                  }}
                  className="px-2.5 py-1 rounded bg-[#16233b] hover:bg-[#203254] text-amber-200 text-xs font-bold border border-[#273d66] transition flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Update Status</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit School Status Modal */}
      {editingSchool && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-[#d4af37] text-white max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <h3 className="font-bold text-sm sm:text-base">
                Update Status: {editingSchool.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSchool(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Safety Operational Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="normal">Normal Operations</option>
                  <option value="delayed">Delayed Opening / Inclement Weather</option>
                  <option value="closed">School Closed / Canceled Classes</option>
                  <option value="evacuating">Evacuating Campus</option>
                  <option value="designated_shelter">Activated as Civil Evacuation Shelter</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Safety Advisory Notes / Instructions:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Classes suspended due to flooded approach roads. Reopening assessment at 2 PM..."
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSchool(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
