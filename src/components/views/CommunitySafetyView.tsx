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
  LifeBuoy
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useIncidents } from '../../context/IncidentContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { ParticipatingCommunity, BelizeDistrict } from '../../types';

export const CommunitySafetyView: React.FC = () => {
  const { communities, evacuationCentres } = useCommand();
  const { approvedIncidents } = useIncidents();

  const [selectedDistrict, setSelectedDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredCommunities = communities.filter((c) => {
    if (selectedDistrict !== 'all' && c.district !== selectedDistrict) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(term);
      const matchOfficer = c.liaisonOfficer.toLowerCase().includes(term);
      if (!matchName && !matchOfficer) return false;
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
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Community Safety & Preparedness Network
            </h2>
            <p className="text-[11px] text-slate-400">
              Grassroots community liaisons, local hazard vulnerability tracking, and designated safe havens across Belize
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as any)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Districts ({communities.length})</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Community Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCommunities.map((comm) => {
          const activeInc = getActiveCommunityIncidents(comm.name, comm.district);
          const vulnerabilityColor =
            comm.vulnerabilityLevel === 'severe'
              ? 'bg-red-950 text-red-300 border-red-500/50'
              : comm.vulnerabilityLevel === 'high'
              ? 'bg-orange-950 text-orange-300 border-orange-500/50'
              : 'bg-amber-950 text-yellow-300 border-amber-500/50';

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
                    <span>Normal Local Conditions</span>
                  </div>
                )}

                {/* Details Box */}
                <div className="mt-2.5 bg-[#070c17] p-2.5 rounded-lg border border-[#182338] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Est. Population:</span>
                    <span className="text-white font-mono">{comm.populationEstimate.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Liaison Officer:</span>
                    <span className="text-slate-200 font-bold">{comm.liaisonOfficer}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Contact:</span>
                    <a href={`tel:${comm.liaisonPhone}`} className="text-emerald-300 font-mono hover:underline">
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
                  <span>Shelter: <strong>{comm.nearestShelter}</strong></span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
