import React, { useState } from 'react';
import {
  Users,
  MapPin,
  Shield,
  Phone,
  AlertTriangle,
  Home,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Flame,
  LifeBuoy,
  Search,
  Building2,
  Mail,
  Compass,
  Radio,
  Globe
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useIncidents } from '../../context/IncidentContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import {
  NEMO_DISTRICT_COORDINATORS,
  NEMO_AFFILIATED_SERVICES,
  NemoCoordinator
} from '../../data/nemoCoordinators';
import { ParticipatingCommunity, BelizeDistrict } from '../../types';

type SafetySubTab = 'coordinators' | 'communities' | 'resources';

export const CommunitySafetyView: React.FC = () => {
  const { communities, evacuationCentres } = useCommand();
  const { approvedIncidents } = useIncidents();

  const [activeSubTab, setActiveSubTab] = useState<SafetySubTab>('coordinators');
  const [selectedDistrict, setSelectedDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [search, setSearch] = useState('');

  // Filter Coordinators
  const filteredCoordinators = NEMO_DISTRICT_COORDINATORS.filter((coord) => {
    if (selectedDistrict !== 'all' && coord.district !== selectedDistrict) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = coord.name.toLowerCase().includes(q);
      const matchPost = coord.post.toLowerCase().includes(q);
      const matchPhone = coord.contactNumber.includes(q) || (coord.officeNumber && coord.officeNumber.includes(q));
      const matchJurisdiction = coord.jurisdiction.toLowerCase().includes(q);
      if (!matchName && !matchPost && !matchPhone && !matchJurisdiction) return false;
    }
    return true;
  });

  // Filter Communities
  const filteredCommunities = communities.filter((c) => {
    if (selectedDistrict !== 'all' && c.district !== selectedDistrict) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(term);
      const matchOfficer = c.liaisonOfficer.toLowerCase().includes(term);
      const matchHazards = c.primaryHazards.some((h) => h.toLowerCase().includes(term));
      if (!matchName && !matchOfficer && !matchHazards) return false;
    }
    return true;
  });

  const getActiveCommunityIncidents = (communityName: string, district: BelizeDistrict) => {
    return approvedIncidents.filter(
      (inc) =>
        inc.district === district &&
        (inc.locationName.toLowerCase().includes(communityName.toLowerCase()) ||
          inc.title.toLowerCase().includes(communityName.toLowerCase())) &&
        inc.status !== 'resolved' &&
        inc.status !== 'false_alarm'
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-sm sm:text-base text-white tracking-tight">
                National Emergency Community Safety & Coordination Network
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                NEMO Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-3xl">
              Official District Emergency Coordinators, Regional Command, grassroots village liaisons, and early hazard monitoring network for the nation of Belize.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#070c17] p-1 rounded-xl border border-[#1e293b] self-start lg:self-center">
          <button
            type="button"
            onClick={() => setActiveSubTab('coordinators')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'coordinators'
                ? 'bg-[#d4af37] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>NEMO Coordinators</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-mono">
              {NEMO_DISTRICT_COORDINATORS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('communities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'communities'
                ? 'bg-[#d4af37] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Community Zones</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-mono">
              {communities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('resources')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'resources'
                ? 'bg-[#d4af37] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Regional Portals</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeSubTab === 'coordinators'
                ? 'Search coordinator name, post, phone...'
                : 'Search community, hazards, liaison...'
            }
            className="w-full bg-[#121c2e] border border-[#233555] rounded-xl pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-slate-400 text-[11px] hidden sm:inline">District:</span>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">All Six Districts</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUB-TAB 1: OFFICIAL NEMO DISTRICT & REGIONAL COORDINATORS */}
      {activeSubTab === 'coordinators' && (
        <div className="space-y-4">
          {/* Regional Commanders Highlight Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NEMO_DISTRICT_COORDINATORS.filter((c) => c.isRegional).map((reg) => (
              <div
                key={reg.id}
                className="bg-gradient-to-br from-[#121c2e] to-[#0a1220] rounded-2xl border-2 border-[#d4af37]/60 p-4 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-[#d4af37] text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Regional Command {reg.region}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center shrink-0 text-[#f3c853]">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-white text-base leading-tight">{reg.name}</h3>
                    <div className="text-[11px] font-bold text-[#f3c853] uppercase mt-0.5">
                      {reg.post}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{reg.jurisdiction}</span>
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-[#1e2e4a] flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${reg.contactNumber}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Mobile: {reg.contactNumber}</span>
                      </a>

                      {reg.officeNumber && (
                        <a
                          href={`tel:${reg.officeNumber.split('/')[0].trim()}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#182338] hover:bg-[#233555] text-slate-200 text-xs border border-[#2a3d5e] transition"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Office: {reg.officeNumber}</span>
                        </a>
                      )}

                      {reg.email && (
                        <a
                          href={`mailto:${reg.email}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#182338] hover:bg-[#233555] text-[#d4af37] text-xs border border-[#2a3d5e] transition"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* District Emergency Coordinators Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>NEMO District Emergency Coordinators Directory ({filteredCoordinators.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Direct Emergency Response Dispatch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCoordinators.map((coord) => {
                const isReg = coord.isRegional;
                return (
                  <div
                    key={coord.id}
                    className={`bg-[#0b1220] rounded-xl border ${
                      isReg ? 'border-[#d4af37]/60 shadow-lg' : 'border-[#1e2e4a] hover:border-[#2a3d5e]'
                    } p-3.5 shadow-md flex flex-col justify-between space-y-3 transition`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">{coord.name}</h4>
                          <div className="text-[11px] text-[#f3c853] font-bold mt-0.5">
                            {coord.post}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                            <span>{coord.district} District</span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 border ${
                            coord.region === 'North'
                              ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                              : coord.region === 'Central'
                              ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {coord.region} Region
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-2 bg-[#070c17] p-2 rounded-lg border border-[#182338]">
                        <strong className="text-slate-400">Jurisdiction:</strong> {coord.jurisdiction}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#1e2e4a] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Contact Mobile:</span>
                        <a
                          href={`tel:${coord.contactNumber}`}
                          className="text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{coord.contactNumber}</span>
                        </a>
                      </div>

                      {coord.officeNumber && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Office Phone:</span>
                          <a
                            href={`tel:${coord.officeNumber.split('/')[0].trim()}`}
                            className="text-cyan-400 font-mono text-[11px] hover:underline"
                          >
                            {coord.officeNumber}
                          </a>
                        </div>
                      )}

                      {coord.email && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Email:</span>
                          <a
                            href={`mailto:${coord.email}`}
                            className="text-[#d4af37] text-[11px] hover:underline truncate max-w-[170px]"
                          >
                            {coord.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PARTICIPATING COMMUNITIES & LOCAL RISK PROFILES */}
      {activeSubTab === 'communities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCommunities.map((comm) => {
            const activeInc = getActiveCommunityIncidents(comm.name, comm.district);
            const vulnerabilityColor =
              comm.vulnerabilityLevel === 'severe'
                ? 'bg-red-950 text-red-300 border-red-500/50'
                : comm.vulnerabilityLevel === 'high'
                ? 'bg-orange-950 text-orange-300 border-orange-500/50'
                : comm.vulnerabilityLevel === 'moderate'
                ? 'bg-amber-950 text-yellow-300 border-amber-500/50'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/50';

            return (
              <div
                key={comm.id}
                className="bg-[#0b1220] rounded-xl border border-[#1e2e4a] hover:border-[#2e4370] p-4 shadow-lg flex flex-col justify-between space-y-3 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{comm.name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{comm.district} District</span>
                      </p>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${vulnerabilityColor}`}
                    >
                      {comm.vulnerabilityLevel} Vulnerability
                    </span>
                  </div>

                  {/* Active Incidents Banner in Community */}
                  {activeInc.length > 0 ? (
                    <div className="mt-2.5 bg-red-950/80 p-2 rounded-lg border border-red-500/50 text-xs text-red-200">
                      <div className="flex items-center gap-1 font-bold text-red-300 text-[10px] uppercase">
                        <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        <span>{activeInc.length} Active Incident(s) in Community</span>
                      </div>
                      <div className="text-[11px] font-semibold truncate text-white mt-0.5">
                        {activeInc[0].title}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Normal Local Readiness</span>
                    </div>
                  )}

                  {/* Details Box */}
                  <div className="mt-2.5 bg-[#070c17] p-2.5 rounded-lg border border-[#182338] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Est. Population:</span>
                      <span className="text-white font-mono font-bold">{comm.populationEstimate.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-[11px] pt-1 border-t border-[#182338]">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Designated Liaison / Coordinator:</span>
                      <span className="text-slate-200 font-bold mt-0.5">{comm.liaisonOfficer}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Emergency Phone:</span>
                      <a href={`tel:${comm.liaisonPhone.split(' ')[0]}`} className="text-emerald-300 font-mono hover:underline font-bold">
                        {comm.liaisonPhone}
                      </a>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-[#182338]">
                      Primary Hazards: <strong className="text-slate-300">{comm.primaryHazards.join(', ')}</strong>
                    </div>
                  </div>
                </div>

                {/* Nearest Shelter Footer */}
                <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-cyan-400" />
                    <span>Designated Shelter: <strong className="text-white">{comm.nearestShelter}</strong></span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 3: NEMO AFFILIATED AGENCIES & REGIONAL RESOURCES */}
      {activeSubTab === 'resources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {NEMO_AFFILIATED_SERVICES.map((serv) => (
              <a
                key={serv.name}
                href={serv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] hover:border-[#d4af37]/70 shadow-lg flex flex-col justify-between group transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#182338] text-[#d4af37] font-mono font-bold text-[10px] border border-[#2a3d5e]">
                      {serv.acronym}
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#d4af37] transition" />
                  </div>

                  <h3 className="font-bold text-white text-sm mt-2 group-hover:text-[#f3c853] transition">
                    {serv.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {serv.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1e2e4a] flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono text-cyan-400 truncate max-w-[240px]">{serv.url}</span>
                  <span className="text-[#d4af37] font-bold group-hover:underline flex items-center gap-1">
                    Open Portal <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* NEMO Official Contact Information Footer Banner */}
          <div className="bg-[#0c1424] p-4 rounded-2xl border border-[#233555] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white">National Emergency Management Organization (NEMO)</div>
                <div className="text-[11px] text-slate-400">
                  National Headquarters: NEMO Building, City of Belmopan, Cayo District, Belize
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:936"
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>NEMO Emergency Hotline: 936</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Copyright Citation Footer */}
      <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-[#152033]">
        Data Source: National Emergency Management Organization (NEMO) Belize • Copyright © 2026 NEMO.
      </div>
    </div>
  );
};
