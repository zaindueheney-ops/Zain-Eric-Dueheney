import React, { useState, useEffect, useCallback } from 'react';
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
  Plus,
  Eye,
  CheckCircle2,
  Radio,
  FileCheck,
  CloudSun,
  Thermometer,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdvisories } from '../context/AdvisoryContext';
import { OfficialAdvisory, AdvisoryUrgency, BelizeDistrict } from '../types';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';
import { NmsChiefMeteorologistModal } from './NmsChiefMeteorologistModal';
import {
  fetchNmsGeneralForecast,
  fetchNmsMarineForecast,
  CHIEF_METEOROLOGIST_INFO,
  NmsGeneralForecast,
  NmsMarineForecast,
  FALLBACK_NMS_GENERAL_FORECAST,
  FALLBACK_NMS_MARINE_FORECAST
} from '../services/nmsWeatherService';

export const TopAdvisoryBanner: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { advisories, addAdvisory, deleteAdvisory } = useAdvisories();

  const [activeAdvisoryIndex, setActiveAdvisoryIndex] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingFileAdvisory, setViewingFileAdvisory] = useState<OfficialAdvisory | null>(null);

  // Chief Meteorologist & NMS Live Desk State
  const [isWeatherDeskOpen, setIsWeatherDeskOpen] = useState(false);
  const [generalForecast, setGeneralForecast] = useState<NmsGeneralForecast>(FALLBACK_NMS_GENERAL_FORECAST);
  const [marineForecast, setMarineForecast] = useState<NmsMarineForecast>(FALLBACK_NMS_MARINE_FORECAST);
  const [isNmsLive, setIsNmsLive] = useState(false);
  const [isNmsRefreshing, setIsNmsRefreshing] = useState(false);

  const loadNmsData = useCallback(async () => {
    setIsNmsRefreshing(true);
    try {
      const [genResult, marResult] = await Promise.all([
        fetchNmsGeneralForecast(),
        fetchNmsMarineForecast(),
      ]);
      setGeneralForecast(genResult.data);
      setMarineForecast(marResult.data);
      setIsNmsLive(genResult.isLive || marResult.isLive);
    } catch (e) {
      console.warn('NMS data load error:', e);
    } finally {
      setIsNmsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNmsData();
  }, [loadNmsData]);

  // Upload Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrgency, setNewUrgency] = useState<AdvisoryUrgency>('warning');
  const [newDistrict, setNewDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [newSummary, setNewSummary] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<'image' | 'pdf' | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileSizeText, setFileSizeText] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAdvisory = advisories[activeAdvisoryIndex] || advisories[0];

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
      // PDF documents must be under 850KB to fit cleanly in Firestore Base64 payload
      if (file.size > 850 * 1024) {
        setUploadError(`PDF file is ${sizeInKB}KB. Please select a PDF smaller than 850KB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFileUrl(event.target?.result as string);
        setUploadedFileType('pdf');
      };
      reader.readAsDataURL(file);
    } else {
      // Compress Image to fit under 700KB
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
        fileUrl: uploadedFileUrl || undefined,
        fileType: uploadedFileType || undefined,
        fileName: uploadedFileName || undefined,
      });

      // Reset form
      setNewTitle('');
      setNewUrgency('warning');
      setNewDistrict('all');
      setNewSummary('');
      setUploadedFileUrl(null);
      setUploadedFileType(null);
      setUploadedFileName(null);
      setIsUploadModalOpen(false);
      setActiveAdvisoryIndex(0);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to publish advisory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyBadge = (level: AdvisoryUrgency) => {
    switch (level) {
      case 'critical':
        return {
          label: 'RED ALERT • SEVERE EMERGENCY',
          classes: 'bg-red-600 text-white border-red-300 font-black animate-pulse',
        };
      case 'warning':
        return {
          label: 'OFFICIAL WARNING',
          classes: 'bg-[#d4af37] text-slate-950 border-amber-200 font-extrabold',
        };
      case 'watch':
        return {
          label: 'EMERGENCY WATCH',
          classes: 'bg-orange-600 text-white border-orange-300 font-bold',
        };
      case 'all_clear':
        return {
          label: 'ALL CLEAR • NORMAL OPS',
          classes: 'bg-emerald-600 text-white border-emerald-300 font-bold',
        };
      default:
        return {
          label: 'NATIONAL ADVISORY',
          classes: 'bg-[#6b0f24] text-amber-200 border-[#d4af37]/60 font-bold',
        };
    }
  };

  if (!currentAdvisory && advisories.length === 0) {
    return null;
  }

  const badge = currentAdvisory ? getUrgencyBadge(currentAdvisory.urgencyLevel) : null;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#380714] via-[#4d0718] to-[#2d050f] border-2 border-[#d4af37]/80 text-white shadow-xl shadow-[#20030a]/50">
      {/* Top Banner Ribbon */}
      <div className="px-3 sm:px-4 py-2 border-b border-[#841c34]/70 flex flex-wrap items-center justify-between gap-2 bg-[#20030a]/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#d4af37] text-slate-950 shadow-sm">
            <Radio className="w-3 h-3 text-[#500717] animate-pulse" />
            Official Belize National Advisory
          </span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] border ${badge.classes}`}>
              {badge.label}
            </span>
          )}

          {/* Quick Chief Meteorologist Desk Trigger */}
          <button
            type="button"
            onClick={() => setIsWeatherDeskOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#27050e] hover:bg-[#3d0817] text-[#f3c853] hover:text-white border border-[#d4af37]/70 text-[10px] font-black shadow-sm transition hover:scale-105 active:scale-95"
            title="Open Chief Meteorologist Weather Desk (Source: https://nms.gov.bz/)"
          >
            <CloudSun className="w-3 h-3 text-[#facc15]" />
            <span>Chief Meteorologist Desk</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>

        {/* Advisory Switcher, Official Link & Admin Upload Button */}
        <div className="flex items-center gap-2">
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

          {advisories.length > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-200/80">
              <span>Bulletin:</span>
              <div className="flex items-center gap-1">
                {advisories.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveAdvisoryIndex(idx)}
                    className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center transition ${
                      activeAdvisoryIndex === idx
                        ? 'bg-[#d4af37] text-slate-950 shadow'
                        : 'bg-[#500717] text-amber-200/70 hover:bg-[#6b0f24]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Admin Upload Trigger */}
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 text-xs font-black shadow-md transition hover:scale-105 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-slate-950" />
              <span>Upload Advisory (Image / PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Advisory Body Content */}
      <div className="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#f3c853]">
              <span className="font-bold">📍 Jurisdiction: {currentAdvisory.district === 'all' ? 'Nationwide (All Belize Districts)' : `${currentAdvisory.district} District`}</span>
              <span>•</span>
              <span className="font-medium">Issued: {new Date(currentAdvisory.publishedAt).toLocaleDateString()} {new Date(currentAdvisory.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="text-amber-200/90 font-semibold flex items-center gap-1">
                <span>Authority:</span>
                <button
                  type="button"
                  onClick={() => setIsWeatherDeskOpen(true)}
                  className="text-[#f3c853] underline font-bold hover:text-white"
                  title="View Chief Meteorologist details"
                >
                  {CHIEF_METEOROLOGIST_INFO.name}
                </button>
                <span>(NMS •</span>
                <a
                  href="https://nms.gov.bz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f3c853] underline font-bold inline-flex items-center gap-0.5 hover:text-white"
                >
                  nms.gov.bz
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span>)</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
              {currentAdvisory.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 max-w-4xl line-clamp-2 md:line-clamp-3 leading-relaxed">
              {currentAdvisory.summary}
            </p>

            {/* Quick Live Weather & Marine Snapshot Bar from nms.gov.bz */}
            <div className="pt-2 border-t border-[#841c34]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 sm:gap-3 text-amber-200/90 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-white">
                  <Thermometer className="w-3.5 h-3.5 text-red-400" />
                  <span>Coast: {generalForecast.coast_high_f || 87}°F</span>
                  <span className="text-amber-200/70 font-normal">• Inland: {generalForecast.inland_high_f || 91}°F</span>
                  <span className="text-amber-200/70 font-normal">• Hills: {generalForecast.hills_high_f || 76}°F</span>
                </span>
                <span className="hidden md:inline text-amber-200/40">|</span>
                <span className="text-[11px] text-slate-300 hidden md:inline">
                  Winds: {generalForecast.wind_speed || '5-10 kts'} • Sea: {generalForecast.sea_state_m2m?.join(' / ') || 'Light Chop'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsWeatherDeskOpen(true)}
                className="text-[11px] font-bold text-[#f3c853] hover:text-white flex items-center gap-1 ml-auto"
              >
                <span>Chief Meteorologist Weather Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Attached Document or Image Showcase */}
          {currentAdvisory.fileUrl && (
            <div className="shrink-0 flex items-center gap-2 bg-[#20030a]/80 p-2 rounded-xl border border-[#d4af37]/40 shadow-inner">
              {currentAdvisory.fileType === 'pdf' ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left pr-2">
                    <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block">Official PDF Document</span>
                    <span className="text-xs font-bold text-white max-w-[140px] truncate block">
                      {currentAdvisory.fileName || 'Advisory_Bulletin.pdf'}
                    </span>
                  </div>
                  <button
                    onClick={() => setViewingFileAdvisory(currentAdvisory)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-bold shadow transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View PDF</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => setViewingFileAdvisory(currentAdvisory)}
                    className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#d4af37]/60 cursor-pointer group"
                  >
                    <img
                      src={currentAdvisory.fileUrl}
                      alt={currentAdvisory.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                      <Eye className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="text-left pr-1">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Official Image Bulletin</span>
                    <span className="text-xs font-bold text-white max-w-[120px] truncate block">
                      {currentAdvisory.fileName || 'Bulletin_Chart.jpg'}
                    </span>
                  </div>
                  <button
                    onClick={() => setViewingFileAdvisory(currentAdvisory)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-bold shadow transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin Delete Action */}
          {isAdmin && advisories.length > 1 && (
            <button
              onClick={() => deleteAdvisory(currentAdvisory.id)}
              title="Delete this advisory"
              className="p-1.5 rounded-lg text-red-300 hover:text-red-100 hover:bg-red-950/60 border border-red-700/50 transition self-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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

      {/* MODAL 2: UPLOAD OFFICIAL ADVISORY (IMAGE OR PDF) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#2a0610] border-2 border-[#d4af37] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
            <div className="p-4 bg-[#3d0817] border-b border-[#841c34] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#f3c853]" />
                <h3 className="font-black text-base text-white">
                  Publish Official Emergency Advisory
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAdvisory} className="p-5 space-y-4">
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

              {/* Summary / Directive */}
              <div>
                <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider mb-1">
                  Public Directive & Guidance Summary
                </label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Detail expected hazards, safe evacuation routes, shelter openings, and emergency contact frequencies..."
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
                  <label className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition">
                    <Upload className="w-6 h-6 text-[#f3c853] mb-1.5" />
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

      {/* MODAL 3: CHIEF METEOROLOGIST & NMS WEATHER DESK */}
      <NmsChiefMeteorologistModal
        isOpen={isWeatherDeskOpen}
        onClose={() => setIsWeatherDeskOpen(false)}
        generalForecast={generalForecast}
        marineForecast={marineForecast}
        isLive={isNmsLive}
        onRefresh={loadNmsData}
        isRefreshing={isNmsRefreshing}
      />
    </section>
  );
};
