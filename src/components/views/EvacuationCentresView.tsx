import React, { useState, useMemo } from 'react';
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
  Edit2,
  ExternalLink,
  Search,
  Filter,
  Wind,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Building
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useAuth } from '../../context/AuthContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { BelizeDistrict, EvacuationCentre } from '../../types';
import {
  NATIONAL_SHELTERS_2026,
  HURRICANE_SEASON_2026_NAMES,
  NEMO_OFFICIAL_RESOURCES,
  NationalShelter2026
} from '../../data/nationalShelters2026';

export const EvacuationCentresView: React.FC = () => {
  const { evacuationCentres, updateEvacuationCentre } = useCommand();
  const { isAdmin } = useAuth();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [selectedClass, setSelectedClass] = useState<'all' | 'class_b' | 'class_a'>('all');
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showHurricaneNames, setShowHurricaneNames] = useState(false);

  // Edit Shelter Modal State (Admins Only)
  const [editingCentre, setEditingCentre] = useState<NationalShelter2026 | null>(null);
  const [newStatus, setNewStatus] = useState<'open' | 'standby' | 'full' | 'closed'>('standby');
  const [newOccupancy, setNewOccupancy] = useState('0');
  const [newNotes, setNewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Merge official 2026 list with dynamic context overrides if any exist
  const combinedShelters: NationalShelter2026[] = useMemo(() => {
    return NATIONAL_SHELTERS_2026.map((shelter) => {
      const match = evacuationCentres.find((c) => c.id === shelter.id || c.name.toLowerCase() === shelter.name.toLowerCase());
      if (match) {
        return {
          ...shelter,
          status: match.status,
          currentOccupancy: match.currentOccupancy ?? shelter.currentOccupancy,
          notes: match.notes || shelter.notes,
        };
      }
      return shelter;
    });
  }, [evacuationCentres]);

  // Filtered dataset
  const filteredShelters = useMemo(() => {
    return combinedShelters.filter((s) => {
      if (selectedDistrict !== 'all' && s.district !== selectedDistrict) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (wheelchairOnly && !s.isWheelchairAccessible) return false;

      if (selectedClass === 'class_b' && !s.classType.includes('Class B')) return false;
      if (selectedClass === 'class_a' && !s.classType.includes('Class A')) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchComm = s.community.toLowerCase().includes(query);
        const matchAddr = s.address.toLowerCase().includes(query);
        const matchNotes = s.notes.toLowerCase().includes(query);
        const matchTransfer = s.inlandTransferDestination?.toLowerCase().includes(query);
        if (!matchName && !matchComm && !matchAddr && !matchNotes && !matchTransfer) return false;
      }

      return true;
    });
  }, [combinedShelters, selectedDistrict, selectedStatus, selectedClass, wheelchairOnly, searchTerm]);

  // Aggregate statistics
  const totalCapacity = combinedShelters.reduce((sum, c) => sum + c.capacity, 0);
  const totalOccupancy = combinedShelters.reduce((sum, c) => sum + c.currentOccupancy, 0);
  const openCount = combinedShelters.filter((c) => c.status === 'open').length;
  const classBCount = combinedShelters.filter((c) => c.classType.includes('Class B')).length;
  const wheelchairCount = combinedShelters.filter((c) => c.isWheelchairAccessible).length;

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Shelter operational management is restricted to authorized administrators.');
      return;
    }
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

  const statusBadge = (status: NationalShelter2026['status']) => {
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
      {/* Top Banner & Official NEMO Header */}
      <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 text-white flex items-center justify-center shrink-0 border border-cyan-400/40 shadow-lg mt-0.5">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-base sm:text-lg text-white tracking-wide">
                2026 National Hurricane Evacuation Centers Registry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#380714] text-[#f3c853] border border-[#d4af37]/50">
                Official NEMO Publication
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Official evacuation centers and emergency shelters certified by the National Emergency Management Organization (NEMO) across all 6 Belize districts, including Class A, Class B safe havens, and physical disability accessibility.
            </p>
          </div>
        </div>

        {/* Quick Official Links */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={NEMO_OFFICIAL_RESOURCES.nemoLocatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-[#121f36] hover:bg-[#1a2d4f] text-cyan-300 text-xs font-bold border border-cyan-500/40 transition flex items-center gap-1.5 shadow"
          >
            <span>NEMO Evacuation Center Locator</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="tel:936"
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 text-white text-xs font-black shadow-lg transition flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>NEMO Hotline: 936</span>
          </a>
        </div>
      </div>

      {/* 2026 Hurricane Season Naming & Shelter Classification Guide */}
      <div className="bg-[#070d18] rounded-xl border border-[#1e2e4a] p-3.5 text-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182338] pb-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>2026 Atlantic Hurricane Season</span>
            </div>
            <span className="text-[11px] text-slate-400">
              (June 1 – November 30)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHurricaneNames(!showHurricaneNames)}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{showHurricaneNames ? 'Hide 2026 Storm Names' : 'View Official 2026 Storm Names List'}</span>
            {showHurricaneNames ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Hurricane Names Drawer */}
        {showHurricaneNames && (
          <div className="p-3 bg-[#0c1626] rounded-xl border border-cyan-500/30 text-xs space-y-2 animate-in fade-in">
            <div className="text-[11px] font-bold text-cyan-300">
              Official 2026 World Meteorological Organization (WMO) Tropical Cyclone Names for the Atlantic Basin:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HURRICANE_SEASON_2026_NAMES.map((name, idx) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded-lg bg-[#14233c] text-white border border-[#233555] font-mono text-[11px]"
                >
                  <strong className="text-cyan-400 font-bold mr-1">{idx + 1}.</strong> {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Classification Criteria Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded-lg bg-[#0e182a] border border-blue-500/30 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-300">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Class B Shelters (&gt; 110 MPH)</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Engineered safe havens built to withstand winds exceeding 110 MPH (Category 3, 4, and 5 major hurricanes).
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0e182a] border border-amber-500/30 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>Class A Shelters (&lt; 110 MPH)</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Certified for tropical storms and Category 1–2 hurricanes (&lt; 110 MPH). Coastal residents evacuate inland for major storms.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0e182a] border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Accessibility className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wheelchair Accessible</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Facilities with level entry ramps, wide access portals, and ground-floor sanitary facilities for persons with physical disabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Notice for Non-Administrators */}
      {!isAdmin && (
        <div className="bg-[#07111e] border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Public Information Registry:</strong> Real-time shelter statuses, capacity telemetry, and emergency activations are administered exclusively by the National Emergency Operations Centre (NEMO). Citizens have full access to refuge locations, wind classifications, and contact details.
          </span>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Certified Evacuation Centers</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
              {combinedShelters.length}
            </span>
            <span className="text-[10px] text-slate-400">Centers</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Class B Major Safe Havens</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
              {classBCount}
            </span>
            <span className="text-[10px] text-slate-400">&gt; 110 MPH Rated</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Wheelchair Accessible</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {wheelchairCount}
            </span>
            <span className="text-[10px] text-slate-400">Ramps / Access</span>
          </div>
        </div>

        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Refuge Capacity</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {totalCapacity.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Citizens</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a] flex flex-wrap items-center gap-2.5 text-xs">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search village, community, or shelter name..."
            className="w-full bg-[#121c2e] border border-[#233555] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* District Filter */}
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value as any)}
          className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">📍 All Districts</option>
          {BELIZE_DISTRICTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Classification Filter */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value as any)}
          className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">🌪️ All Classifications</option>
          <option value="class_b">🛡️ Class B (&gt;110 MPH Safe Havens)</option>
          <option value="class_a">🏠 Class A (&lt;110 MPH Shelters)</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">Status: All</option>
          <option value="open">Open (Admitting)</option>
          <option value="standby">Standby</option>
          <option value="full">Full Capacity</option>
          <option value="closed">Closed</option>
        </select>

        {/* Wheelchair Accessibility Toggle */}
        <button
          type="button"
          onClick={() => setWheelchairOnly(!wheelchairOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition ${
            wheelchairOnly
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow'
              : 'bg-[#121c2e] text-slate-300 border-[#233555] hover:text-white'
          }`}
        >
          <Accessibility className="w-3.5 h-3.5" />
          <span>Wheelchair Accessible</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400 ml-auto font-bold">
          {filteredShelters.length} Facilities Found
        </span>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredShelters.map((centre) => {
          const occupancyPct = Math.round((centre.currentOccupancy / centre.capacity) * 100);
          const isClassB = centre.classType.includes('Class B');

          return (
            <div
              key={centre.id}
              className={`bg-[#0b1220] rounded-xl border p-4 shadow-lg flex flex-col justify-between space-y-3 transition ${
                isClassB ? 'border-blue-500/40 hover:border-blue-400' : 'border-[#1e2e4a] hover:border-[#2e4370]'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isClassB
                            ? 'bg-blue-950 text-blue-300 border-blue-400'
                            : 'bg-amber-950 text-amber-300 border-amber-500/50'
                        }`}
                      >
                        {centre.classType}
                      </span>

                      {centre.isWheelchairAccessible && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                          <Accessibility className="w-3 h-3" />
                          <span>Accessible</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-white text-sm leading-tight mt-1.5">
                      {centre.name}
                    </h4>

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

                <div className="text-[11px] text-slate-300 mt-2 font-mono">
                  {centre.address}
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-2.5 bg-[#070c17] p-2.5 rounded-lg border border-[#182338] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Capacity Telemetry:</span>
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
                  <div className="flex items-center gap-2 pt-1 border-t border-[#182338] text-[10px] text-slate-300 flex-wrap">
                    {centre.hasGenerator && (
                      <span className="flex items-center gap-0.5 text-amber-300" title="Auxiliary Industrial Generator">
                        <Zap className="w-3 h-3" /> Generator
                      </span>
                    )}
                    {centre.hasWaterReserve && (
                      <span className="flex items-center gap-0.5 text-cyan-300" title="Cistern Water Reserve">
                        <Droplet className="w-3 h-3" /> Water Cistern
                      </span>
                    )}
                    {centre.hasMedicalPost && (
                      <span className="flex items-center gap-0.5 text-red-300" title="First Aid Medical Station">
                        <HeartPulse className="w-3 h-3" /> Medical Post
                      </span>
                    )}
                    {centre.isWheelchairAccessible && (
                      <span className="flex items-center gap-0.5 text-emerald-300" title="Wheelchair Ramp & Level Access">
                        <Accessibility className="w-3 h-3" /> Ramp Access
                      </span>
                    )}
                  </div>
                </div>

                {/* Wind Rating & Transfer Warning */}
                <div className="mt-2 text-[10px] text-slate-300 bg-[#070d18] p-2 rounded-lg border border-[#182338] space-y-1">
                  <div className="font-semibold text-cyan-300">
                    🌪️ {centre.windRating}
                  </div>
                  {centre.inlandTransferDestination && (
                    <div className="text-amber-300 font-bold">
                      ⚠️ Major Hurricane Transfer Destination: {centre.inlandTransferDestination}
                    </div>
                  )}
                </div>

                {/* Coordinator & Contact Info */}
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

              {/* Action Bar (Admin Only) */}
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
                    className="px-2.5 py-1 rounded bg-[#16233b] hover:bg-[#203254] text-amber-200 text-xs font-bold border border-[#273d66] transition flex items-center gap-1 shadow"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Manage Evacuation Center</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Shelter Modal (Admin Only) */}
      {editingCentre && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-[#d4af37] text-white max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  Manage Evacuation Center: {editingCentre.name}
                </h3>
                <span className="text-[10px] text-amber-300 font-mono">
                  {editingCentre.classType} • {editingCentre.district} District
                </span>
              </div>
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
                  Evacuation Center Operational Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="standby">Standby (Pre-Activation Readiness)</option>
                  <option value="open">Open (Actively Receiving Evacuees)</option>
                  <option value="full">Full (Capacity Reached)</option>
                  <option value="closed">Closed / Stand Down</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Current Occupancy (Max Certified Capacity: {editingCentre.capacity}):
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
                  Operational Notes & Supply Telemetry:
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. 50 cots deployed, medical officer on duty, potable water available..."
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
                  Save Evacuation Center Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
