import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Phone,
  Home,
  CheckCircle2,
  Navigation,
  Edit3,
  Trash2,
  Shield,
  Loader2,
  Zap,
  Accessibility,
  User,
  Maximize2,
  MessageSquare,
} from 'lucide-react';
import { DisabilityRegistration, DisabilityVerificationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  useDisabilityRegistry,
  DISABILITY_TYPE_OPTIONS,
  ASSISTANCE_PRIORITY_OPTIONS,
} from '../context/DisabilityContext';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface DisabilityDetailModalProps {
  registration: DisabilityRegistration | null;
  onClose: () => void;
  onEdit: (reg: DisabilityRegistration) => void;
}

export const DisabilityDetailModal: React.FC<DisabilityDetailModalProps> = ({
  registration,
  onClose,
  onEdit,
}) => {
  const { user, isAdmin } = useAuth();
  const { verifyRegistration, deleteRegistration } = useDisabilityRegistry();

  const [status, setStatus] = useState<DisabilityVerificationStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!registration) return;
    setStatus(registration.verificationStatus || 'pending');
    setAdminNotes(registration.adminNotes || '');
    setSaveSuccess(false);
    setShowDeleteConfirm(false);
    setPhotoZoomOpen(false);
    setErrorMsg(null);
  }, [registration]);

  if (!registration) return null;

  const isOwner = Boolean(user && registration.userId === user.uid);
  const canEdit = isAdmin || isOwner;
  const typeMeta = DISABILITY_TYPE_OPTIONS.find((t) => t.id === registration.disabilityType);
  const priorityMeta = ASSISTANCE_PRIORITY_OPTIONS.find(
    (p) => p.id === registration.assistancePriority
  );

  const handleSaveVerification = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      await verifyRegistration(registration.id, status, adminNotes);
      setIsSaving(false);
      setSaveSuccess(true);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err?.message || 'Could not update verification status.');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteRegistration(registration.id);
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setErrorMsg(err?.message || 'Could not delete registration.');
    }
  };

  const googleMapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${registration.latitude},${registration.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e1526] rounded-2xl shadow-2xl border-2 border-[#d4af37] text-white overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#131d33] via-[#1c2b47] to-[#0e1526] border-b border-[#233555] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 flex-wrap">
              <span style={{ color: typeMeta?.pinColor || '#38bdf8' }}>
                {typeMeta?.label || registration.disabilityType}
              </span>
              <span aria-hidden="true">·</span>
              <span>{registration.district} District</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  registration.verificationStatus === 'verified'
                    ? 'text-emerald-400'
                    : registration.verificationStatus === 'needs_update'
                    ? 'text-orange-400'
                    : 'text-amber-300'
                }
              >
                {registration.verificationStatus === 'verified'
                  ? 'Verified Location'
                  : registration.verificationStatus === 'needs_update'
                  ? 'Needs Update'
                  : 'Pending Admin Verification'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
              {registration.fullName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/90 border border-red-500 text-red-200 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* House Photograph */}
          {registration.houseImageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-[#233555] bg-slate-950">
              <img
                src={registration.houseImageUrl}
                alt={`House photo of ${registration.fullName}`}
                referrerPolicy="no-referrer"
                className="w-full max-h-64 object-cover cursor-pointer"
                onClick={() => setPhotoZoomOpen(true)}
              />
              <button
                type="button"
                onClick={() => setPhotoZoomOpen(true)}
                className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white text-[11px] font-bold border border-white/20 flex items-center gap-1.5 shadow"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#f3c853]" />
                <span>Expand House Photo</span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-[#233555] bg-[#080d1a] flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
              <Home className="w-7 h-7" />
              <span>No house photograph uploaded yet</span>
            </div>
          )}

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2e4a] space-y-2 text-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#f3c853]">
                Contact & Household
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Primary Phone:</span>
                <a
                  href={`tel:${registration.phone}`}
                  className="text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{registration.phone}</span>
                </a>
              </div>
              {registration.emergencyContactName && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Caregiver:</span>
                  <span className="text-white font-semibold">{registration.emergencyContactName}</span>
                </div>
              )}
              {registration.emergencyContactPhone && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Caregiver Phone:</span>
                  <a
                    href={`tel:${registration.emergencyContactPhone}`}
                    className="text-cyan-400 font-mono hover:underline"
                  >
                    {registration.emergencyContactPhone}
                  </a>
                </div>
              )}
              {registration.householdSize && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Household Members:</span>
                  <span className="text-white font-mono tabular-nums">
                    {registration.householdSize}
                  </span>
                </div>
              )}
              <div className="pt-1.5 flex items-center gap-2">
                <a
                  href={createWhatsAppUrl(
                    registration.phone,
                    `Belize Alerts EOC checking in regarding emergency preparedness for ${registration.fullName}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Resident</span>
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2e4a] space-y-2 text-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#f3c853]">
                Pinned Location & Navigation
              </div>
              <div className="text-slate-200 font-medium leading-snug">
                {registration.addressDescription}
              </div>
              <div className="font-mono text-[11px] text-sky-300 tabular-nums">
                {registration.latitude.toFixed(5)}°N, {registration.longitude.toFixed(5)}°W
              </div>
              <div className="pt-1.5">
                <a
                  href={googleMapsDirUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open Google Maps Directions</span>
                </a>
              </div>
            </div>
          </div>

          {/* Support Requirements & Disability Details */}
          <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2e4a] space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#f3c853]">
                Evacuation & Care Requirements
              </span>
              <span className="text-[11px] font-bold text-white">
                Priority: {priorityMeta?.label || registration.assistancePriority}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-200">
                <Accessibility className="w-4 h-4 text-sky-400" />
                <span>
                  Accessible Lift Transport:{' '}
                  <strong className={registration.requiresAccessibleTransport ? 'text-amber-300' : 'text-slate-400'}>
                    {registration.requiresAccessibleTransport ? 'Required' : 'Not Required'}
                  </strong>
                </span>
              </div>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 text-slate-200">
                <Zap className="w-4 h-4 text-red-400" />
                <span>
                  Medical Power Backup:{' '}
                  <strong className={registration.requiresMedicalPower ? 'text-red-300' : 'text-slate-400'}>
                    {registration.requiresMedicalPower ? 'Required' : 'Not Required'}
                  </strong>
                </span>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed pt-1 border-t border-[#182338]">
              {registration.disabilityDetails}
            </p>
          </div>

          {/* Administrator Verification Panel */}
          {isAdmin && (
            <div className="p-4 rounded-xl bg-[#131d33] border border-[#d4af37]/50 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-black text-[#f3c853] uppercase tracking-wider text-[11px]">
                <Shield className="w-4 h-4" />
                <span>Administrator Verification & Dispatch Notes</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'pending', label: 'Pending Review' },
                    { id: 'verified', label: 'Verified Pin & Photo' },
                    { id: 'needs_update', label: 'Needs Update' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatus(s.id)}
                    className={`py-2 px-2.5 rounded-lg font-bold text-[11px] border transition ${
                      status === s.id
                        ? 'bg-[#d4af37] text-slate-950 border-white shadow'
                        : 'bg-[#080d1a] text-slate-300 border-[#233555] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                maxLength={1000}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add field verification notes, nearest responder station, or evacuation assignment..."
                className="w-full p-2.5 rounded-xl bg-[#070b14] border border-[#233555] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d4af37]"
              />

              <div className="flex items-center justify-between gap-2">
                {saveSuccess ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Verification status saved
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Registered by {registration.registeredByEmail}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveVerification}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Verification</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {canEdit && (
            <div className="pt-2 border-t border-[#1e2e4a] flex flex-wrap items-center justify-between gap-2">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-300 font-bold">Remove this registry record?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                  >
                    {isDeleting ? 'Removing...' : 'Confirm Remove'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-950/60 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onEdit(registration)}
                className="px-4 py-2 rounded-xl bg-[#16233b] hover:bg-[#1f3152] border border-[#d4af37]/70 text-[#f3c853] text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile, Pin & House Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen House Photo Lightbox */}
      {photoZoomOpen && registration.houseImageUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPhotoZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPhotoZoomOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={registration.houseImageUrl}
            alt={`House exterior of ${registration.fullName}`}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[90vh] rounded-xl object-contain border border-[#d4af37]/60 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
