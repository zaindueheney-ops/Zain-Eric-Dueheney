import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useCommand();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (categoryFilter !== 'all' && log.actionCategory !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(term);
      const matchActor = (log.actorName + ' ' + log.actorEmail).toLowerCase().includes(term);
      const matchDetails = log.details.toLowerCase().includes(term);
      if (!matchAction && !matchActor && !matchDetails) return false;
    }
    return true;
  });

  const categoryBadge = (cat: string) => {
    switch (cat) {
      case 'admin':
        return 'bg-[#d4af37] text-slate-950 font-black';
      case 'incident':
        return 'bg-red-950 text-red-300 border border-red-500/50';
      case 'alert':
        return 'bg-amber-950 text-yellow-300 border border-yellow-500/50';
      case 'dispatch':
        return 'bg-blue-950 text-blue-300 border border-blue-500/50';
      case 'system':
        return 'bg-emerald-950 text-emerald-300 border border-emerald-500/50';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-yellow-300 border border-amber-500/40 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Tamper-Resistant Administrative Audit Log
            </h2>
            <p className="text-[11px] text-slate-400">
              Immutable ledger tracking role promotions, incident verifications, emergency dispatches, and public alert broadcasts
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-[#f3c853] font-bold bg-[#141f33] px-3 py-1.5 rounded-xl border border-[#233555]">
          {filteredLogs.length} Events Recorded
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, actor, or details..."
            className="w-full bg-[#121c2e] border border-[#233555] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#121c2e] border border-[#233555] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">All Event Categories</option>
          <option value="admin">Administrator Management</option>
          <option value="incident">Incident Verification</option>
          <option value="alert">Public Alerts</option>
          <option value="dispatch">Field Dispatches</option>
          <option value="system">System Status</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0b1220] rounded-2xl border border-[#1e2e4a] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070c17] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-[#1e2e4a]">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor / Author</th>
                <th className="py-2.5 px-3">Details & Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182338]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No administrative audit events recorded matching filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121b2d] transition">
                    <td className="py-2.5 px-3 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${categoryBadge(log.actionCategory)}`}>
                        {log.actionCategory}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-bold text-white text-xs">{log.action}</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-200 text-[11px]">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorEmail}</div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 text-[11px] leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
