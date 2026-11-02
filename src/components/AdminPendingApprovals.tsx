import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  User,
  ExternalLink,
  Bell,
  Mail,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  FileCheck2,
  Image as ImageIcon,
  Sparkles,
  Info,
  Users,
  PhoneCall,
  UserCheck,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { EmergencyIncident } from '../types';
import { requestPushPermission } from '../services/notificationService';
import {
  getDispatchedEmails,
  DispatchedEmailRecord,
  createGmailComposeUrl,
  DEFAULT_ADMIN_EMAIL
} from '../services/emailService';
import { useAuth, isAuthorizedAdminEmail } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { useChat } from '../context/ChatContext';
import { AdminUserDirectory } from './AdminUserDirectory';
import { createWhatsAppUrl, WhatsAppTemplates } from '../utils/whatsapp';

interface AdminPendingApprovalsProps {
  pendingIncidents: EmergencyIncident[];
  onApproveIncident: (incidentId: string) => Promise<void>;
  onRejectIncident: (incidentId: string, reason: string) => Promise<void>;
  adminEmail?: string;
}

export const AdminPendingApprovals: React.FC<AdminPendingApprovalsProps> = ({
  pendingIncidents,
  onApproveIncident,
  onRejectIncident,
  adminEmail = DEFAULT_ADMIN_EMAIL,
}) => {
  const { user } = useAuth();
  const { deleteIncident } = useIncidents();
  const { openChatWithCitizen } = useChat();
  const isZainAdmin = isAuthorizedAdminEmail(user?.email);

  const [inspectingIncident, setInspectingIncident] = useState<EmergencyIncident | null>(null);
  const [rejectingIncidentId, setRejectingIncidentId] = useState<string | null>(null);
  const [deletingIncidentId, setDeletingIncidentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Picture or format does not meet genuine Belize emergency standards.');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Active Desk View Tab: 'pending' (approvals) or 'users' (citizen directory)
  const [activeAdminTab, setActiveAdminTab] = useState<'pending' | 'users'>('pending');
  const [directorySearchQuery, setDirectorySearchQuery] = useState<string>('');

  // Email Audit Log Modal
  const [showEmailLogs, setShowEmailLogs] = useState(false);
  const [emailLogs, setEmailLogs] = useState<DispatchedEmailRecord[]>([]);

  // Push Permission Status
  const [pushStatus, setPushStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // Picture Zoom Level in Inspector Modal
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setEmailLogs(getDispatchedEmails());
  }, [pendingIncidents, showEmailLogs]);

  // Early return if not logged in as Zain Dueheney administrator
  if (!isZainAdmin) {
    return null;
  }

  const handleRequestPush = async () => {
    const granted = await requestPushPermission();
    setPushStatus(granted ? 'granted' : 'denied');
  };

  const handleApprove = async (incident: EmergencyIncident) => {
    if (!isZainAdmin) {
      alert('Access Denied: Only Administrator Zain Dueheney is authorized to approve new incident requests.');
      return;
    }
    setIsProcessing(incident.id);
    try {
      await onApproveIncident(incident.id);
      setActionSuccessMessage(`✓ Emergency "${incident.title}" APPROVED and published live to Belize map!`);
      if (inspectingIncident?.id === incident.id) {
        setInspectingIncident(null);
      }
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (incidentId: string) => {
    if (!isZainAdmin) {
      alert('Access Denied: Only Administrator Zain Dueheney is authorized to reject new incident requests.');
      return;
    }
    setIsProcessing(incidentId);
    try {
      await onRejectIncident(incidentId, rejectReason);
      setRejectingIncidentId(null);
      if (inspectingIncident?.id === incidentId) {
        setInspectingIncident(null);
      }
      setActionSuccessMessage('Incident rejected and archived as false alarm / format invalid.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (incidentId: string) => {
    if (!isZainAdmin) {
      alert('Access Denied: Only Administrator Zain Dueheney is authorized to delete incidents.');
      return;
    }
    setIsProcessing(incidentId);
    try {
      await deleteIncident(incidentId);
      setDeletingIncidentId(null);
      if (inspectingIncident?.id === incidentId) {
        setInspectingIncident(null);
      }
      setActionSuccessMessage('✓ Emergency incident permanently deleted from system.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <section className="bg-[#1f040b] text-white rounded-2xl shadow-xl border-2 border-[#d4af37] overflow-hidden mb-3">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#4d0718] via-[#6b0f24] to-[#380714] border-b border-[#d4af37]/60 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <ShieldAlert className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base tracking-tight leading-tight">
                Administrator Verification Desk
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-red-700 shadow-sm">
                {pendingIncidents.length} Pending
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-100 font-medium">
              Review genuine incident format, attached picture, and sworn declaration before public map publication.
            </p>
          </div>
        </div>

        {/* Real-time Notifications Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Push Notification Toggle */}
          {pushStatus === 'granted' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-400/40 text-[11px] font-bold text-emerald-300">
              <Bell className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>Push Active</span>
            </div>
          ) : (
            <button
              onClick={handleRequestPush}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 text-[11px] font-bold transition"
            >
              <Bell className="w-3.5 h-3.5 text-yellow-300" />
              <span>Enable Push Alerts</span>
            </button>
          )}

          {/* Admin Email Notification Badge */}
          <button
            onClick={() => {
              setEmailLogs(getDispatchedEmails());
              setShowEmailLogs(true);
            }}
            title="Inspect Email Notifications sent to administrator"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 text-[11px] font-bold transition"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">{adminEmail}</span>
            <span className="sm:hidden">Email Alert</span>
            <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-900 text-[10px] flex items-center justify-center font-bold">
              {emailLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Desk Navigation Tabs */}
      <div className="flex items-center gap-2 px-3 sm:px-5 pt-2.5 pb-0 bg-[#25050f] border-b border-[#841c34]">
        <button
          type="button"
          onClick={() => setActiveAdminTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-black transition border-t-2 border-x-2 ${
            activeAdminTab === 'pending'
              ? 'bg-[#1f040b] text-[#f3c853] border-[#d4af37] border-b-transparent shadow'
              : 'text-amber-200/70 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Pending Approvals ({pendingIncidents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-black transition border-t-2 border-x-2 ${
            activeAdminTab === 'users'
              ? 'bg-[#1f040b] text-[#f3c853] border-[#d4af37] border-b-transparent shadow'
              : 'text-amber-200/70 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Registered Users Directory</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-500/40">
            Phone & Email (Call to Verify)
          </span>
        </button>
      </div>

      {/* Desk Content Area */}
      <div className="p-4 sm:p-5">
        {activeAdminTab === 'users' ? (
          <AdminUserDirectory
            initialSearch={directorySearchQuery}
            incidents={pendingIncidents}
          />
        ) : pendingIncidents.length === 0 ? (
          <div className="bg-slate-800/80 rounded-xl p-6 text-center border border-slate-700/80">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">
              Zero Pending Incident Approvals
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              All reported emergency incidents have been verified and processed. As soon as a citizen files an emergency report, you will receive an instant push notification and email alert here for review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-slate-800 rounded-xl border border-slate-700 hover:border-amber-400/60 shadow-lg flex flex-col justify-between overflow-hidden transition"
              >
                {/* Image Inspection Header or Placeholder */}
                <div className="relative bg-slate-950 h-36 flex items-center justify-center overflow-hidden border-b border-slate-700">
                  {incident.imageUrl ? (
                    <>
                      <img
                        src={incident.imageUrl}
                        alt={incident.title}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-300"
                        onClick={() => {
                          setInspectingIncident(incident);
                          setZoomLevel(1);
                        }}
                      />
                      <button
                        onClick={() => {
                          setInspectingIncident(incident);
                          setZoomLevel(1);
                        }}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1 border border-white/20 transition hover:scale-105"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-300" />
                        <span>Inspect Picture</span>
                      </button>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white font-bold text-[10px] flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Photo Attached</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                      <span className="text-[11px] font-semibold">No Picture Attached</span>
                      <p className="text-[10px] text-slate-500">Eyewitness text report</p>
                    </div>
                  )}

                  {/* Severity Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded text-white uppercase shadow-sm ${
                        incident.severity === 'critical'
                          ? 'bg-red-600'
                          : incident.severity === 'high'
                          ? 'bg-orange-500'
                          : incident.severity === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                </div>

                {/* Incident Information */}
                <div className="p-4 space-y-2.5 flex-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      {incident.category.replace('_', ' ')} • {incident.district}
                    </span>
                    <h4 className="font-bold text-sm text-white leading-snug line-clamp-2 mt-0.5">
                      {incident.title}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {incident.description}
                  </p>

                  {/* Format & Verification Checklist Box */}
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700/80 text-[11px] space-y-1 text-slate-300">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{incident.locationName}</span>
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-0.5 font-mono"
                      >
                        <span>{incident.latitude.toFixed(4)}°, {incident.longitude.toFixed(4)}°</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1 flex-wrap text-[11px]">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="font-semibold text-white">{incident.reporterName}</span>
                      </span>

                      {incident.reporterPhone ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <a
                            href={createWhatsAppUrl('+501', incident.reporterPhone, WhatsAppTemplates.incidentFollowup(incident))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm transition hover:scale-105"
                            title={`Send WhatsApp message to ${incident.reporterName} (${incident.reporterPhone})`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${incident.reporterPhone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/50 shadow-sm transition"
                            title="Call citizen directly to verify emergency information"
                          >
                            <PhoneCall className="w-3 h-3 text-emerald-400" />
                            <span>Call</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              openChatWithCitizen({
                                id: incident.reporterId,
                                displayName: incident.reporterName,
                                phone: incident.reporterPhone,
                                email: '',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a050e] hover:bg-[#3d0817] text-amber-300 text-[10px] font-bold border border-[#d4af37]/50 transition"
                            title="Open live dispatch chat with reporter"
                          >
                            <MessageSquare className="w-3 h-3 text-[#d4af37]" />
                            <span>Chat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDirectorySearchQuery(incident.reporterName || incident.reporterPhone || '');
                              setActiveAdminTab('users');
                            }}
                            className="p-1 rounded hover:bg-white/10 text-amber-300 hover:text-white transition"
                            title="View registered citizen record in directory"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[10px]">No phone logged</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold pt-0.5">
                      <FileCheck2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Sworn Declaration Affirmed under Belize Law</span>
                    </div>
                  </div>
                </div>

                {/* Administrator Action Buttons */}
                <div className="p-3 bg-slate-900/60 border-t border-slate-700 flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(incident)}
                    disabled={isProcessing === incident.id}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Publish</span>
                  </button>

                  <button
                    onClick={() => setRejectingIncidentId(incident.id)}
                    disabled={isProcessing === incident.id}
                    className="py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs transition border border-slate-600"
                    title="Reject or mark as false alarm"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingIncidentId(incident.id)}
                    disabled={isProcessing === incident.id}
                    className="py-2 px-2.5 rounded-lg bg-red-950/70 hover:bg-red-800 text-red-300 hover:text-white font-bold text-xs transition border border-red-700/60"
                    title="Permanently remove / delete this incident"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picture & Format Inspector Modal */}
      {inspectingIncident && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-2xl border-2 border-slate-700 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">
                  Format & Picture Authenticity Review
                </span>
                <h3 className="font-black text-sm sm:text-base text-white leading-tight">
                  {inspectingIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingIncident(null)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Image Viewer & Format Data */}
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
              {/* Picture Viewer (7 cols) */}
              <div className="md:col-span-7 bg-black p-4 flex flex-col items-center justify-center min-h-[300px] relative border-b md:border-b-0 md:border-r border-slate-700">
                {inspectingIncident.imageUrl ? (
                  <div className="relative overflow-hidden w-full h-full flex items-center justify-center">
                    <img
                      src={inspectingIncident.imageUrl}
                      alt={inspectingIncident.title}
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="max-h-[55vh] max-w-full object-contain rounded-lg transition-transform duration-150"
                    />
                    {/* Zoom Controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700 text-xs">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-[11px] px-1 font-bold">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                        title="Reset Zoom"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-slate-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">No Photo Uploaded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Citizen reported via description and verified coordinates.
                    </p>
                  </div>
                )}
              </div>

              {/* Format & Incident Verification Details (5 cols) */}
              <div className="md:col-span-5 p-5 space-y-4 bg-slate-900 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Incident Description
                    </h4>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-slate-800 p-3 rounded-lg border border-slate-700">
                      {inspectingIncident.description}
                    </p>
                  </div>

                  {/* Format Checklist */}
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 text-xs">
                    <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Format Verification Checklist
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Belize District: <strong>{inspectingIncident.district}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Location Landmark: <strong>{inspectingIncident.locationName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>GPS Coordinates: <strong className="font-mono">{inspectingIncident.latitude.toFixed(5)}°, {inspectingIncident.longitude.toFixed(5)}°</strong></span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-[10px] uppercase font-bold text-amber-400 block">Submitter Contact</span>
                        <span className="font-semibold text-white">{inspectingIncident.reporterName}</span>
                        {inspectingIncident.reporterPhone ? (
                          <span className="block text-emerald-300 font-mono text-[11px]">{inspectingIncident.reporterPhone}</span>
                        ) : (
                          <span className="block text-slate-500 text-[10px] italic">No phone logged</span>
                        )}
                      </div>
                      {inspectingIncident.reporterPhone && (
                        <a
                          href={`tel:${inspectingIncident.reporterPhone.replace(/\s+/g, '')}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                          title="Call citizen to verify emergency information"
                        >
                          <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                          <span>Call to Verify</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sworn Declaration Affirmed under Belize Law</span>
                    </div>
                  </div>
                </div>

                {/* Modal Approval Buttons */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(inspectingIncident)}
                    disabled={isProcessing === inspectingIncident.id}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Broadcast to Live Map</span>
                  </button>
                  <button
                    onClick={() => setRejectingIncidentId(inspectingIncident.id)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setDeletingIncidentId(inspectingIncident.id)}
                    className="py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-800 text-red-200 font-bold text-xs border border-red-700/60 transition flex items-center gap-1.5"
                    title="Permanently remove / delete incident"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      {rejectingIncidentId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white max-w-md w-full rounded-2xl border-2 border-red-500/80 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  Reject Incident Report
                </h4>
                <p className="text-xs text-slate-400">
                  This report will be archived as invalid or false alarm.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Rejection Reason (Logged in system timeline):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setRejectingIncidentId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingIncidentId)}
                disabled={isProcessing === rejectingIncidentId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Incident Confirmation Dialog */}
      {deletingIncidentId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c040a] text-white max-w-md w-full rounded-2xl border-2 border-red-500 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                <Trash2 className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  Permanently Delete Incident
                </h4>
                <p className="text-xs text-red-300">
                  Are you sure you want to completely remove this incident record?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-[#120206] p-3 rounded-xl border border-red-900/60 leading-relaxed">
              This report will be completely purged from the Belize emergency database, map pins, and feeds. This action is irreversible.
            </p>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-[#841c34]">
              <button
                type="button"
                onClick={() => setDeletingIncidentId(null)}
                disabled={isProcessing === deletingIncidentId}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#28050e] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingIncidentId)}
                disabled={isProcessing === deletingIncidentId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isProcessing === deletingIncidentId ? 'Deleting...' : 'Confirm Delete Incident'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Dispatches Audit Modal */}
      {showEmailLogs && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white max-w-2xl w-full rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight">
                    Administrator Email Dispatches Audit Log
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Dispatched notifications to {adminEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailLogs(false)}
                className="p-1 rounded-lg bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {emailLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Mail className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">No email dispatches recorded yet.</p>
                  <p className="text-[11px] text-slate-500">
                    When citizens submit an incident, an emergency alert is automatically sent to {adminEmail}.
                  </p>
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cyan-400">
                        {log.subject}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(log.sentAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 flex items-center gap-3">
                      <span>To: <strong>{log.recipient}</strong></span>
                      <span>District: <strong>{log.district}</strong></span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-300 font-bold text-[10px]">
                        ✓ {log.status.toUpperCase()}
                      </span>
                    </div>

                    <pre className="bg-slate-950 p-2.5 rounded-lg text-[10px] text-slate-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto border border-slate-800">
                      {log.bodyText}
                    </pre>

                    <div className="flex justify-end">
                      <a
                        href={createGmailComposeUrl(log)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Gmail</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-800 border-t border-slate-700 text-right">
              <button
                onClick={() => setShowEmailLogs(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
