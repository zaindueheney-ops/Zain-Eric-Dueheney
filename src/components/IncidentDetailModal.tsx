import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  User,
  Shield,
  Activity,
  Phone,
  Send,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Truck,
  ExternalLink,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { EmergencyIncident, IncidentLog, EmergencyStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { useChat } from '../context/ChatContext';
import {
  BELIZE_GOVERNMENT_RESPONSE_UNITS,
  ALL_BELIZE_UNITS,
} from '../data/belizeGovernmentUnits';
import { createWhatsAppUrl, WhatsAppTemplates } from '../utils/whatsapp';

interface IncidentDetailModalProps {
  incident: EmergencyIncident | null;
  onClose: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
}) => {
  const { user, profile, isResponder, isAdmin } = useAuth();
  const { updateIncidentStatus, fetchIncidentLogs, deleteIncident } = useIncidents();
  const { openChatWithCitizen } = useChat();

  const [logs, setLogs] = useState<IncidentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Update form state
  const [newStatus, setNewStatus] = useState<EmergencyStatus>('in_progress');
  const [assignedUnit, setAssignedUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [responderNote, setResponderNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!incident) return;
    setNewStatus(incident.status);
    const unit = incident.assignedUnit || '';
    setAssignedUnit(unit);
    setIsCustomUnit(Boolean(unit && !ALL_BELIZE_UNITS.includes(unit)));
    setResponderNote('');
    setUpdateSuccess(false);
    setUpdateError(null);

    // Fetch logs
    setLoadingLogs(true);
    fetchIncidentLogs(incident.id)
      .then((data) => {
        setLogs(data);
        setLoadingLogs(false);
      })
      .catch((err) => {
        console.error('Failed to load incident logs', err);
        setLoadingLogs(false);
      });
  }, [incident]);

  if (!incident) return null;

  // Operational control remains strictly with Administrators. Citizens cannot dispatch or alter status.
  const canUpdate = Boolean(isAdmin);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      await updateIncidentStatus(
        incident.id,
        newStatus,
        responderNote,
        assignedUnit
      );
      setIsUpdating(false);
      setUpdateSuccess(true);
      setResponderNote('');

      // Refresh logs
      const updatedLogs = await fetchIncidentLogs(incident.id);
      setLogs(updatedLogs);
    } catch (err: any) {
      setIsUpdating(false);
      setUpdateError(err.message || 'Failed to update incident status.');
    }
  };

  const handleDeleteIncident = async () => {
    if (!incident) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteIncident(incident.id);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setDeleteError(err.message || 'Failed to remove incident.');
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-600 text-white border-red-700';
      case 'high':
        return 'bg-orange-500 text-white border-orange-600';
      case 'medium':
        return 'bg-amber-500 text-white border-amber-600';
      default:
        return 'bg-emerald-600 text-white border-emerald-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'dispatched':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'false_alarm':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Google Maps navigation URL
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#1e030a] rounded-2xl shadow-2xl border-2 border-[#d4af37] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header (Burgundy & Gold) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#4d0718] via-[#6b0f24] to-[#380714] text-white flex items-center justify-between border-b border-[#d4af37]/60">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider border ${getSeverityBadge(
                incident.severity
              )}`}
            >
              {incident.severity}
            </span>
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(
                incident.status
              )}`}
            >
              {incident.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Remove this incident (Admin Only)"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold border border-red-400 shadow transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remove Incident</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Title & Metadata */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {incident.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                {incident.district} District • {incident.locationName}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {new Date(incident.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Reported by: <strong className="text-white">{incident.reporterName}</strong>
              </span>
            </div>

            {/* Direct Dispatch & WhatsApp Communication Bar */}
            <div className="mt-3 p-3 bg-[#26040d] border border-[#d4af37]/40 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="font-bold text-amber-200 text-xs">
                  Direct Dispatch Communications:
                </span>
                {incident.reporterPhone && (
                  <span className="font-mono text-emerald-300 text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    {incident.reporterPhone}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {incident.reporterPhone && (
                  <a
                    href={createWhatsAppUrl('+501', incident.reporterPhone, WhatsAppTemplates.incidentFollowup(incident))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition hover:scale-105 active:scale-95"
                    title={`Send WhatsApp message to reporter (${incident.reporterPhone})`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Reporter</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                )}

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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3b0816] hover:bg-[#520b1f] text-amber-200 font-bold text-xs border border-[#d4af37]/60 shadow transition hover:scale-105 active:scale-95"
                  title="Open live in-app dispatch chat with the reporter"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Open In-App Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Picture of Issue (if uploaded) */}
          {incident.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-[#d4af37]/40 bg-slate-950 max-h-[380px] shadow-inner flex items-center justify-center">
              <img
                src={incident.imageUrl}
                alt={incident.title}
                className="w-full h-full object-contain max-h-[380px]"
              />
            </div>
          )}

          {/* Incident Geolocation & Navigation Action Box */}
          <div className="p-4 bg-[#2b0510] border border-[#d4af37]/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500" />
                GPS Coordinates
              </div>
              <div className="font-mono text-xs text-amber-200 bg-[#130206] px-2.5 py-1 rounded border border-[#d4af37]/30 inline-block">
                Lat: {incident.latitude.toFixed(5)}° | Lng: {incident.longitude.toFixed(5)}°
              </div>
            </div>

            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition hover:scale-105 active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              Navigate / Open in Maps
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>

          {/* Incident Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Incident Situation Report
            </h3>
            <p className="text-sm text-slate-100 leading-relaxed bg-[#2b0510] p-4 rounded-xl border border-[#d4af37]/30 whitespace-pre-line">
              {incident.description}
            </p>
          </div>

          {/* Assigned Units & Operational Notes */}
          {(incident.assignedUnit || incident.responderNotes) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {incident.assignedUnit && (
                <div className="p-4 bg-[#2b0510] border border-[#d4af37]/40 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-400" />
                    Assigned Response Unit
                  </span>
                  <p className="text-xs font-semibold text-white">
                    {incident.assignedUnit}
                  </p>
                </div>
              )}

              {incident.responderNotes && (
                <div className="p-4 bg-[#2b0510] border border-purple-500/40 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Latest Operational Log
                  </span>
                  <p className="text-xs text-slate-200">
                    {incident.responderNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status Update Form (Exclusively For Administrators / Dispatch Commanders) */}
          {canUpdate ? (
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-sm font-bold tracking-tight">
                    Update Incident Status & Dispatch Notes
                  </h4>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {isAdmin ? 'Admin Clearance' : isResponder ? 'Responder Mode' : 'Reporter Update'}
                </span>
              </div>

              {updateSuccess && (
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Status successfully updated and recorded in the audit log.</span>
                </div>
              )}

              {updateError && (
                <div className="p-2.5 bg-red-500/20 border border-red-400/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{updateError}</span>
                </div>
              )}

              <form onSubmit={handleStatusSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New Response Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as EmergencyStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-yellow-400"
                    >
                      <option value="reported">Reported (Pending Dispatch)</option>
                      <option value="dispatched">Dispatched (Units En Route)</option>
                      <option value="in_progress">In Progress (Active Operations)</option>
                      <option value="resolved">Resolved (Hazard Cleared)</option>
                      <option value="false_alarm">False Alarm (Investigated)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Assigned Response Unit / Ministry
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomUnit(!isCustomUnit)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium transition"
                      >
                        {isCustomUnit ? '← Select from ministries/NEMO' : '+ Type custom unit'}
                      </button>
                    </div>

                    {!isCustomUnit ? (
                      <select
                        value={assignedUnit}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsCustomUnit(true);
                          } else {
                            setAssignedUnit(val);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-yellow-400"
                      >
                        <option value="">-- Select Responding Department / Ministry --</option>
                        {assignedUnit && !ALL_BELIZE_UNITS.includes(assignedUnit) && (
                          <option value={assignedUnit}>
                            📍 {assignedUnit} (Current Assignment)
                          </option>
                        )}
                        {BELIZE_GOVERNMENT_RESPONSE_UNITS.map((group) => (
                          <optgroup
                            key={group.category}
                            label={group.category}
                            className="bg-slate-900 text-amber-300 font-bold"
                          >
                            {group.units.map((unitName) => (
                              <option
                                key={unitName}
                                value={unitName}
                                className="bg-slate-950 text-white font-normal py-1"
                              >
                                {unitName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="__custom__" className="text-amber-300 font-medium">
                          ✏️ Other / Specific Unit Name (Type custom)...
                        </option>
                      </select>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={assignedUnit}
                          onChange={(e) => setAssignedUnit(e.target.value)}
                          placeholder="e.g. NEMO Cayo Quick Response Unit, Fire Station #1"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                          autoFocus
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Type specific brigade, station, or vehicle tag</span>
                          <button
                            type="button"
                            onClick={() => setIsCustomUnit(false)}
                            className="text-amber-400 hover:underline"
                          >
                            Return to Ministries & NEMO list
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Operational Update / Action Taken
                  </label>
                  <input
                    type="text"
                    value={responderNote}
                    onChange={(e) => setResponderNote(e.target.value)}
                    placeholder="e.g. Fire crew established water line. Road diversion active."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Update...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Publish Status Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-3.5 bg-[#0b1220] border border-[#1e2e4a] rounded-xl text-xs text-slate-300 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Operational Dispatch Notice:</strong> Incident dispatching, response unit assignment, and operational status changes are restricted to Authorized Administrators and NEMO Dispatchers. Citizens have real-time visibility into incident status and logs.
              </span>
            </div>
          )}

          {/* Operational Timeline Audit Log */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Chronological Response Timeline & Logs
            </h4>

            {loadingLogs ? (
              <div className="p-4 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading timeline...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-4 bg-[#2b0510] border border-[#d4af37]/30 rounded-xl text-center text-xs text-slate-400">
                Initial report submitted. No further responder actions logged yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#d4af37]/30">
                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#1e030a] shadow"></div>
                    <div className="bg-[#2b0510] border border-[#d4af37]/30 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-semibold text-amber-200">
                          {log.authorName} ({log.authorRole || 'Responder'})
                        </span>
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#380714] text-amber-300 border border-[#d4af37]/40">
                          {log.newStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-200">{log.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Incident Removal Danger Zone */}
          {isAdmin && (
            <div className="p-4 bg-red-950/40 border border-red-600/50 rounded-2xl space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    Administrator Incident Removal
                  </h5>
                  <p className="text-[11px] text-red-200/80">
                    Permanently delete this emergency report from the active dispatch system and public map.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition shrink-0"
                >
                  Delete Incident
                </button>
              </div>

              {deleteError && (
                <div className="p-2 bg-red-900/60 border border-red-500 rounded-lg text-xs text-red-200">
                  {deleteError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1f030a] border-2 border-red-600 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-white">
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    Permanently Delete Incident?
                  </h3>
                  <p className="text-[11px] text-red-200/80">
                    Authorized Administrator Action
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#130206] rounded-xl border border-red-900/50 space-y-1 text-xs">
                <div className="font-bold text-white line-clamp-1">{incident.title}</div>
                <div className="text-slate-300 text-[11px]">
                  District: <strong className="text-amber-300">{incident.district}</strong> • {incident.locationName}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Reported by: {incident.reporterName}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete this emergency incident? This action removes the incident from all maps, audit logs, and live dispatch feeds. <strong className="text-red-400">This action cannot be undone.</strong>
              </p>

              {deleteError && (
                <div className="p-2.5 bg-red-900/50 border border-red-500 rounded-xl text-xs text-red-200">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-red-950">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteIncident}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Yes, Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
