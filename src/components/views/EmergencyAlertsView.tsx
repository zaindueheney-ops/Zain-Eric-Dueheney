import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Send,
  Radio,
  Bell,
  Mail,
  Smartphone,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  Shield,
  FileText,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAdvisories } from '../../context/AdvisoryContext';
import { useAuth } from '../../context/AuthContext';
import { useCommand } from '../../context/CommandContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { AdvisoryUrgency, BelizeDistrict, OfficialAdvisory } from '../../types';

export const EmergencyAlertsView: React.FC = () => {
  const { advisories, addAdvisory, deleteAdvisory } = useAdvisories();
  const { isAdmin, user, profile } = useAuth();
  const { communities } = useCommand();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<AdvisoryUrgency>('warning');
  const [district, setDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [affectedCommunities, setAffectedCommunities] = useState('');
  const [summary, setSummary] = useState('');
  const [safetyInstructions, setSafetyInstructions] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('NEMO Belize & Central Emergency Operations Centre');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    sms: false,
    push: true,
    community: true,
    schools: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAlerts = advisories.filter((a) => a.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    setIsSubmitting(true);
    try {
      const expiresAt = new Date(Date.now() + Number(expiresInHours) * 3600 * 1000).toISOString();
      const commList = affectedCommunities
        ? affectedCommunities.split(',').map((c) => c.trim()).filter(Boolean)
        : undefined;

      await addAdvisory({
        title: title.trim(),
        urgencyLevel,
        district,
        affectedCommunities: commList,
        summary: summary.trim(),
        safetyInstructions: safetyInstructions.trim() || undefined,
        issuingAuthority: issuingAuthority.trim(),
        expiresAt,
        channels,
      });

      setIsCreateModalOpen(false);
      setTitle('');
      setSummary('');
      setSafetyInstructions('');
      setAffectedCommunities('');
    } catch (err: any) {
      alert(`Could not issue alert: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const urgencyBadge = (level: AdvisoryUrgency) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white border-red-400 animate-pulse';
      case 'warning':
        return 'bg-orange-500 text-slate-950 font-black border-amber-300';
      case 'watch':
        return 'bg-amber-400 text-slate-950 font-bold border-yellow-200';
      case 'advisory':
        return 'bg-blue-600 text-white border-blue-400';
      case 'all_clear':
      default:
        return 'bg-emerald-600 text-white border-emerald-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-yellow-300 border border-amber-500/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Early Warning & Public Alert Management
            </h2>
            <p className="text-[11px] text-slate-400">
              National multi-channel broadcast module for severe weather, evacuation notices, and public safety advisories
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-[#8b152e] hover:from-red-500 text-white font-black text-xs border border-[#d4af37] shadow-lg flex items-center gap-2 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Public Alert</span>
          </button>
        )}
      </div>

      {/* Channel Distribution Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex items-center gap-2 text-xs">
          <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-[11px]">In-App Broadcast</div>
            <div className="text-[9px] text-emerald-400 font-bold">● Active (Instant)</div>
          </div>
        </div>

        <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex items-center gap-2 text-xs">
          <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-[11px]">Email Gateway</div>
            <div className="text-[9px] text-cyan-400 font-bold">● Active (NEMO Roster)</div>
          </div>
        </div>

        <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex items-center gap-2 text-xs">
          <Bell className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-[11px]">Push Notices</div>
            <div className="text-[9px] text-amber-400 font-bold">● Active (Mobile/Web)</div>
          </div>
        </div>

        <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex items-center gap-2 text-xs">
          <Users className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-[11px]">Community Liaisons</div>
            <div className="text-[9px] text-purple-400 font-bold">● Active (6 Districts)</div>
          </div>
        </div>

        <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex items-center gap-2 text-xs">
          <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-[11px]">Schools Network</div>
            <div className="text-[9px] text-emerald-400 font-bold">● Active (Ministry)</div>
          </div>
        </div>

        <div className="bg-[#0b1220] p-2.5 rounded-xl border border-[#1e2e4a] flex items-center gap-2 text-xs">
          <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <div className="font-bold text-white text-[11px]">SMS Gateway</div>
            <div className="text-[9px] text-slate-400 font-semibold">○ Ready (Telco Bridge)</div>
          </div>
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-3">
        <h3 className="font-black text-sm text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>Active Public Alerts ({activeAlerts.length})</span>
        </h3>

        {activeAlerts.length === 0 ? (
          <div className="bg-[#0b1220] p-8 rounded-2xl border border-[#1e2e4a] text-center space-y-2">
            <Shield className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Active Emergency Advisories</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All six districts are currently clear of active public warnings. When severe weather or hazard advisories are issued, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.map((adv) => (
              <div
                key={adv.id}
                className="bg-[#0b1220] rounded-2xl border-2 border-[#1e2e4a] hover:border-[#d4af37]/80 p-4 shadow-xl space-y-3 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${urgencyBadge(
                        adv.urgencyLevel
                      )}`}
                    >
                      {adv.urgencyLevel}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(adv.publishedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h4 className="font-black text-sm sm:text-base text-white leading-tight">
                    {adv.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {adv.summary}
                  </p>

                  {adv.safetyInstructions && (
                    <div className="bg-[#070c17] p-2.5 rounded-xl border border-amber-500/30 text-xs text-amber-200 space-y-0.5">
                      <div className="font-bold text-amber-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Public Safety Instructions:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{adv.safetyInstructions}</p>
                    </div>
                  )}

                  {adv.affectedCommunities && adv.affectedCommunities.length > 0 && (
                    <div className="text-[10px] text-slate-400">
                      Affected Communities: <strong className="text-slate-200">{adv.affectedCommunities.join(', ')}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-between text-[11px] text-slate-400">
                  <div className="truncate">
                    Authority: <strong className="text-slate-300">{adv.issuingAuthority || adv.publishedBy}</strong>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove alert "${adv.title}"?`)) {
                          deleteAdvisory(adv.id);
                        }
                      }}
                      className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-white/10 transition"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-red-500 text-white max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Issue Public Early Warning / Alert
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Alert Headline / Title:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Severe Flash Flood Warning for Cayo & Toledo Districts"
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Severity Tier:
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value as AdvisoryUrgency)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="critical">🚨 Critical Life Threat</option>
                    <option value="warning">⚠️ High Warning</option>
                    <option value="watch">👁️ Watch (Preparedness)</option>
                    <option value="advisory">ℹ️ Public Advisory</option>
                    <option value="all_clear">✅ All Clear Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Geographic Jurisdiction:
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as any)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="all">📍 All Belize Nationwide</option>
                    {BELIZE_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Specific Communities Affected (comma separated):
                </label>
                <input
                  type="text"
                  value={affectedCommunities}
                  onChange={(e) => setAffectedCommunities(e.target.value)}
                  placeholder="e.g. San Ignacio, Bullet Tree Falls, Calla Creek, Santa Elena"
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Detailed Situation & Hazard Summary:
                </label>
                <textarea
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the imminent hazard, affected roads, rainfall amounts, or river crest levels..."
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Protective Action & Public Safety Instructions:
                </label>
                <textarea
                  rows={2}
                  value={safetyInstructions}
                  onChange={(e) => setSafetyInstructions(e.target.value)}
                  placeholder="e.g. Move livestock to high ground. Do not cross flooded low-wooden bridges. Shelters open at UB Gym..."
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Issuing Statutory Authority:
                  </label>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Auto-Expire After:
                  </label>
                  <select
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours (Standard)</option>
                    <option value="48">48 Hours</option>
                    <option value="72">72 Hours (3 Days)</option>
                  </select>
                </div>
              </div>

              {/* Channel Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  Distribution Channels:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#070c17] border border-[#1e2e4a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.inApp}
                      onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span className="text-[11px] text-white">In-App Banner</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#070c17] border border-[#1e2e4a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.email}
                      onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span className="text-[11px] text-white">Email Broadcast</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#070c17] border border-[#1e2e4a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.push}
                      onChange={(e) => setChannels({ ...channels, push: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span className="text-[11px] text-white">Push Alert</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#070c17] border border-[#1e2e4a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.community}
                      onChange={(e) => setChannels({ ...channels, community: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span className="text-[11px] text-white">Community Liaisons</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#070c17] border border-[#1e2e4a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.schools}
                      onChange={(e) => setChannels({ ...channels, schools: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span className="text-[11px] text-white">School Principals</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl text-slate-300 hover:bg-[#121c2e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Publishing...' : 'Authorize & Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
