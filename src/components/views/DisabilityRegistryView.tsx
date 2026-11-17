import React, { useState, useMemo } from 'react';
import {
  Accessibility,
  MapPin,
  Plus,
  Search,
  Home,
  Phone,
  Shield,
  Zap,
  CheckCircle2,
  Clock,
  Navigation,
  Eye,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useDisabilityRegistry,
  DISABILITY_TYPE_OPTIONS,
  ASSISTANCE_PRIORITY_OPTIONS,
} from '../../context/DisabilityContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { BelizeGoogleDisabilityMap } from '../BelizeGoogleDisabilityMap';
import { DisabilityRegistrationModal } from '../DisabilityRegistrationModal';
import { DisabilityDetailModal } from '../DisabilityDetailModal';
import {
  BelizeDistrict,
  DisabilityType,
  DisabilityVerificationStatus,
  DisabilityRegistration,
} from '../../types';

export const DisabilityRegistryView: React.FC = () => {
  const { isAdmin, isResponder } = useAuth();
  const {
    registrations,
    loading,
    selectedRegistration,
    setSelectedRegistration,
  } = useDisabilityRegistry();

  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState<BelizeDistrict | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DisabilityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DisabilityVerificationStatus | 'all'>('all');

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DisabilityRegistration | null>(null);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinDistrict, setPinDistrict] = useState<BelizeDistrict | undefined>(undefined);
  const [detailModalRecord, setDetailModalRecord] = useState<DisabilityRegistration | null>(null);

  const canSeeAllRegistry = isAdmin || isResponder;

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      if (districtFilter !== 'all' && reg.district !== districtFilter) return false;
      if (typeFilter !== 'all' && reg.disabilityType !== typeFilter) return false;
      if (statusFilter !== 'all' && reg.verificationStatus !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = reg.fullName.toLowerCase().includes(q);
        const matchPhone = reg.phone.toLowerCase().includes(q);
        const matchAddr = reg.addressDescription.toLowerCase().includes(q);
        const matchDetails = reg.disabilityDetails.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddr && !matchDetails) return false;
      }
      return true;
    });
  }, [registrations, districtFilter, typeFilter, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const critical = registrations.filter(
      (r) => r.assistancePriority === 'critical_life_support' || r.requiresMedicalPower
    ).length;
    const transport = registrations.filter((r) => r.requiresAccessibleTransport).length;
    const verified = registrations.filter((r) => r.verificationStatus === 'verified').length;
    return { total, critical, transport, verified };
  }, [registrations]);

  const openNewRegistration = (
    coords?: { lat: number; lng: number } | null,
    district?: BelizeDistrict
  ) => {
    setEditingRecord(null);
    setPinCoords(coords || null);
    setPinDistrict(district);
    setIsRegModalOpen(true);
  };

  const openEditRegistration = (reg: DisabilityRegistration) => {
    setDetailModalRecord(null);
    setEditingRecord(reg);
    setPinCoords({ lat: reg.latitude, lng: reg.longitude });
    setPinDistrict(reg.district);
    setIsRegModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Section Header */}
      <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/90 text-sky-400 border border-[#d4af37]/50 flex items-center justify-center shrink-0">
            <Accessibility className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-white leading-tight">
              Disability Registry &amp; Household Location Map
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {canSeeAllRegistry
                ? 'Administrator & Responder GIS directory showing registered persons with disabilities, disability types, house photos, and pinned residence coordinates across Belize.'
                : 'Register a person with a disability, upload a photo of the house, and pin the exact residence on the map for priority NEMO and emergency responder assistance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openNewRegistration(null, undefined)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 text-xs font-black shadow-lg transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Register Disability &amp; Mark Pin</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice for Non-Admin Citizens */}
      {!canSeeAllRegistry && (
        <div className="bg-[#0b1220] px-4 py-3 rounded-xl border border-sky-500/40 flex items-center gap-3 text-xs text-slate-300">
          <Lock className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            <strong>Privacy Protected:</strong> Your household pin, disability details, and house
            photograph are strictly visible only to you and authorized Belize Emergency
            Administrators / Responders. Tap anywhere on the map below to pin a residence.
          </span>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0e1626] rounded-xl border border-[#233555] p-3.5">
          <div className="text-[11px] font-bold text-slate-400">
            {canSeeAllRegistry ? 'Total Registered Residents' : 'My Registered Profiles'}
          </div>
          <div className="mt-1.5 text-2xl font-black text-white font-mono tabular-nums">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Active Belize GIS pins</div>
        </div>

        <div className="bg-[#0e1626] rounded-xl border border-[#233555] p-3.5">
          <div className="text-[11px] font-bold text-slate-400">
            Critical Life Support / Power
          </div>
          <div className="mt-1.5 text-2xl font-black text-red-400 font-mono tabular-nums">
            {stats.critical}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Priority medical backup</div>
        </div>

        <div className="bg-[#0e1626] rounded-xl border border-[#233555] p-3.5">
          <div className="text-[11px] font-bold text-slate-400">Accessible Transport Needed</div>
          <div className="mt-1.5 text-2xl font-black text-sky-400 font-mono tabular-nums">
            {stats.transport}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Wheelchair / lift evacuation</div>
        </div>

        <div className="bg-[#0e1626] rounded-xl border border-[#233555] p-3.5">
          <div className="text-[11px] font-bold text-slate-400">Verified House Locations</div>
          <div className="mt-1.5 text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {stats.verified}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Confirmed pin &amp; house photo</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by resident name, phone, address, or disability details..."
            className="w-full bg-[#121c2e] border border-[#233555] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">All Six Districts</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">All Disability Types</option>
            {DISABILITY_TYPE_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Review</option>
            <option value="needs_update">Needs Update</option>
          </select>
        </div>
      </div>

      {/* Main Split View: 8-Column Map + 4-Column Registered Households Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Map Column */}
        <div className="lg:col-span-8 space-y-2">
          <div className="rounded-2xl overflow-hidden border-2 border-[#1e2e4a] shadow-2xl relative">
            <BelizeGoogleDisabilityMap
              registrations={filteredRegistrations}
              selectedRegistrationId={selectedRegistration?.id}
              onSelectRegistration={(reg) => {
                setSelectedRegistration(reg);
                setDetailModalRecord(reg);
              }}
              onPinToRegister={(coords, district) => {
                openNewRegistration(coords, district);
              }}
              className="h-[540px] sm:h-[630px] w-full"
            />
          </div>

          {/* Map Legend */}
          <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-[#f3c853]">Pin Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] border border-white" />
                Medical / Oxygen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] border border-white" />
                Mobility / Wheelchair
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] border border-white" />
                Visual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] border border-white" />
                Hearing / Cognitive
              </span>
            </div>
            <div className="text-slate-400">
              Click anywhere on Belize to drop a house pin and register.
            </div>
          </div>
        </div>

        {/* Registered Households Stream Column */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a] flex items-center justify-between">
            <div>
              <h3 className="font-black text-xs sm:text-sm text-white">
                {canSeeAllRegistry ? 'Registered Households Directory' : 'Your Registered Households'}
              </h3>
              <p className="text-[10px] text-slate-400">
                Click any household to locate on map &amp; view house photo
              </p>
            </div>
            <span className="text-xs font-mono text-[#f3c853] font-bold tabular-nums">
              {filteredRegistrations.length} Records
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-xl bg-[#0b1220] border border-[#1e2e4a] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="bg-[#0b1220] p-6 rounded-2xl border border-[#1e2e4a] text-center space-y-3">
                <div className="w-11 h-11 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/40">
                  <Accessibility className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Disability Registrations Found</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Tap any location on the Belize map or click the button below to register a
                    resident with a house photo and pinned coordinates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openNewRegistration(null, undefined)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 font-black text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register First Household</span>
                </button>
              </div>
            ) : (
              filteredRegistrations.map((reg) => {
                const typeMeta = DISABILITY_TYPE_OPTIONS.find((t) => t.id === reg.disabilityType);
                const priorityMeta = ASSISTANCE_PRIORITY_OPTIONS.find(
                  (p) => p.id === reg.assistancePriority
                );
                const isSelected = selectedRegistration?.id === reg.id;

                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedRegistration(reg)}
                    className={`bg-[#0b1220] rounded-xl border p-3 cursor-pointer transition space-y-2.5 ${
                      isSelected
                        ? 'border-[#d4af37] ring-1 ring-[#d4af37]/50 bg-[#101a2e]'
                        : 'border-[#1e2e4a] hover:border-[#2e4370]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* House Photo Thumbnail */}
                      {reg.houseImageUrl ? (
                        <img
                          src={reg.houseImageUrl}
                          alt={`House of ${reg.fullName}`}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-lg object-cover border border-[#233555] shrink-0 bg-slate-900"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-[#070c17] border border-[#233555] flex flex-col items-center justify-center text-slate-500 shrink-0">
                          <Home className="w-5 h-5" />
                          <span className="text-[9px] mt-1">No Photo</span>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        {/* Static Metadata (Unboxed with separators) */}
                        <div className="flex items-center gap-1.5 text-[11px] font-bold flex-wrap">
                          <span style={{ color: typeMeta?.pinColor || '#38bdf8' }}>
                            {typeMeta?.shortLabel || reg.disabilityType}
                          </span>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span className="text-slate-300">{reg.district}</span>
                          <span className="text-slate-600" aria-hidden="true">·</span>
                          <span
                            className={
                              reg.verificationStatus === 'verified'
                                ? 'text-emerald-400'
                                : reg.verificationStatus === 'needs_update'
                                ? 'text-orange-400'
                                : 'text-amber-300'
                            }
                          >
                            {reg.verificationStatus === 'verified'
                              ? 'Verified'
                              : reg.verificationStatus === 'needs_update'
                              ? 'Update'
                              : 'Pending'}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-white truncate mt-0.5">
                          {reg.fullName}
                        </h4>

                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                          {reg.addressDescription}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5 font-mono tabular-nums">
                          <span>{reg.phone}</span>
                          {reg.requiresMedicalPower && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-red-400 font-sans font-bold">Power/O₂</span>
                            </>
                          )}
                          {reg.requiresAccessibleTransport && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-sky-400 font-sans font-bold">Lift Van</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#182338] flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-400 truncate">
                        Priority:{' '}
                        <strong className="text-slate-200">
                          {priorityMeta?.label || reg.assistancePriority}
                        </strong>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRegistration(reg);
                          setDetailModalRecord(reg);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#16233b] hover:bg-[#1f3152] text-[#f3c853] font-bold border border-[#2a3f66] flex items-center gap-1 shrink-0 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect House</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Registration / Edit Modal */}
      <DisabilityRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => {
          setIsRegModalOpen(false);
          setEditingRecord(null);
          setPinCoords(null);
          setPinDistrict(undefined);
        }}
        editingRecord={editingRecord}
        initialCoordinates={pinCoords}
        initialDistrict={pinDistrict}
        onSuccess={(id) => {
          const found = registrations.find((r) => r.id === id);
          if (found) setSelectedRegistration(found);
        }}
      />

      {/* Detail Inspection & Admin Verification Modal */}
      <DisabilityDetailModal
        registration={detailModalRecord}
        onClose={() => setDetailModalRecord(null)}
        onEdit={(reg) => openEditRegistration(reg)}
      />
    </div>
  );
};
