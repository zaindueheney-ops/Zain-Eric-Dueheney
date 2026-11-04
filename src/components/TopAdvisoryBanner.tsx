import React, { useState } from 'react';
import {
  AlertTriangle,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  ExternalLink,
  Download,
  Trash2,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Eye,
  Radio,
  FileCheck,
  Layers,
  CheckCircle2,
  Info,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdvisories } from '../context/AdvisoryContext';
import { OfficialAdvisory, AdvisoryUrgency, BelizeDistrict } from '../types';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';

export const TopAdvisoryBanner: React.FC = () => {
  const { isAdmin } = useAuth();
  const { advisories, addAdvisory, updateAdvisory, deleteAdvisory } = useAdvisories();

  const [activeAdvisoryIndex, setActiveAdvisoryIndex] = useState(0);
  const [viewAllStacked, setViewAllStacked] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingAdvisory, setEditingAdvisory] = useState<OfficialAdvisory | null>(null);
  const [viewingFileAdvisory, setViewingFileAdvisory] = useState<OfficialAdvisory | null>(null);
  const [deletingAdvisory, setDeletingAdvisory] = useState<OfficialAdvisory | null>(null);

  // Upload Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrgency, setNewUrgency] = useState<AdvisoryUrgency>('warning');
  const [newDistrict, setNewDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [newSummary, setNewSummary] = useState('');
  const [newSafetyInstructions, setNewSafetyInstructions] = useState('');
  const [newIssuingAuthority, setNewIssuingAuthority] = useState('National Emergency Management Organization (NEMO)');
  const [newPublicationUrl, setNewPublicationUrl] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<'image' | 'pdf' | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileSizeText, setFileSizeText] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal Form State
  const [editTitle, setEditTitle] = useState('');
  const [editUrgency, setEditUrgency] = useState<AdvisoryUrgency>('warning');
  const [editDistrict, setEditDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [editSummary, setEditSummary] = useState('');
  const [editSafetyInstructions, setEditSafetyInstructions] = useState('');
  const [editIssuingAuthority, setEditIssuingAuthority] = useState('');
  const [editPublicationUrl, setEditPublicationUrl] = useState('');
  const [editFileUrl, setEditFileUrl] = useState<string | null>(null);
  const [editFileType, setEditFileType] = useState<'image' | 'pdf' | null>(null);
  const [editFileName, setEditFileName] = useState<string | null>(null);
  const [editFileSizeText, setEditFileSizeText] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Ensure active index is within bounds
  const safeIndex = Math.min(activeAdvisoryIndex, Math.max(0, advisories.length - 1));
  const currentAdvisory = advisories[safeIndex] || advisories[0];

  // Handle File Selection (Image or PDF)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setUploadError('Unsupported file type. Please upload an image (.jpg, .png, .webp) or a .pdf document.');
      return;
    }

    const sizeInKB = Math.round(file.size / 1024);
    setFileSizeText(`${sizeInKB} KB`);
    setUploadedFileName(file.name);

    if (isPdf) {
      if (file.size > 850 * 1024) {
        setUploadError(`PDF file is ${sizeInKB}KB. Please select a PDF smaller than 850KB to preserve rapid loading.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFileUrl(event.target?.result as string);
        setUploadedFileType('pdf');
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setUploadedFileUrl(compressed);
            setUploadedFileType('image');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setUploadError('Please provide an advisory headline.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAdvisory({
        title: newTitle.trim(),
        urgencyLevel: newUrgency,
        district: newDistrict,
        summary: newSummary.trim() || 'Official Belize National Emergency Advisory bulletin published for public awareness and response coordination.',
        safetyInstructions: newSafetyInstructions.trim() || undefined,
        issuingAuthority: newIssuingAuthority.trim() || undefined,
        publicationUrl: newPublicationUrl.trim() || undefined,
        fileUrl: uploadedFileUrl || undefined,
        fileType: uploadedFileType || undefined,
        fileName: uploadedFileName || undefined,
      });

      // Reset form
      setNewTitle('');
      setNewUrgency('warning');
      setNewDistrict('all');
      setNewSummary('');
      setNewSafetyInstructions('');
      setNewIssuingAuthority('National Emergency Management Organization (NEMO)');
      setNewPublicationUrl('');
      setUploadedFileUrl(null);
      setUploadedFileType(null);
      setUploadedFileName(null);
      setIsUploadModalOpen(false);
      // Point to newest bulletin
      setActiveAdvisoryIndex(0);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to publish advisory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (adv: OfficialAdvisory) => {
    setEditingAdvisory(adv);
    setEditTitle(adv.title || '');
    setEditUrgency(adv.urgencyLevel || 'warning');
    setEditDistrict(adv.district || 'all');
    setEditSummary(adv.summary || '');
    setEditSafetyInstructions(adv.safetyInstructions || '');
    setEditIssuingAuthority(adv.issuingAuthority || 'National Emergency Management Organization (NEMO)');
    setEditPublicationUrl(adv.publicationUrl || '');
    setEditFileUrl(adv.fileUrl || null);
    setEditFileType(adv.fileType || null);
    setEditFileName(adv.fileName || null);
    setEditFileSizeText(null);
    setEditError(null);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditError(null);
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setEditError('Unsupported file type. Please upload an image (.jpg, .png, .webp) or a .pdf document.');
      return;
    }

    const sizeInKB = Math.round(file.size / 1024);
    setEditFileSizeText(`${sizeInKB} KB`);
    setEditFileName(file.name);

    if (isPdf) {
      if (file.size > 850 * 1024) {
        setEditError(`PDF file is ${sizeInKB}KB. Please select a PDF smaller than 850KB to preserve rapid loading.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditFileUrl(event.target?.result as string);
        setEditFileType('pdf');
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setEditFileUrl(compressed);
            setEditFileType('image');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAdvisoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvisory || !editTitle.trim()) {
      setEditError('Please provide an advisory headline.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateAdvisory(editingAdvisory.id, {
        title: editTitle.trim(),
        urgencyLevel: editUrgency,
        district: editDistrict,
        summary: editSummary.trim() || 'Official Belize National Emergency Advisory bulletin published for public awareness and response coordination.',
        safetyInstructions: editSafetyInstructions.trim() || '',
        issuingAuthority: editIssuingAuthority.trim() || 'National Emergency Management Organization (NEMO)',
        publicationUrl: editPublicationUrl.trim() || '',
        fileUrl: editFileUrl,
        fileType: editFileType,
        fileName: editFileName,
      });

      setEditingAdvisory(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update advisory.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getUrgencyBadge = (level: AdvisoryUrgency) => {
    switch (level) {
      case 'critical':
        return {
          label: 'RED ALERT • SEVERE EMERGENCY',
          classes: 'bg-red-600 text-white border-red-300 font-black animate-pulse',
          dot: 'bg-red-400',
        };
      case 'warning':
        return {
          label: 'OFFICIAL WARNING',
          classes: 'bg-[#d4af37] text-slate-950 border-amber-200 font-extrabold',
          dot: 'bg-amber-400',
        };
      case 'watch':
        return {
          label: 'EMERGENCY WATCH',
          classes: 'bg-orange-600 text-white border-orange-300 font-bold',
          dot: 'bg-orange-400',
        };
      case 'all_clear':
        return {
          label: 'ALL CLEAR • NORMAL OPS',
          classes: 'bg-emerald-600 text-white border-emerald-300 font-bold',
          dot: 'bg-emerald-400',
        };
      default:
        return {
          label: 'NATIONAL ADVISORY',
          classes: 'bg-[#6b0f24] text-amber-200 border-[#d4af37]/60 font-bold',
          dot: 'bg-blue-400',
        };
    }
  };

  if (advisories.length === 0) {
    return null;
  }

  // Renders a single advisory card
  const renderAdvisoryContent = (adv: OfficialAdvisory, index: number, isSingleView: boolean) => {
    const badge = getUrgencyBadge(adv.urgencyLevel);
    return (
      <div
        key={adv.id}
        className={`p-3.5 sm:p-4.5 ${
          !isSingleView ? 'border-b border-[#841c34]/60 last:border-b-0 bg-[#28040d]/40' : ''
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5 min-w-0">
            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#f3c853]">
              <span className={`px-2 py-0.5 rounded-full text-[10px] border ${badge.classes}`}>
                {badge.label}
              </span>
              <span className="font-bold bg-[#20030a] px-2 py-0.5 rounded-md border border-[#841c34]">
                📍 {adv.district === 'all' ? 'Nationwide (All Belize)' : `${adv.district} District`}
              </span>
              <span className="text-slate-300">
                Issued: {new Date(adv.publishedAt).toLocaleDateString()} {new Date(adv.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {adv.updatedAt && (
                <span
                  className="text-[10px] text-[#f3c853] bg-[#20030a] px-1.5 py-0.5 rounded border border-[#841c34] font-mono"
                  title={`Last updated by ${adv.updatedBy || 'Admin'}`}
                >
                  Edited: {new Date(adv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span className="text-amber-200/90">
                Authority: <strong className="text-white">{adv.issuingAuthority || adv.publishedBy || 'National Emergency Management Organization (NEMO)'}</strong>
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
              {adv.title}
            </h3>

            {/* Summary */}
            <p className="text-xs sm:text-sm text-slate-200 max-w-4xl leading-relaxed">
              {adv.summary}
            </p>

            {/* Safety Directive */}
            {adv.safetyInstructions && (
              <div className="bg-[#20030a] p-2.5 rounded-xl border border-amber-500/40 text-xs text-amber-200 space-y-0.5">
                <span className="font-bold text-amber-300 text-[10px] uppercase tracking-wide block">
                  Public Safety & Action Directive:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-200">
                  {adv.safetyInstructions}
                </p>
              </div>
            )}

            {/* External Publication Link */}
            {adv.publicationUrl && (
              <div className="pt-0.5">
                <a
                  href={adv.publicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#500717] hover:bg-[#6b0f24] text-[#f3c853] hover:text-white border border-[#d4af37]/40 text-xs font-bold transition shadow-sm"
                  title="Open Official Publication Source"
                >
                  <ExternalLink className="w-3 h-3 text-[#f3c853]" />
                  <span>Official Publication: {adv.publicationUrl}</span>
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Attachment & Actions */}
          <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
            {(adv.fileUrl || adv.fileName) && (
              <div className="flex items-center gap-2 bg-[#20030a]/80 p-2 rounded-xl border border-[#d4af37]/40 shadow-inner">
                {adv.fileType === 'pdf' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left pr-2">
                      <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block">Official PDF</span>
                      <span className="text-xs font-bold text-white max-w-[130px] truncate block">
                        {adv.fileName || 'Bulletin.pdf'}
                      </span>
                    </div>
                    {adv.fileUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingFileAdvisory(adv)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black shadow transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </button>
                    ) : adv.publicationUrl ? (
                      <a
                        href={adv.publicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black shadow transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open PDF</span>
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {adv.fileUrl ? (
                      <div
                        onClick={() => setViewingFileAdvisory(adv)}
                        className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#d4af37]/60 cursor-pointer group"
                      >
                        <img
                          src={adv.fileUrl}
                          alt={adv.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="text-left pr-1">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Image Bulletin</span>
                      <span className="text-xs font-bold text-white max-w-[110px] truncate block">
                        {adv.fileName || 'Bulletin.jpg'}
                      </span>
                    </div>
                    {adv.fileUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingFileAdvisory(adv)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black shadow transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    ) : adv.publicationUrl ? (
                      <a
                        href={adv.publicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black shadow transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Admin Edit Action */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenEdit(adv)}
                title="Edit this advisory"
                className="p-2 rounded-xl text-[#d4af37] hover:text-white hover:bg-[#500717] border border-[#d4af37]/60 transition flex items-center gap-1 text-xs font-bold shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Admin Delete Action */}
            {isAdmin && advisories.length > 1 && (
              <button
                type="button"
                onClick={() => setDeletingAdvisory(adv)}
                title="Delete this advisory"
                className="p-2 rounded-xl text-red-300 hover:text-white hover:bg-red-950/80 border border-red-700/60 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#380714] via-[#4d0718] to-[#2d050f] border-2 border-[#d4af37]/80 text-white shadow-xl shadow-[#20030a]/50">
      {/* Top Banner Ribbon */}
      <div className="px-3 sm:px-4 py-2 border-b border-[#841c34]/70 flex flex-wrap items-center justify-between gap-2 bg-[#20030a]/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#d4af37] text-slate-950 shadow-sm">
            <Radio className="w-3 h-3 text-[#500717] animate-pulse" />
            Official Belize National Emergency Advisories
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-amber-200 border border-amber-500/40">
            ⚡ {advisories.length} Active {advisories.length === 1 ? 'Bulletin' : 'Bulletins'} Posted
          </span>
        </div>

        {/* Quick Official Links & Admin Upload Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Link to Official NMS Portal */}
          <a
            href="https://nms.gov.bz/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200 hover:text-white text-[11px] font-bold border border-white/10 transition"
            title="Visit Official National Meteorological Service Website"
          >
            <span>nms.gov.bz</span>
            <ExternalLink className="w-3 h-3 text-[#f3c853]" />
          </a>

          {/* Toggle Stacked vs Single View if multiple advisories exist */}
          {advisories.length > 1 && (
            <button
              type="button"
              onClick={() => setViewAllStacked(!viewAllStacked)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition flex items-center gap-1.5 ${
                viewAllStacked
                  ? 'bg-[#d4af37] text-slate-950 border-[#d4af37] shadow'
                  : 'bg-[#500717] text-amber-200 border-[#841c34] hover:bg-[#6b0f24]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>{viewAllStacked ? 'Show Paged View' : `View All (${advisories.length}) Stacked`}</span>
            </button>
          )}

          {/* Admin Upload Trigger */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 text-xs font-black shadow-md transition hover:scale-105 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-slate-950" />
              <span>Post New Advisory (PDF / Image)</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Multi-Advisory Tab Bar (Displayed when multiple advisories exist & not in stacked view) */}
      {!viewAllStacked && advisories.length > 1 && (
        <div className="px-3 sm:px-4 py-2 bg-[#1b0309] border-b border-[#841c34]/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider mr-1">
              Active Bulletins:
            </span>
            {advisories.map((adv, idx) => {
              const b = getUrgencyBadge(adv.urgencyLevel);
              const isSelected = safeIndex === idx;
              return (
                <button
                  key={adv.id}
                  type="button"
                  onClick={() => setActiveAdvisoryIndex(idx)}
                  className={`group px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f3c853] text-slate-950 border-amber-200 shadow-md scale-102'
                      : 'bg-[#30050f] text-amber-200/90 border-[#841c34] hover:bg-[#4d0718] hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${b.dot} ${isSelected ? 'animate-ping' : ''}`} />
                  <span className="font-black">Bulletin {idx + 1}:</span>
                  <span className="max-w-[160px] truncate text-left">
                    {adv.district === 'all' ? 'Belize Nationwide' : adv.district} – {adv.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prev / Next controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={safeIndex === 0}
              onClick={() => setActiveAdvisoryIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded-lg bg-[#30050f] hover:bg-[#500717] disabled:opacity-30 disabled:hover:bg-[#30050f] border border-[#841c34] text-amber-200 text-xs font-bold flex items-center gap-0.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline pr-1">Prev</span>
            </button>
            <span className="text-[11px] font-mono text-amber-300 px-1 font-bold">
              {safeIndex + 1} of {advisories.length}
            </span>
            <button
              type="button"
              disabled={safeIndex === advisories.length - 1}
              onClick={() => setActiveAdvisoryIndex((prev) => Math.min(advisories.length - 1, prev + 1))}
              className="p-1 rounded-lg bg-[#30050f] hover:bg-[#500717] disabled:opacity-30 disabled:hover:bg-[#30050f] border border-[#841c34] text-amber-200 text-xs font-bold flex items-center gap-0.5"
            >
              <span className="hidden sm:inline pl-1">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Advisory Content Presentation */}
      {viewAllStacked ? (
        <div className="divide-y divide-[#841c34]/60">
          {advisories.map((adv, idx) => renderAdvisoryContent(adv, idx, false))}
        </div>
      ) : (
        renderAdvisoryContent(currentAdvisory, safeIndex, true)
      )}

      {/* MODAL 1: VIEW FULL-SIZE IMAGE OR EMBEDDED PDF */}
      {viewingFileAdvisory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#24050e] border-2 border-[#d4af37] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
            {/* Modal Header */}
            <div className="p-4 bg-[#380714] border-b border-[#841c34] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {viewingFileAdvisory.fileType === 'pdf' ? (
                  <FileText className="w-5 h-5 text-red-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h4 className="font-black text-sm text-white">
                    {viewingFileAdvisory.title}
                  </h4>
                  <p className="text-[11px] text-amber-300 font-mono">
                    {viewingFileAdvisory.fileName || 'Official Attachment'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {viewingFileAdvisory.fileUrl && (
                  <a
                    href={viewingFileAdvisory.fileUrl}
                    download={viewingFileAdvisory.fileName || 'belize_advisory'}
                    className="p-2 rounded-xl bg-[#500717] hover:bg-[#6b0f24] text-amber-200 border border-[#d4af37]/40 text-xs font-bold transition flex items-center gap-1.5"
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

            {/* Modal Content */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/50 min-h-[350px]">
              {viewingFileAdvisory.fileType === 'pdf' ? (
                <div className="w-full h-[65vh] flex flex-col items-center">
                  <object
                    data={viewingFileAdvisory.fileUrl}
                    type="application/pdf"
                    className="w-full h-full rounded-xl border border-slate-700 bg-white"
                  >
                    <div className="p-6 text-center space-y-3 bg-[#380714] rounded-2xl border border-red-500/50">
                      <FileText className="w-12 h-12 text-red-400 mx-auto" />
                      <p className="text-sm font-bold text-white">
                        PDF preview cannot be embedded directly in your mobile browser.
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
                  alt={viewingFileAdvisory.title}
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl border border-white/20"
                />
              )}
            </div>

            {/* Modal Footer Description */}
            <div className="p-3 bg-[#1a030a] border-t border-[#841c34] text-xs text-slate-300">
              <span className="font-bold text-[#f3c853]">Summary: </span>
              {viewingFileAdvisory.summary}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM ADVISORY DELETION */}
      {deletingAdvisory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#24050e] border-2 border-red-500 rounded-3xl max-w-md w-full p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Delete Emergency Advisory</h3>
                <p className="text-xs text-red-200">This action will remove the bulletin from active circulation.</p>
              </div>
            </div>

            <div className="bg-[#180309] p-3 rounded-xl border border-[#841c34] text-xs space-y-1">
              <div className="font-bold text-white">{deletingAdvisory.title}</div>
              <div className="text-amber-300 text-[11px]">
                {deletingAdvisory.district === 'all' ? 'Nationwide' : `${deletingAdvisory.district} District`} • Issued: {new Date(deletingAdvisory.publishedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#841c34]">
              <button
                type="button"
                onClick={() => setDeletingAdvisory(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const idToDelete = deletingAdvisory.id;
                  setDeletingAdvisory(null);
                  await deleteAdvisory(idToDelete);
                  setActiveAdvisoryIndex(0);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD / PUBLISH OFFICIAL ADVISORY (IMAGE OR PDF) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#2a0610] border-2 border-[#d4af37] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-[#3d0817] border-b border-[#841c34] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#f3c853]" />
                <div>
                  <h3 className="font-black text-base text-white">
                    Publish Official Emergency Advisory
                  </h3>
                  <p className="text-[10px] text-amber-200">
                    Existing advisories will remain active. Multiple advisories can be posted simultaneously.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAdvisory} className="p-5 space-y-3.5 overflow-y-auto max-h-[75vh]">
              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-950 border border-red-500/80 text-red-200 text-xs font-medium">
                  {uploadError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Advisory Headline / Bulletin Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Flash Flood Emergency Warning for Cayo & Stann Creek..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Urgency & District Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                    Alert Urgency Tier
                  </label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as AdvisoryUrgency)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="critical">🔴 RED ALERT (Severe)</option>
                    <option value="warning">🟠 OFFICIAL WARNING</option>
                    <option value="watch">🟡 EMERGENCY WATCH</option>
                    <option value="advisory">🔵 NATIONAL ADVISORY</option>
                    <option value="all_clear">🟢 ALL CLEAR (Normal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                    Target District
                  </label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value as BelizeDistrict | 'all')}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="all">Nationwide (All Belize)</option>
                    {BELIZE_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Issuing Authority */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  value={newIssuingAuthority}
                  onChange={(e) => setNewIssuingAuthority(e.target.value)}
                  placeholder="e.g. National Emergency Management Organization (NEMO) or NMS"
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Summary / Guidance */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Advisory Summary & Details *
                </label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Detail the emergency situation, meteorological observations, and affected areas..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Safety Directive */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Public Safety & Action Directive (Instructions)
                </label>
                <textarea
                  rows={2}
                  value={newSafetyInstructions}
                  onChange={(e) => setNewSafetyInstructions(e.target.value)}
                  placeholder="Specify evacuation directives, shelter instructions, emergency phone numbers, and road precautions..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Publication Web Link */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Official Publication / Web Link (Optional)
                </label>
                <input
                  type="url"
                  value={newPublicationUrl}
                  onChange={(e) => setNewPublicationUrl(e.target.value)}
                  placeholder="e.g. https://nms.gov.bz/weather-forecast/ or official government publication"
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Upload Actual Advisory Image or .PDF */}
              <div className="p-3.5 bg-[#1f040b] rounded-2xl border-2 border-dashed border-[#d4af37]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Upload Official Attachment (.PDF or Image)
                  </span>
                  <span className="text-[10px] text-amber-200/60 font-mono">Max 850KB</span>
                </div>

                {uploadedFileUrl ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#380714] border border-[#d4af37]/50">
                    <div className="flex items-center gap-2">
                      {uploadedFileType === 'pdf' ? (
                        <FileCheck className="w-5 h-5 text-red-400" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-amber-400" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-white block max-w-[200px] truncate">
                          {uploadedFileName}
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono">{fileSizeText}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileUrl(null);
                        setUploadedFileType(null);
                        setUploadedFileName(null);
                      }}
                      className="p-1 text-red-300 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3.5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition">
                    <Upload className="w-6 h-6 text-[#f3c853] mb-1" />
                    <span className="text-xs font-bold text-white">Choose File (PDF or Image)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Supports .pdf, .jpg, .png, .webp</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#841c34]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 text-xs font-black shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing Bulletin...' : 'Publish Official Advisory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT OFFICIAL ADVISORY BULLETIN */}
      {editingAdvisory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#2a0610] border-2 border-[#d4af37] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-[#3d0817] border-b border-[#841c34] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#f3c853]" />
                <div>
                  <h3 className="font-black text-base text-white">
                    Edit Emergency Advisory Bulletin
                  </h3>
                  <p className="text-[10px] text-amber-200">
                    Update title, instructions, publication links, or attached documents in real time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdvisory(null)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvisoryEdit} className="p-5 space-y-3.5 overflow-y-auto max-h-[75vh]">
              {editError && (
                <div className="p-2.5 rounded-xl bg-red-950 border border-red-500/80 text-red-200 text-xs font-medium">
                  {editError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Advisory Headline / Bulletin Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Flash Flood Emergency Warning..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Urgency & District Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                    Alert Urgency Tier
                  </label>
                  <select
                    value={editUrgency}
                    onChange={(e) => setEditUrgency(e.target.value as AdvisoryUrgency)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="critical">🔴 RED ALERT (Severe)</option>
                    <option value="warning">🟠 OFFICIAL WARNING</option>
                    <option value="watch">🟡 EMERGENCY WATCH</option>
                    <option value="advisory">🔵 NATIONAL ADVISORY</option>
                    <option value="all_clear">🟢 ALL CLEAR (Normal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                    Target District
                  </label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value as BelizeDistrict | 'all')}
                    className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="all">Nationwide (All Belize)</option>
                    {BELIZE_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Issuing Authority */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  value={editIssuingAuthority}
                  onChange={(e) => setEditIssuingAuthority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Summary / Guidance */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Advisory Summary & Details *
                </label>
                <textarea
                  rows={3}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder="Detail the emergency situation, observations, and affected areas..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Safety Directive */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Public Safety & Action Directive (Instructions)
                </label>
                <textarea
                  rows={2}
                  value={editSafetyInstructions}
                  onChange={(e) => setEditSafetyInstructions(e.target.value)}
                  placeholder="Specify evacuation directives, safety precautions..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Publication Web Link */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Official Publication / Web Link (Optional)
                </label>
                <input
                  type="url"
                  value={editPublicationUrl}
                  onChange={(e) => setEditPublicationUrl(e.target.value)}
                  placeholder="e.g. https://nms.gov.bz/weather-forecast/ or official government portal"
                  className="w-full px-3 py-2 rounded-xl bg-[#1d0309] border border-[#841c34] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Upload / Replace Advisory Image or .PDF */}
              <div className="p-3.5 bg-[#1f040b] rounded-2xl border-2 border-dashed border-[#d4af37]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Official Attachment (.PDF or Image)
                  </span>
                  <span className="text-[10px] text-amber-200/60 font-mono">Max 850KB</span>
                </div>

                {editFileUrl || editFileName ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#380714] border border-[#d4af37]/50">
                    <div className="flex items-center gap-2 min-w-0">
                      {editFileType === 'pdf' || (editFileName && editFileName.toLowerCase().endsWith('.pdf')) ? (
                        <FileCheck className="w-5 h-5 text-red-400 shrink-0" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate max-w-[170px]">
                          {editFileName || 'Attached_Bulletin.pdf'}
                        </span>
                        {editFileSizeText && (
                          <span className="text-[10px] text-amber-300 font-mono">{editFileSizeText}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label className="px-2 py-1 rounded-lg bg-[#500717] hover:bg-[#6b0f24] border border-[#841c34] text-amber-200 text-xs font-bold cursor-pointer transition">
                        Replace
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleEditFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditFileUrl(null);
                          setEditFileType(null);
                          setEditFileName(null);
                          setEditFileSizeText(null);
                        }}
                        className="p-1 text-red-300 hover:text-white"
                        title="Remove attached file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3.5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition">
                    <Upload className="w-6 h-6 text-[#f3c853] mb-1" />
                    <span className="text-xs font-bold text-white">Upload or replace File (PDF or Image)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Supports .pdf, .jpg, .png, .webp</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleEditFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#841c34]">
                <button
                  type="button"
                  onClick={() => setEditingAdvisory(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 text-xs font-black shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving Changes...' : 'Save & Update Advisory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
