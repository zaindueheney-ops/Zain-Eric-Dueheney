import React, { useState } from 'react';
import {
  Home,
  MapPin,
  CheckCircle2,
  Users,
  Phone,
  Zap,
  Droplet,
  HeartPulse,
  Accessibility,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useAuth } from '../../context/AuthContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { EvacuationCentre, BelizeDistrict } from '../../types';

export const EvacuationCentresView: React.FC = () => {
  const { evacuationCentres, updateEvacuationCentre } = useCommand();
  const { isAdmin } = useAuth();

  const [selectedDistrict, setSelectedDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingCentre, setEditingCentre] = useState<EvacuationCentre | null>(null);
  const [newStatus, setNewStatus] = useState<EvacuationCentre['status']>('standby');
  const [newOccupancy, setNewOccupancy] = useState('0');
  const [newNotes, setNewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredCentres = evacuationCentres.filter((c) => {
    if (selectedDistrict !== 'all' && c.district !== selectedDistrict) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    return true;
  });

  const totalCapacity = evacuationCentres.reduce((sum, c) => sum + c.capacity, 0);
  const totalOccupancy = evacuationCentres.reduce((sum, c) => sum + c.currentOccupancy, 0);
  const openCount = evacuationCentres.filter((c) => c.status === 'open').length;

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCentre) return;

    setIsUpdating(true);
    try {
      await updateEvacuationCentre(editingCentre.id, {
        status: newStatus,
        currentOccupancy: Number(newOccupancy) || 0,
        notes: newNotes,
      });
      setEditingCentre(null);
    } catch (err: any) {
      alert(`Error updating shelter: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadge = (status: EvacuationCentre['status']) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/50 animate-pulse';
      case 'full':
        return 'bg-red-950 text-red-300 border-red-500/50';
      case 'standby':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/50';
      case 'closed':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              National Evacuation Centres & Civil Shelters
            </h2>
            <p className="text-[11px] text-slate-400">
              Pre-surveyed hurricane and flood refuges across Belize's six districts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Districts</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open (Active)</option>
            <option value="standby">Standby</option>
            <option value="full">Full Capacity</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Active Open Shelters</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{openCount}</span>
            <span className="text-[10px] text-slate-400">/ {evacuationCentres.length}</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Shelter Capacity</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {totalCapacity.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Persons</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Current Occupancy</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
              {totalOccupancy.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Sheltered</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Available Bedspace</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {(totalCapacity - totalOccupancy).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Open Slots</span>
          </div>
        </div>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCentres.map((centre) => {
          const occupancyPct = Math.round((centre.currentOccupancy / centre.capacity) * 100);

          return (
            <div
              key={centre.id}
              className="bg-[#0b1220] rounded-xl border border-[#1e2e4a] hover:border-[#2e4370] p-4 shadow-lg flex flex-col justify-between space-y-3 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">{centre.name}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      <span>{centre.district} District • {centre.community}</span>
                    </p>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusBadge(
                      centre.status
                    )}`}
                  >
                    {centre.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 mt-1.5 font-mono">
                  {centre.address}
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-2.5 bg-[#070c17] p-2.5 rounded-lg border border-[#182338] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Shelter Occupancy:</span>
                    <span className="text-white font-mono font-bold">
                      {centre.currentOccupancy} / {centre.capacity} ({occupancyPct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        occupancyPct >= 90
                          ? 'bg-red-500'
                          : occupancyPct >= 60
                          ? 'bg-yellow-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                    />
                  </div>

                  {/* Amenities Badges */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#182338] text-[10px] text-slate-300">
                    {centre.hasGenerator && (
                      <span className="flex items-center gap-0.5 text-amber-300" title="Auxiliary Generator">
                        <Zap className="w-3 h-3" /> Gen
                      </span>
                    )}
                    {centre.hasWaterReserve && (
                      <span className="flex items-center gap-0.5 text-cyan-300" title="Cistern Water Reserve">
                        <Droplet className="w-3 h-3" /> Water
                      </span>
                    )}
                    {centre.hasMedicalPost && (
                      <span className="flex items-center gap-0.5 text-red-300" title="First Aid Medical Station">
                        <HeartPulse className="w-3 h-3" /> Medical
                      </span>
                    )}
                    {centre.isWheelchairAccessible && (
                      <span className="flex items-center gap-0.5 text-emerald-300" title="Wheelchair Accessible">
                        <Accessibility className="w-3 h-3" /> Ramp
                      </span>
                    )}
                  </div>
                </div>

                {/* Coordinator Info */}
                <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                  <div>
                    Shelter Manager: <strong className="text-slate-200">{centre.managerName}</strong>
                  </div>
                  <div>
                    Emergency Contact: <a href={`tel:${centre.managerPhone}`} className="text-emerald-300 font-mono hover:underline">{centre.managerPhone}</a>
                  </div>
                </div>

                {centre.notes && (
                  <p className="mt-2 text-[10px] text-slate-400 italic bg-[#070c17] p-2 rounded border border-[#182338]">
                    {centre.notes}
                  </p>
                )}
              </div>

              {/* Action Bar */}
              {isAdmin && (
                <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCentre(centre);
                      setNewStatus(centre.status);
                      setNewOccupancy(String(centre.currentOccupancy));
                      setNewNotes(centre.notes || '');
                    }}
                    className="px-2.5 py-1 rounded bg-[#16233b] hover:bg-[#203254] text-amber-200 text-xs font-bold border border-[#273d66] transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Manage Shelter</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Shelter Modal */}
      {editingCentre && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-[#d4af37] text-white max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <h3 className="font-bold text-sm sm:text-base">
                Manage Shelter: {editingCentre.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCentre(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Shelter Operational Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="standby">Standby (Ready to Activate)</option>
                  <option value="open">Open (Admitting Evacuees)</option>
                  <option value="full">Full (At Maximum Capacity)</option>
                  <option value="closed">Closed / Stand Down</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Current Occupancy (Max Capacity: {editingCentre.capacity}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={editingCentre.capacity * 2}
                  value={newOccupancy}
                  onChange={(e) => setNewOccupancy(e.target.value)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Operational Notes & Supply Status:
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. 50 cots deployed, medical officer on duty..."
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCentre(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  Save Shelter Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
