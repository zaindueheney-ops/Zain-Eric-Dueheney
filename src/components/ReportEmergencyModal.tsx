import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Camera,
  Upload,
  AlertTriangle,
  Flame,
  Activity,
  CloudRain,
  Car,
  ShieldAlert,
  Anchor,
  Zap,
  HelpCircle,
  Locate,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  BelizeDistrict,
  EmergencyCategory,
  EmergencySeverity
} from '../types';
import { BELIZE_DISTRICTS, BELIZE_CENTER } from '../data/belizeGeo';
import { BelizeGoogleIncidentMap } from './BelizeGoogleIncidentMap';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';

interface ReportEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (incidentId: string) => void;
  initialCoordinates?: { lat: number; lng: number } | null;
  initialDistrict?: BelizeDistrict;
  isAtCurrentLocation?: boolean;
}

const CATEGORIES: { id: EmergencyCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'fire', label: 'Fire & Rescue', icon: <Flame className="w-4 h-4" />, color: 'bg-red-600 text-white' },
  { id: 'medical', label: 'Medical Emergency', icon: <Activity className="w-4 h-4" />, color: 'bg-rose-600 text-white' },
  { id: 'accident', label: 'Traffic Accident', icon: <Car className="w-4 h-4" />, color: 'bg-amber-600 text-white' },
  { id: 'flood_weather', label: 'Flood & Weather', icon: <CloudRain className="w-4 h-4" />, color: 'bg-blue-600 text-white' },
  { id: 'crime_security', label: 'Police & Security', icon: <ShieldAlert className="w-4 h-4" />, color: 'bg-purple-600 text-white' },
  { id: 'marine_coastal', label: 'Coast Guard & Marine', icon: <Anchor className="w-4 h-4" />, color: 'bg-teal-600 text-white' },
  { id: 'infrastructure', label: 'Infrastructure & Hazmat', icon: <Zap className="w-4 h-4" />, color: 'bg-orange-600 text-white' },
  { id: 'other', label: 'Other Hazard', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-slate-700 text-white' },
];

export const ReportEmergencyModal: React.FC<ReportEmergencyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCoordinates,
  initialDistrict,
  isAtCurrentLocation = false,
}) => {
  const { user, profile, signInWithGoogle, setShowRegisterModal, setShowAuthGreetingModal } = useAuth();
  const { reportIncident } = useIncidents();

  // Form states - Title and Location/Street name fields removed as requested
  const [category, setCategory] = useState<EmergencyCategory>('fire');
  const [severity, setSeverity] = useState<EmergencySeverity>('critical');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoordinates || {
      lat: 17.4988,
      lng: -88.1882,
    }
  );
  const [district, setDistrict] = useState<BelizeDistrict>(initialDistrict || 'Belize');
  const [displayAddress, setDisplayAddress] = useState<string>('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActualEmergencyDeclared, setIsActualEmergencyDeclared] = useState(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);

  // In-modal location confirmation prompt
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number; district: BelizeDistrict } | null>(null);
  const [dragTip, setDragTip] = useState<string | null>(null);

  // Helper to calculate closest district from pin coordinates
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

  // Sync coords and reverse geocode for display when coordinates or modal open changes
  useEffect(() => {
    if (isOpen) {
      setIsActualEmergencyDeclared(false);
      setErrorMessage(null);
      setSubmittedIncidentId(null);
    }
    if (initialCoordinates) {
      setCoords(initialCoordinates);
    }
  }, [initialCoordinates, isOpen]);

  // Derive district and optional reverse geocoded display address whenever pin coordinates move
  useEffect(() => {
    let isMounted = true;
    const currentDistrict = getClosestDistrict(coords.lat, coords.lng);
    setDistrict(currentDistrict);

    // Reverse geocode strictly for display purpose without overriding coords
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ location: { lat: coords.lat, lng: coords.lng } }, (results: any, status: any) => {
          if (!isMounted) return;
          if (status === 'OK' && results && results[0]?.formatted_address) {
            setDisplayAddress(results[0].formatted_address);
          } else {
            setDisplayAddress(`${currentDistrict} District (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W)`);
          }
        });
      } catch {
        setDisplayAddress(`${currentDistrict} District (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W)`);
      }
    } else {
      setDisplayAddress(`${currentDistrict} District (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W)`);
    }

    return () => {
      isMounted = false;
    };
  }, [coords.lat, coords.lng]);

  if (!isOpen) return null;

  // Handle Phone GPS location detection
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
        setErrorMessage(`Could not obtain GPS: ${err.message}. Please click or drag the pin on the map.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmGPSYes = () => {
    if (!pendingCoords) return;
    setCoords({ lat: pendingCoords.lat, lng: pendingCoords.lng });
    setDistrict(pendingCoords.district);
    setShowPrompt(false);
    setDragTip('✓ Incident location set to your verified phone GPS position.');
  };

  const handleConfirmGPSNo = () => {
    if (!pendingCoords) return;
    setCoords({ lat: pendingCoords.lat, lng: pendingCoords.lng });
    setDistrict(pendingCoords.district);
    setShowPrompt(false);
    setDragTip('📍 Drag the red pin on the interactive map to the exact emergency location.');
  };

  // Image Upload and Compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 900;

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
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          setImagePreview(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Emergency Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must sign in with your account to file an official emergency incident.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a detailed description of the emergency or hazard.');
      return;
    }
    if (!isActualEmergencyDeclared) {
      setErrorMessage('Please confirm the genuine emergency declaration checkbox before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Auto-generate title from category and first snippet of description
    const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label || 'Emergency';
    const firstSnippet = description.trim().split('\n')[0].substring(0, 80).trim();
    const autoTitle = firstSnippet
      ? `${categoryLabel}: ${firstSnippet}`
      : `${categoryLabel} (${district} District)`;

    // Auto-derived location description from reverse geocoding or district & coordinates
    const locationForRecord = displayAddress || `${district} District (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°W)`;

    try {
      const newId = await reportIncident({
        title: autoTitle,
        category,
        severity,
        district,
        locationName: locationForRecord,
        latitude: coords.lat,
        longitude: coords.lng,
        description: description.trim(),
        imageUrl: imagePreview || undefined,
      });

      setIsSubmitting(false);
      setSubmittedIncidentId(newId);
      if (onSuccess) onSuccess(newId);
    } catch (err: any) {
      setIsSubmitting(false);
      let rawMsg = err?.message || 'Failed to submit incident. Please check details.';
      try {
        if (rawMsg.includes('{') && rawMsg.includes('}')) {
          const jsonStart = rawMsg.indexOf('{');
          const jsonEnd = rawMsg.lastIndexOf('}');
          const parsed = JSON.parse(rawMsg.substring(jsonStart, jsonEnd + 1));
          if (parsed.error) {
            rawMsg = `Submission Error: ${parsed.error}. Please ensure all required emergency fields are filled.`;
          }
        }
      } catch {
        // use rawMsg
      }
      setErrorMessage(rawMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1c0309] rounded-2xl shadow-2xl border-2 border-[#d4af37] text-white overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header (Burgundy & Gold) */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#4d0718] via-[#6b0f24] to-[#380714] text-white flex items-center justify-between border-b border-[#d4af37]/60 shadow-sm">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts Logo"
              className="w-9 h-9 object-cover rounded-xl border border-[#d4af37]/60 shadow"
            />
            <div>
              <h2 className="text-base sm:text-lg font-black leading-none tracking-tight">Report Emergency Incident</h2>
              <p className="text-[11px] text-[#f3c853] font-semibold mt-0.5">Belize Alerts by Zain Dueheney • Live Dispatch Network</p>
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

        {/* Modal Body: Submitted Confirmation Screen OR Streamlined Form */}
        {submittedIncidentId ? (
          <div className="p-6 text-center space-y-4 overflow-y-auto flex-1">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Emergency Report Transmitted
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-amber-950/80 text-amber-300 border border-[#d4af37]/60 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Status: Queued for Administrator Verification</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your emergency incident has been logged in the dispatch registry. An immediate push notification and email alert have been dispatched to Belize Administrator (<strong>zaindueheney@gmail.com</strong>).
            </p>
            <div className="bg-[#24060e] p-3.5 rounded-xl border border-[#d4af37]/40 text-xs text-slate-200 max-w-md mx-auto text-left space-y-1.5">
              <div className="font-bold text-amber-300">Sworn Incident Record:</div>
              <div className="text-[11px] text-slate-300">✓ Coordinates: {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°W</div>
              <div className="text-[11px] text-slate-300">✓ Location: {displayAddress || `${district} District`}</div>
              <div className="text-[11px] text-slate-300">✓ Category: {CATEGORIES.find((c) => c.id === category)?.label}</div>
              <div className="text-[11px] text-slate-300">✓ Sworn Emergency Declaration recorded</div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedIncidentId(null);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c158] hover:to-[#fbbf24] text-slate-950 font-black text-xs shadow-md transition"
              >
                Return to Emergency Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* User auth state reminder */}
            {!user && (
              <div className="p-3 bg-amber-950/80 border border-amber-500/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-amber-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong>Sign In Required:</strong> Please sign in with Google to file an emergency incident.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black rounded-lg shadow whitespace-nowrap transition"
                >
                  Sign In
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-950/90 border border-red-500 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: SELECT INCIDENT CATEGORY */}
              <div>
                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-1.5">
                  1. Incident Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold transition ${
                        category === c.id
                          ? `${c.color} ring-2 ring-[#d4af37] shadow-md`
                          : 'bg-[#26060f] border border-[#841c34] text-slate-200 hover:bg-[#340915]'
                      }`}
                    >
                      {c.icon}
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency & Severity Level Selector */}
              <div>
                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-1.5">
                  Severity / Urgency Level
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {[
                    { id: 'critical', label: 'CRITICAL', desc: 'Life Threat', color: 'bg-red-600 text-white' },
                    { id: 'high', label: 'HIGH', desc: 'Urgent Danger', color: 'bg-orange-600 text-white' },
                    { id: 'medium', label: 'MEDIUM', desc: 'Active Hazard', color: 'bg-[#d4af37] text-slate-950' },
                    { id: 'low', label: 'LOW', desc: 'Advisory', color: 'bg-emerald-600 text-white' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSeverity(s.id as EmergencySeverity)}
                      className={`p-1.5 rounded-xl text-center transition ${
                        severity === s.id
                          ? `${s.color} ring-2 ring-white shadow font-black`
                          : 'bg-[#26060f] border border-[#841c34] text-slate-300 hover:bg-[#340915]'
                      }`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[9px] font-normal opacity-90 truncate">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 2: PINPOINT EXACT INCIDENT LOCATION ON INTERACTIVE MAP */}
              <div className="p-3 bg-[#24060e] border border-[#d4af37]/60 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-black text-amber-200 uppercase tracking-wider">
                      2. Pinpoint Incident Location on Map *
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 rounded-lg shadow transition disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Locating Phone...
                      </>
                    ) : (
                      <>
                        <Locate className="w-3.5 h-3.5" />
                        Detect My GPS
                      </>
                    )}
                  </button>
                </div>

                {/* GPS Location Verification Prompt Card */}
                {showPrompt && pendingCoords && (
                  <div className="p-3 bg-[#380714] border-2 border-[#d4af37] rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                      <Locate className="w-4 h-4 text-[#d4af37] animate-pulse" />
                      <span>GPS Detected: {pendingCoords.lat.toFixed(5)}°N, {pendingCoords.lng.toFixed(5)}°W ({pendingCoords.district} District)</span>
                    </div>
                    <p className="text-xs text-white font-bold">
                      Is the emergency at your current location?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmGPSYes}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg shadow transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Yes, Emergency is Here</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmGPSNo}
                        className="px-3 py-1.5 bg-[#1f040b] border border-[#d4af37]/60 hover:bg-[#340915] text-amber-200 text-xs font-bold rounded-lg transition"
                      >
                        No, Drag Pin on Map
                      </button>
                    </div>
                  </div>
                )}

                {/* Drag Guidance Tip */}
                {dragTip && (
                  <div className="p-2 bg-[#120206] text-amber-200 rounded-lg text-xs flex items-center justify-between border border-[#841c34]">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                      {dragTip}
                    </span>
                    <button type="button" onClick={() => setDragTip(null)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Interactive Google Maps Geolocation Picker (Always visible) */}
                <div className="rounded-xl overflow-hidden border-2 border-[#d4af37]/70 shadow-inner">
                  <BelizeGoogleIncidentMap
                    incidents={[]}
                    isPickerMode={true}
                    pickerCoordinates={coords}
                    onCoordinatesChange={(newCoords) => {
                      setCoords(newCoords);
                    }}
                    className="h-[270px] w-full"
                  />
                </div>

                {/* Pinpoint Location Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] bg-[#140207] p-2.5 rounded-xl border border-[#841c34]">
                  <div className="font-mono text-amber-200 font-bold">
                    📍 Coordinates: {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°W
                  </div>
                  <div className="text-slate-300 font-medium truncate max-w-sm">
                    {displayAddress || `${district} District`}
                  </div>
                </div>
              </div>

              {/* STEP 3: DETAILED EMERGENCY DESCRIPTION (WHITE TEXT) */}
              <div>
                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-1.5">
                  3. Detailed Emergency Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the emergency or hazard, current condition, injuries, casualties, road blockages, structural damage, or immediate assistance required..."
                  rows={4}
                  required
                  maxLength={1800}
                  className="w-full p-3 rounded-xl bg-[#120206] border border-[#841c34] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-sm text-white placeholder:text-slate-400 font-medium leading-relaxed"
                />
              </div>

              {/* Picture Upload (Optional) */}
              <div className="p-3 bg-[#24060e] border border-[#841c34] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-200 uppercase tracking-wider">
                    Picture Attachment (Optional)
                  </label>
                  <span className="text-[10px] text-amber-200/60 font-mono">Photo evidence</span>
                </div>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <div className="relative w-24 h-20 rounded-lg overflow-hidden border-2 border-[#d4af37] shadow shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-20 rounded-lg border-2 border-dashed border-[#841c34] bg-[#140207] flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Camera className="w-6 h-6 stroke-1 text-slate-400" />
                      <span className="text-[9px] mt-0.5 text-slate-400">No Photo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <p className="text-[11px] text-slate-300">
                      Attach photo of the hazard, accident, fire, or flooding for dispatchers and responders.
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#380714] border border-[#d4af37]/60 hover:bg-[#4d0b1f] text-amber-200 text-xs font-bold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Take Photo / Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* STEP 4: SIMPLIFIED GENUINE EMERGENCY DECLARATION */}
              <div
                className={`p-3.5 rounded-xl border-2 transition-all ${
                  isActualEmergencyDeclared
                    ? 'bg-[#1b080f] border-emerald-500 shadow-sm'
                    : 'bg-[#24060e] border-[#d4af37]/70 shadow-md'
                }`}
              >
                <div className="space-y-2">
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    "I declare that this report concerns a genuine emergency or incident. I understand that knowingly submitting false or malicious reports may divert critical emergency resources, delay assistance to people in need, and expose me to potential legal liability."
                  </p>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={isActualEmergencyDeclared}
                      onChange={(e) => {
                        setIsActualEmergencyDeclared(e.target.checked);
                        if (e.target.checked) {
                          setErrorMessage(null);
                        }
                      }}
                      className="w-4 h-4 text-[#d4af37] rounded border-slate-500 bg-[#140207] focus:ring-[#d4af37] accent-[#d4af37] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#f3c853]">
                      I confirm this declaration.
                    </span>
                  </label>
                </div>
              </div>

              {!user && (
                <div className="p-3 bg-[#2b0510] border border-[#d4af37]/40 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <span className="text-amber-200">
                    Registration or log in required to submit official reports:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAuthGreetingModal(true)}
                    className="px-3 py-1.5 bg-[#d4af37] text-slate-950 font-bold rounded-lg hover:bg-yellow-400 text-xs shrink-0"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              )}

              {/* STEP 5: SUBMIT REPORT */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#841c34]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/10 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !user || !isActualEmergencyDeclared || !description.trim()}
                  title={
                    !user
                      ? 'Sign in required'
                      : !isActualEmergencyDeclared
                      ? 'Please confirm declaration before submitting'
                      : 'Submit emergency report'
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-[#8b152e] to-[#700d23] hover:from-red-500 hover:to-[#8b152e] text-white text-xs font-black border-2 border-[#d4af37] shadow-lg shadow-black/50 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Transmitting Report...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-[#facc15]" />
                      Submit Emergency Incident
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
