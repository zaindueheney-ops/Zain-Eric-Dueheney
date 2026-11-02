import React from 'react';
import { Filter, RefreshCw, X } from 'lucide-react';
import { BelizeDistrict, EmergencyCategory, EmergencySeverity } from '../types';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';
import { useIncidents } from '../context/IncidentContext';

export const IncidentFilterBar: React.FC = () => {
  const { filters, setFilters, filteredIncidents, approvedIncidents } = useIncidents();

  const handleResetFilters = () => {
    setFilters({
      district: 'all',
      category: 'all',
      severity: 'all',
      status: 'all',
      search: '',
    });
  };

  const isFiltered =
    filters.district !== 'all' ||
    filters.category !== 'all' ||
    filters.severity !== 'all' ||
    filters.status !== 'all';

  const activeApprovedCount = approvedIncidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'false_alarm'
  ).length;

  const resolvedApprovedCount = approvedIncidents.filter(
    (i) => i.status === 'resolved'
  ).length;

  return (
    <div className="bg-[#2a0610] p-2.5 sm:p-3 rounded-2xl border border-[#d4af37]/50 shadow-md space-y-2 text-white">
      {/* Quick Status Pills & District/Category Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-[#1a030a] p-1 rounded-xl text-xs font-bold border border-[#841c34]">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, status: 'all' }))}
            className={`px-3 py-1 rounded-lg transition text-xs ${
              filters.status === 'all'
                ? 'bg-[#d4af37] text-slate-950 shadow font-black'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            All ({approvedIncidents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, status: 'active' }))}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 text-xs ${
              filters.status === 'active'
                ? 'bg-red-600 text-white shadow font-black'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
            Active ({activeApprovedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, status: 'resolved' }))}
            className={`px-3 py-1 rounded-lg transition text-xs ${
              filters.status === 'resolved'
                ? 'bg-emerald-600 text-white shadow font-black'
                : 'text-amber-200/80 hover:text-white'
            }`}
          >
            Resolved ({resolvedApprovedCount})
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs flex-1 justify-end">
          {/* District Dropdown */}
          <select
            value={filters.district}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                district: e.target.value as BelizeDistrict | 'all',
              }))
            }
            className="px-2.5 py-1.5 rounded-lg bg-[#1c0309] border border-[#841c34] text-xs font-bold text-amber-200 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">📍 All Districts (6)</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Severity Dropdown */}
          <select
            value={filters.severity}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                severity: e.target.value as EmergencySeverity | 'all',
              }))
            }
            className="px-2.5 py-1.5 rounded-lg bg-[#1c0309] border border-[#841c34] text-xs font-bold text-amber-200 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">⚠️ All Severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                category: e.target.value as EmergencyCategory | 'all',
              }))
            }
            className="px-2.5 py-1.5 rounded-lg bg-[#1c0309] border border-[#841c34] text-xs font-bold text-amber-200 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">📋 All Types</option>
            <option value="fire">Fire & Rescue</option>
            <option value="medical">Medical</option>
            <option value="accident">Traffic Accident</option>
            <option value="flood_weather">Flood & Weather</option>
            <option value="crime_security">Police & Security</option>
            <option value="marine_coastal">Coast Guard</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="other">Other Hazard</option>
          </select>

          {/* Clear Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2 py-1 text-xs font-bold text-red-400 hover:text-red-300 hover:underline"
            >
              Reset
            </button>
          )}

          <span className="text-[11px] text-amber-200/70 font-mono">
            ({filteredIncidents.length} shown)
          </span>
        </div>
      </div>
    </div>
  );
};
