import React, { useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Layers,
  PieChart as PieIcon,
  Flame,
  Shield,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useIncidents } from '../../context/IncidentContext';
import { useCommand } from '../../context/CommandContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

const CATEGORY_COLORS: Record<string, string> = {
  fire: '#ef4444',
  medical: '#ec4899',
  flood_weather: '#06b6d4',
  accident: '#f59e0b',
  crime_security: '#8b5cf6',
  marine_coastal: '#3b82f6',
  infrastructure: '#64748b',
  other: '#94a3b8',
};

export const AnalyticsReportsView: React.FC = () => {
  const { incidents, approvedIncidents, pendingIncidents } = useIncidents();
  const { responseTeams, evacuationCentres } = useCommand();

  // District Breakdown Data
  const districtData = useMemo(() => {
    return BELIZE_DISTRICTS.map((d) => {
      const count = approvedIncidents.filter((i) => i.district === d.id).length;
      return {
        name: d.name.replace(' District', ''),
        incidents: count,
      };
    });
  }, [approvedIncidents]);

  // Category Breakdown Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    approvedIncidents.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.entries(counts).map(([cat, val]) => ({
      name: cat.replace('_', ' ').toUpperCase(),
      value: val,
      color: CATEGORY_COLORS[cat] || '#d4af37',
    }));
  }, [approvedIncidents]);

  // Severity Breakdown Data
  const severityData = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    approvedIncidents.forEach((i) => {
      if (counts[i.severity] !== undefined) counts[i.severity]++;
    });
    return Object.entries(counts).map(([sev, val]) => ({
      name: sev.toUpperCase(),
      value: val,
      color: SEVERITY_COLORS[sev],
    }));
  }, [approvedIncidents]);

  // Export CSV Summary Report
  const handleExportCSV = () => {
    const headers = ['Incident ID', 'Title', 'Category', 'Severity', 'Status', 'District', 'Location', 'Reporter', 'Created At'];
    const rows = incidents.map((i) => [
      `"${i.id}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.severity}"`,
      `"${i.status}"`,
      `"${i.district}"`,
      `"${i.locationName.replace(/"/g, '""')}"`,
      `"${i.reporterName.replace(/"/g, '""')}"`,
      `"${i.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Belize_Alerts_EOC_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeEmergencies = approvedIncidents.filter((i) => i.status !== 'resolved' && i.status !== 'false_alarm');
  const resolvedCount = approvedIncidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              National Incident Analytics & EOC Reports
            </h2>
            <p className="text-[11px] text-slate-400">
              Statistical trends, geographic incident distribution, and operational closure metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#142036] hover:bg-[#1f3050] text-amber-200 hover:text-white border border-[#2b416b] text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Download className="w-4 h-4 text-[#d4af37]" />
            <span>Export CSV Report</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-[#142036] hover:bg-[#1f3050] text-slate-200 hover:text-white border border-[#2b416b] text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Recorded Incidents</span>
          <div className="mt-1 text-2xl font-black text-white font-mono">{incidents.length}</div>
        </div>
        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Verified Emergencies</span>
          <div className="mt-1 text-2xl font-black text-emerald-400 font-mono">{approvedIncidents.length}</div>
        </div>
        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Successfully Resolved</span>
          <div className="mt-1 text-2xl font-black text-cyan-400 font-mono">{resolvedCount}</div>
        </div>
        <div className="bg-[#0b1220] p-3 rounded-xl border border-[#1e2e4a]">
          <span className="text-[10px] font-black uppercase text-slate-400">Awaiting Verification</span>
          <div className="mt-1 text-2xl font-black text-yellow-300 font-mono">{pendingIncidents.length}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* District Distribution Bar Chart */}
        <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-3">
          <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
            <span>Incident Volume by Belize District</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070c17', borderColor: '#2e4370', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="incidents" fill="#d4af37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie Chart */}
        <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-3">
          <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Incidents by Severity Tier</span>
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            {approvedIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No approved incidents to plot.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#070c17', borderColor: '#2e4370', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
