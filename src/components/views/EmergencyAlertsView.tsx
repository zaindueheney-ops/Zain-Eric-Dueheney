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
  ChevronRight,
  Upload,
  Download,
  Eye,
  X,
  FileCheck,
  Link as LinkIcon,
  Search,
  Filter,
  Image as ImageIcon
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
  const [publicationUrl, setPublicationUrl] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    sms: false,
    push: true,
    community: true,
    schools: false,
  });

  // File Upload State (PDF or Image)
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);

  // Inspector Modal for attached PDF or Image
  const [viewingFileAdvisory, setViewingFileAdvisory] = useState<OfficialAdvisory | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [filterHasPdf, setFilterHasPdf] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Handle File Selection (PDF or Image)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (Max 5MB for storage & data URL reliability)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds 5MB limit. Please upload a compressed document.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/');

    if (!isPdf && !isImg) {
      setFileError('Unsupported file type. Please upload a PDF document or image (.png, .jpg).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileUrl(reader.result);
        setFileType(isPdf ? 'pdf' : 'image');
        setFileName(file.name);
        setFileSize((file.size / 1024).toFixed(1) + ' KB');
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read file from disk. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setFileUrl(null);
    setFileType(null);
    setFileName('');
    setFileSize('');
    setFileError(null);
  };

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
        publicationUrl: publicationUrl.trim() || undefined,
        fileUrl: fileUrl || undefined,
        fileType: fileType || undefined,
        fileName: fileName || undefined,
        channels,
      });

      setSuccessToast(`✓ Official Advisory "${title.trim()}" published successfully.`);
      setTimeout(() => setSuccessToast(null), 5000);

      // Reset Form
      setIsCreateModalOpen(false);
      setTitle('');
      setSummary('');
      setSafetyInstructions('');
      setAffectedCommunities('');
      setPublicationUrl('');
      handleClearFile();
    } catch (err: any) {
      alert(`Could not issue alert: ${err.message || err}`);
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

  // Filtered Advisories
  const activeAlerts = advisories.filter((adv) => {
    if (!adv.active) return false;
    if (selectedUrgency !== 'all' && adv.urgencyLevel !== selectedUrgency) return false;
    if (selectedDistrict !== 'all' && adv.district !== selectedDistrict) return false;
    if (filterHasPdf && !(adv.fileUrl && adv.fileType === 'pdf')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = adv.title.toLowerCase().includes(q);
      const matchSummary = adv.summary.toLowerCase().includes(q);
      const matchAuth = (adv.issuingAuthority || adv.publishedBy).toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchAuth) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-emerald-950/90 text-emerald-200 border border-emerald-500/60 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 text-yellow-300 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              <span>Early Warning & Public Alert Management</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14233c] text-[#f3c853] border border-[#233555]">
                Official Advisories
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              National multi-channel broadcasts for severe weather, evacuation notices, PDF bulletins, and statutory advisories
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-[#8b152e] to-[#600b1d] hover:from-red-500 hover:to-[#8b152e] text-white font-black text-xs border border-[#d4af37] shadow-lg flex items-center gap-2 transition hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-yellow-300" />
            <span>Issue Public Alert & Bulletin</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1220] p-3 rounded-2xl border border-[#1e2e4a] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search advisories or authority..."
              className="bg-[#121c2e] border border-[#233555] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">All Urgency Levels</option>
            <option value="critical">🚨 Critical</option>
            <option value="warning">⚠️ Warning</option>
            <option value="watch">👁️ Watch</option>
            <option value="advisory">ℹ️ Advisory</option>
            <option value="all_clear">✅ All Clear</option>
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">All Districts</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* PDF Attachment Toggle */}
          <button
            type="button"
            onClick={() => setFilterHasPdf(!filterHasPdf)}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
              filterHasPdf
                ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                : 'bg-[#121c2e] border-[#233555] text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>With PDF Bulletin</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Showing <strong className="text-white">{activeAlerts.length}</strong> of {advisories.length} advisories
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-3">
        {activeAlerts.length === 0 ? (
          <div className="bg-[#0b1220] p-8 rounded-2xl border border-[#1e2e4a] text-center space-y-2">
            <Shield className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-sm">No Matching Emergency Advisories</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are no active public warnings matching your search criteria. When new advisories are issued, they persist here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeAlerts.map((adv) => (
              <div
                key={adv.id}
                className="bg-[#0b1220] rounded-2xl border-2 border-[#1e2e4a] hover:border-[#d4af37]/80 p-4 sm:p-5 shadow-xl space-y-3.5 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${urgencyBadge(
                          adv.urgencyLevel
                        )}`}
                      >
                        {adv.urgencyLevel}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#131f33] text-amber-300 border border-[#233555]">
                        {adv.district === 'all' ? 'National (All Districts)' : `${adv.district} District`}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(adv.publishedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-black text-sm sm:text-base text-white leading-tight">
                    {adv.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {adv.summary}
                  </p>

                  {/* Safety Instructions */}
                  {adv.safetyInstructions && (
                    <div className="bg-[#070c17] p-3 rounded-xl border border-amber-500/30 text-xs text-amber-200 space-y-1">
                      <div className="font-bold text-amber-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Public Safety & Protective Action:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{adv.safetyInstructions}</p>
                    </div>
                  )}

                  {/* Affected Communities */}
                  {adv.affectedCommunities && adv.affectedCommunities.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      Affected Communities: <strong className="text-slate-200">{adv.affectedCommunities.join(', ')}</strong>
                    </div>
                  )}

                  {/* External Publication Link Display */}
                  {adv.publicationUrl && (
                    <div className="pt-1">
                      <a
                        href={adv.publicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14233c] hover:bg-[#1d3356] border border-[#2a4575] text-[#d4af37] text-xs font-bold transition group shadow-sm"
                        title="Visit Official Publication Source"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span className="truncate max-w-[260px]">Official Publication Link</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* PDF / Image Attachment Display */}
                  {(adv.fileUrl || adv.fileName) && (
                    <div className="pt-1">
                      {adv.fileType === 'pdf' ? (
                        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center justify-between gap-3 shadow-inner">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-red-600/30 text-red-300 border border-red-500/50 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block">
                                Official PDF Bulletin
                              </span>
                              <span className="text-xs font-bold text-white truncate block">
                                {adv.fileName || 'Official_Advisory_Bulletin.pdf'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {adv.fileUrl ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setViewingFileAdvisory(adv)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#1a2942] hover:bg-[#283f66] text-[#d4af37] text-xs font-bold transition flex items-center gap-1"
                                  title="Inspect PDF Document"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <a
                                  href={adv.fileUrl}
                                  download={adv.fileName || 'advisory.pdf'}
                                  className="p-1.5 rounded-lg bg-[#1a2942] hover:bg-[#283f66] text-slate-300 hover:text-white transition"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </>
                            ) : adv.publicationUrl ? (
                              <a
                                href={adv.publicationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-[#1a2942] hover:bg-[#283f66] text-[#d4af37] text-xs font-bold transition flex items-center gap-1"
                                title="Open Official Publication"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open PDF Source</span>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[#121c2e] border border-[#233555] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {adv.fileUrl ? (
                              <img
                                src={adv.fileUrl}
                                alt={adv.fileName || 'Bulletin image'}
                                className="w-10 h-10 rounded-lg object-cover border border-[#2e456e]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                                Official Image Bulletin
                              </span>
                              <span className="text-xs font-bold text-white truncate block">
                                {adv.fileName || 'Bulletin_Chart.jpg'}
                              </span>
                            </div>
                          </div>

                          {adv.fileUrl ? (
                            <button
                              type="button"
                              onClick={() => setViewingFileAdvisory(adv)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#1a2942] hover:bg-[#283f66] text-[#d4af37] text-xs font-bold transition flex items-center gap-1 shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          ) : adv.publicationUrl ? (
                            <a
                              href={adv.publicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-[#1a2942] hover:bg-[#283f66] text-[#d4af37] text-xs font-bold transition flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-[#1e2e4a] flex items-center justify-between text-[11px] text-slate-400">
                  <div className="truncate">
                    Authority: <strong className="text-slate-300">{adv.issuingAuthority || adv.publishedBy}</strong>
                  </div>

                  {isAdmin && advisories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove alert "${adv.title}"?`)) {
                          deleteAdvisory(adv.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/10 transition"
                      title="Delete Alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE PUBLIC ALERT & BULLETIN (WITH PDF UPLOAD & LINK) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-red-500/80 text-white max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Issue Public Early Warning, Advisory & PDF Bulletin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Alert Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Alert Headline / Title <span className="text-red-400">*</span>:
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

              {/* Severity & Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Severity Tier <span className="text-red-400">*</span>:
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
                    Geographic Jurisdiction <span className="text-red-400">*</span>:
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

              {/* Affected Communities */}
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

              {/* Hazard Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Detailed Situation & Hazard Summary <span className="text-red-400">*</span>:
                </label>
                <textarea
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the imminent hazard, affected roads, rainfall amounts, river crest levels, or meteorological data..."
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Protective Actions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Protective Action & Public Safety Instructions:
                </label>
                <textarea
                  rows={2}
                  value={safetyInstructions}
                  onChange={(e) => setSafetyInstructions(e.target.value)}
                  placeholder="e.g. Move livestock to high ground. Avoid low wooden bridges. Shelters open at UB Gym..."
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* SECTION: PUBLICATION LINK / WEB URL */}
              <div className="bg-[#121c2e] p-3.5 rounded-xl border border-[#25395c] space-y-2">
                <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Official Publication Link or Web Portal URL (Optional):</span>
                </label>
                <input
                  type="url"
                  value={publicationUrl}
                  onChange={(e) => setPublicationUrl(e.target.value)}
                  placeholder="e.g. https://nms.gov.bz/weather-forecast/ or https://nemo.gov.bz/bulletin-2026"
                  className="w-full bg-[#0b1220] border border-[#233555] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
                <p className="text-[10px] text-slate-400">
                  Citizens and emergency responders can click this link to access the live statutory release or government portal.
                </p>
              </div>

              {/* SECTION: UPLOAD PDF BULLETIN OR IMAGE */}
              <div className="bg-[#121c2e] p-3.5 rounded-xl border border-[#25395c] space-y-2.5">
                <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span>Upload Official PDF Bulletin or Meteorological Chart (Optional):</span>
                </label>

                {fileUrl ? (
                  <div className="p-3 rounded-xl bg-[#0b1220] border border-emerald-500/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        {fileType === 'pdf' ? (
                          <FileText className="w-5 h-5 text-red-400" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          File Attached Successfully ({fileType?.toUpperCase()})
                        </span>
                        <span className="text-xs font-bold text-white truncate block">
                          {fileName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{fileSize}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#2d4268] hover:border-[#d4af37] p-4 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-[#0b1220]/60 hover:bg-[#0b1220]">
                    <Upload className="w-6 h-6 text-[#d4af37]" />
                    <div className="text-center">
                      <span className="text-xs font-bold text-white block">
                        Click to select PDF Bulletin or Image
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Supports PDF, PNG, JPG (up to 5MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                {fileError && (
                  <div className="text-[11px] text-red-400 font-bold bg-red-950/40 p-2 rounded-lg border border-red-500/40">
                    ⚠️ {fileError}
                  </div>
                )}
              </div>

              {/* Authority & Expiration */}
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

              {/* Distribution Channels */}
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

              {/* Actions */}
              <div className="pt-3 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-[#121c2e] text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-[#8b152e] hover:from-red-500 text-white font-black text-xs border border-[#d4af37] shadow-lg flex items-center gap-2 disabled:opacity-50 transition hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4 text-yellow-300" />
                  <span>{isSubmitting ? 'Publishing...' : 'Authorize & Broadcast Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INSPECT ATTACHED PDF DOCUMENT OR FULL IMAGE */}
      {/* ========================================================================= */}
      {viewingFileAdvisory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#0b1220] border-2 border-[#d4af37] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
            {/* Header */}
            <div className="p-4 bg-[#101726] border-b border-[#223352] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {viewingFileAdvisory.fileType === 'pdf' ? (
                  <FileText className="w-5 h-5 text-red-400 shrink-0" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <h4 className="font-black text-sm text-white truncate">
                    {viewingFileAdvisory.title}
                  </h4>
                  <p className="text-[11px] text-[#f3c853] font-mono truncate">
                    {viewingFileAdvisory.fileName || 'Official Attachment'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {viewingFileAdvisory.fileUrl && (
                  <a
                    href={viewingFileAdvisory.fileUrl}
                    download={viewingFileAdvisory.fileName || 'belize_advisory'}
                    className="p-2 rounded-xl bg-[#1a2942] hover:bg-[#283f66] text-[#d4af37] border border-[#d4af37]/40 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingFileAdvisory(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/60 min-h-[350px]">
              {viewingFileAdvisory.fileType === 'pdf' ? (
                <div className="w-full h-[65vh] flex flex-col items-center">
                  <object
                    data={viewingFileAdvisory.fileUrl}
                    type="application/pdf"
                    className="w-full h-full rounded-xl border border-slate-700 bg-white"
                  >
                    <div className="p-6 text-center space-y-3 bg-[#121c2e] rounded-2xl border border-red-500/50 max-w-md mx-auto my-auto">
                      <FileText className="w-12 h-12 text-red-400 mx-auto" />
                      <p className="text-sm font-bold text-white">
                        PDF preview cannot be directly embedded on this browser.
                      </p>
                      <a
                        href={viewingFileAdvisory.fileUrl}
                        download={viewingFileAdvisory.fileName || 'advisory.pdf'}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d4af37] text-slate-950 font-black text-xs shadow"
                      >
                        <Download className="w-4 h-4" />
                        Download & Open PDF Document
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                <img
                  src={viewingFileAdvisory.fileUrl}
                  alt={viewingFileAdvisory.fileName || 'Advisory Image'}
                  className="max-w-full max-h-[70vh] rounded-xl object-contain border border-[#2a3c5d] shadow-2xl"
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#101726] border-t border-[#223352] flex items-center justify-between text-xs text-slate-400">
              <div>
                Published by: <strong className="text-white">{viewingFileAdvisory.publishedBy}</strong>
              </div>
              <button
                type="button"
                onClick={() => setViewingFileAdvisory(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1a2942] hover:bg-[#283f66] text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
