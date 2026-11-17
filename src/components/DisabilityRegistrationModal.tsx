import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Camera,
  Upload,
  Locate,
  CheckCircle2,
  Loader2,
  Home,
  Phone,
  User,
  HeartPulse,
  AlertTriangle,
} from 'lucide-react';
import {
  BelizeDistrict,
  DisabilityType,
  AssistancePriority,
  DisabilityRegistration,
} from '../types';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';
import { BelizeGoogleDisabilityMap } from './BelizeGoogleDisabilityMap';
import { useAuth } from '../context/AuthContext';
import {
  useDisabilityRegistry,
  DISABILITY_TYPE_OPTIONS,
  ASSISTANCE_PRIORITY_OPTIONS,
} from '../context/DisabilityContext';

interface DisabilityRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRecord?: DisabilityRegistration | null;
  initialCoordinates?: { lat: number; lng: number } | null;
  initialDistrict?: BelizeDistrict;
  onSuccess?: (id: string) => void;
}

export const DisabilityRegistrationModal: React.FC<DisabilityRegistrationModalProps> = ({
  isOpen,
  onClose,
  editingRecord = null,
  initialCoordinates,
  initialDistrict,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const { addRegistration, updateRegistration } = useDisabilityRegistry();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [disabilityType, setDisabilityType] = useState<DisabilityType>('mobility');
  const [assistancePriority, setAssistancePriority] =
    useState<AssistancePriority>('high_mobility_assist');
  const [requiresAccessibleTransport, setRequiresAccessibleTransport] = useState(true);
  const [requiresMedicalPower, setRequiresMedicalPower] = useState(false);
  const [householdSize, setHouseholdSize] = useState<number>(2);
  const [disabilityDetails, setDisabilityDetails] = useState('');

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoordinates || { lat: 17.4988, lng: -88.1882 }
  );
  const [district, setDistrict] = useState<BelizeDistrict>(initialDistrict || 'Belize');
  const [addressDescription, setAddressDescription] = useState('');
  const [hasManualAddressEdit, setHasManualAddressEdit] = useState(false);

  const [houseImagePreview, setHouseImagePreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{
    lat: number;
    lng: number;
    district: BelizeDistrict;
  } | null>(null);
  const [dragTip, setDragTip] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const getClosestDistrict = (lat: number, lng: number): BelizeDistrict => {
    let closest: BelizeDistrict = 'Belize';
    let minDistance = Infinity;
    BELIZE_DISTRICTS.forEach((d) => {
      const dist = Math.hypot(d.lat - lat, d.lng - lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = d.id;
      }
    });
    return closest;
  };

  // Initialize form when modal opens or editingRecord/initialCoordinates changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSubmittedId(null);
    setShowPrompt(false);
    setDragTip(null);

    if (editingRecord) {
      setFullName(editingRecord.fullName || '');
      setPhone(editingRecord.phone || '');
      setEmergencyContactName(editingRecord.emergencyContactName || '');
      setEmergencyContactPhone(editingRecord.emergencyContactPhone || '');
      setDisabilityType(editingRecord.disabilityType || 'mobility');
      setAssistancePriority(editingRecord.assistancePriority || 'high_mobility_assist');
      setRequiresAccessibleTransport(Boolean(editingRecord.requiresAccessibleTransport));
      setRequiresMedicalPower(Boolean(editingRecord.requiresMedicalPower));
      setHouseholdSize(editingRecord.householdSize || 1);
      setDisabilityDetails(editingRecord.disabilityDetails || '');
      setCoords({ lat: editingRecord.latitude, lng: editingRecord.longitude });
      setDistrict(editingRecord.district || 'Belize');
      setAddressDescription(editingRecord.addressDescription || '');
      setHasManualAddressEdit(true);
      setHouseImagePreview(editingRecord.houseImageUrl || null);
    } else {
      setFullName(profile?.displayName || '');
      setPhone(profile?.fullPhone || profile?.phone || '');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setDisabilityType('mobility');
      setAssistancePriority('high_mobility_assist');
      setRequiresAccessibleTransport(true);
      setRequiresMedicalPower(false);
      setHouseholdSize(2);
      setDisabilityDetails('');
      setCoords(initialCoordinates || { lat: 17.4988, lng: -88.1882 });
      setDistrict(initialDistrict || 'Belize');
      setAddressDescription('');
      setHasManualAddressEdit(false);
      setHouseImagePreview(null);
    }
  }, [isOpen, editingRecord, initialCoordinates, initialDistrict, profile]);

  // Reverse geocode when pin coordinates move (unless user already typed custom address landmarks)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const currentDistrict = getClosestDistrict(coords.lat, coords.lng);
    setDistrict(currentDistrict);

    if (!hasManualAddressEdit) {
      if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: coords.lat, lng: coords.lng } },
            (results: any, status: any) => {
              if (!isMounted) return;
              if (status === 'OK' && results && results[0]?.formatted_address) {
                setAddressDescription(results[0].formatted_address);
              } else {
                setAddressDescription(
                  `${currentDistrict} District (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W)`
                );
              }
            }
          );
        } catch {
          setAddressDescription(
            `${currentDistrict} District (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W)`
          );
        }
      } else {
        setAddressDescription(
          `${currentDistrict} District (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W)`
        );
      }
    }

    return () => {
      isMounted = false;
    };
  }, [coords.lat, coords.lng, isOpen, hasManualAddressEdit]);

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const closestDist = getClosestDistrict(lat, lng);
        setIsLocating(false);
        setPendingCoords({ lat, lng, district: closestDist });
        setShowPrompt(true);
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage(
          `Could not detect GPS: ${err.message}. Click or drag the blue pin directly on the map.`
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmGPSYes = () => {
    if (!pendingCoords) return;
    setHasManualAddressEdit(false);
    setCoords({ lat: pendingCoords.lat, lng: pendingCoords.lng });
    setDistrict(pendingCoords.district);
    setShowPrompt(false);
    setDragTip('House location locked to your verified current GPS coordinates.');
  };

  const handleConfirmGPSNo = () => {
    if (!pendingCoords) return;
    setHasManualAddressEdit(false);
    setCoords({ lat: pendingCoords.lat, lng: pendingCoords.lng });
    setDistrict(pendingCoords.district);
    setShowPrompt(false);
    setDragTip('Drag the blue house pin on the map onto the exact house.');
  };

  const handleHouseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value immediately so re-selecting or replacing never gets ignored
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image photo (JPG, PNG, WebP) of the house.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 850;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          let compressed = canvas.toDataURL('image/jpeg', 0.78);
          if (compressed.length > 460000) {
            compressed = canvas.toDataURL('image/jpeg', 0.55);
          }
          setHouseImagePreview(compressed);
          setErrorMessage(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('You must be signed in to submit a disability registration.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage('Please enter the full name of the person with a disability.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please provide a contact telephone number.');
      return;
    }
    if (!disabilityDetails.trim()) {
      setErrorMessage('Please describe specific disability support or evacuation needs.');
      return;
    }
    if (!addressDescription.trim()) {
      setErrorMessage('Please provide the street address or house landmarks.');
      return;
    }
    if (!houseImagePreview) {
      setErrorMessage(
        'Please attach a picture of the house so emergency responders and administrators can locate the residence.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        disabilityType,
        disabilityDetails: disabilityDetails.trim(),
        assistancePriority,
        requiresAccessibleTransport,
        requiresMedicalPower,
        householdSize: householdSize || 1,
        district,
        addressDescription: addressDescription.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        houseImageUrl: houseImagePreview,
      };

      if (editingRecord) {
        await updateRegistration(editingRecord.id, payload);
        setIsSubmitting(false);
        setSubmittedId(editingRecord.id);
        if (onSuccess) onSuccess(editingRecord.id);
      } else {
        const newId = await addRegistration(payload);
        setIsSubmitting(false);
        setSubmittedId(newId);
        if (onSuccess) onSuccess(newId);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      let msg = err?.message || 'Failed to save disability registration.';
      try {
        if (msg.includes('{') && msg.includes('}')) {
          const parsed = JSON.parse(msg.substring(msg.indexOf('{'), msg.lastIndexOf('}') + 1));
          if (parsed.error) msg = `Error: ${parsed.error}`;
        }
      } catch {
        // use msg
      }
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0e1526] rounded-2xl shadow-2xl border-2 border-[#d4af37] text-white overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#4d0718] via-[#6b0f24] to-[#1e293b] text-white flex items-center justify-between border-b border-[#d4af37]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-950/90 border border-[#d4af37]/70 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-[#f3c853]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight tracking-tight">
                {editingRecord
                  ? 'Update Disability Registry & House Location'
                  : 'Register Person with Disability & Mark House Pin'}
              </h2>
              <p className="text-[11px] text-[#f3c853] font-semibold">
                Confidential EOC Registry · Pinpoints house location & photo for Belize responders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedId ? (
          <div className="p-6 text-center space-y-4 overflow-y-auto flex-1">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {editingRecord
                  ? 'Disability Registration Updated'
                  : 'Disability Registration Recorded'}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                The residence pin, house photograph, and disability support profile are now saved on
                the Belize Alerts Administrator Disability Map.
              </p>
            </div>

            <div className="bg-[#080d1a] p-4 rounded-xl border border-[#233555] text-xs text-slate-200 max-w-md mx-auto text-left space-y-1.5">
              <div className="font-bold text-[#f3c853]">{fullName}</div>
              <div>
                Disability Type:{' '}
                <strong className="text-white">
                  {DISABILITY_TYPE_OPTIONS.find((t) => t.id === disabilityType)?.label}
                </strong>
              </div>
              <div>
                District: <strong className="text-white">{district} District</strong>
              </div>
              <div className="font-mono text-sky-300 tabular-nums">
                Pinned Location: {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°W
              </div>
              <div>
                Address: <span className="text-slate-300">{addressDescription}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmittedId(null);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 font-black text-xs shadow-md transition"
            >
              Return to Disability Registry Map
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-950/90 border border-red-500 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SECTION 1: PERSON & DISABILITY INFORMATION */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-[#1e2e4a] pb-1.5">
                <User className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#f3c853]">
                  1. Resident & Disability Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Full Name of Person *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Perez"
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233555] text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={40}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +501 610-4455"
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233555] text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Caregiver / Next of Kin Name
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Optional family contact"
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233555] text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Caregiver Phone
                    </label>
                    <input
                      type="tel"
                      maxLength={40}
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="+501 ..."
                      className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233555] text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Household
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(Number(e.target.value) || 1)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#070b14] border border-[#233555] text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>

              {/* Disability Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  Disability Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DISABILITY_TYPE_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setDisabilityType(opt.id)}
                      className={`p-2 rounded-xl text-left text-xs transition border ${
                        disabilityType === opt.id
                          ? 'bg-sky-900/90 border-[#d4af37] text-white ring-1 ring-[#d4af37] font-bold shadow'
                          : 'bg-[#080d1a] border-[#1e2e4a] text-slate-300 hover:bg-[#131d33]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: opt.pinColor }}
                        />
                        <span className="truncate font-bold">{opt.shortLabel}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {opt.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assistance Priority */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  Evacuation & Emergency Priority *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASSISTANCE_PRIORITY_OPTIONS.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setAssistancePriority(p.id)}
                      className={`p-2 rounded-xl text-left transition border ${
                        assistancePriority === p.id
                          ? `${p.badgeClass} border-white ring-2 ring-[#d4af37] shadow font-bold`
                          : 'bg-[#080d1a] border-[#1e2e4a] text-slate-300 hover:bg-[#131d33]'
                      }`}
                    >
                      <div className="text-[11px] font-black leading-tight">{p.label}</div>
                      <div className="text-[9px] opacity-85 line-clamp-2 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Support Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#080d1a] border border-[#233555] cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={requiresAccessibleTransport}
                    onChange={(e) => setRequiresAccessibleTransport(e.target.checked)}
                    className="w-4 h-4 accent-[#d4af37] rounded cursor-pointer"
                  />
                  <span>Requires Wheelchair / Lift Vehicle Evacuation</span>
                </label>
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#080d1a] border border-[#233555] cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={requiresMedicalPower}
                    onChange={(e) => setRequiresMedicalPower(e.target.checked)}
                    className="w-4 h-4 accent-[#d4af37] rounded cursor-pointer"
                  />
                  <span>Requires Backup Medical Power / Oxygen</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Specific Disability Notes, Mobility Equipment & Care Requirements *
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={1500}
                  value={disabilityDetails}
                  onChange={(e) => setDisabilityDetails(e.target.value)}
                  placeholder="Describe wheelchair access, medication/oxygen requirements, communication needs, or entry instructions for rescue responders..."
                  className="w-full p-2.5 rounded-xl bg-[#070b14] border border-[#233555] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* SECTION 2: MARK PIN ON INTERACTIVE MAP */}
            <div className="p-3.5 bg-[#0a101f] border border-[#d4af37]/60 rounded-2xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-black text-[#f3c853] uppercase tracking-wider">
                    2. Pin Exact House Location on Map *
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 rounded-lg shadow transition disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Locating GPS...</span>
                    </>
                  ) : (
                    <>
                      <Locate className="w-3.5 h-3.5" />
                      <span>Use My Current GPS</span>
                    </>
                  )}
                </button>
              </div>

              {showPrompt && pendingCoords && (
                <div className="p-3 bg-[#17253d] border-2 border-[#d4af37] rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                    <Locate className="w-4 h-4 text-[#d4af37]" />
                    <span>
                      GPS Detected: {pendingCoords.lat.toFixed(5)}°N, {pendingCoords.lng.toFixed(5)}°W ({pendingCoords.district} District)
                    </span>
                  </div>
                  <p className="text-xs text-white font-bold">
                    Is the registered house at your current GPS location?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmGPSYes}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-lg shadow transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Yes, Lock House Here</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmGPSNo}
                      className="px-3 py-1.5 bg-[#080d1a] border border-[#d4af37]/60 hover:bg-[#1e2c45] text-amber-200 text-xs font-bold rounded-lg transition"
                    >
                      No, Let Me Drag Pin
                    </button>
                  </div>
                </div>
              )}

              {dragTip && (
                <div className="p-2 bg-[#070b14] text-sky-200 rounded-lg text-xs flex items-center justify-between border border-sky-500/40">
                  <span>{dragTip}</span>
                  <button
                    type="button"
                    onClick={() => setDragTip(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="rounded-xl overflow-hidden border-2 border-[#d4af37]/70 shadow-inner">
                <BelizeGoogleDisabilityMap
                  registrations={[]}
                  isPickerMode={true}
                  pickerCoordinates={coords}
                  onCoordinatesChange={(newCoords) => {
                    setCoords(newCoords);
                  }}
                  className="h-[280px] w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as BelizeDistrict)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#070b14] border border-[#233555] text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    {BELIZE_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Street Address & House Color / Landmarks *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={300}
                    value={addressDescription}
                    onChange={(e) => {
                      setHasManualAddressEdit(true);
                      setAddressDescription(e.target.value);
                    }}
                    placeholder="e.g. #14 Hibiscus St, yellow concrete house with white gate"
                    className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-[#233555] text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: PICTURE OF THE HOUSE */}
            <div className="p-3.5 bg-[#0a101f] border border-[#233555] rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#f3c853] uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>3. Picture of the House (Used to Identify Location) *</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                {houseImagePreview ? (
                  <div className="relative w-36 h-28 rounded-xl overflow-hidden border-2 border-[#d4af37] shadow shrink-0 bg-slate-900">
                    <img
                      src={houseImagePreview}
                      alt="Registered house exterior"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setHouseImagePreview(null)}
                      title="Remove house picture"
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-36 h-28 rounded-xl border-2 border-dashed border-[#2c4268] bg-[#070b14] flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <Home className="w-7 h-7 stroke-1 text-slate-400" />
                    <span className="text-[10px] mt-1 text-slate-400">No House Photo</span>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Upload or snap a clear front photo of the house, gate, or yard entrance. This
                    picture is displayed on the Administrator Map so NEMO and emergency responders
                    can visually confirm the exact house during an evacuation or storm.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16233b] border border-[#d4af37]/70 hover:bg-[#1f3152] text-amber-200 text-xs font-bold transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{houseImagePreview ? 'Replace House Picture' : 'Upload / Take House Photo'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleHouseImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1e2e4a]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/10 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 text-xs font-black shadow-lg transition disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Registration...</span>
                  </>
                ) : (
                  <>
                    <HeartPulse className="w-4 h-4" />
                    <span>
                      {editingRecord
                        ? 'Save Changes to Registry'
                        : 'Submit Disability Registration'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
