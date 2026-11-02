// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { EmergencyIncident, BelizeDistrict } from '../types';
import { BELIZE_CENTER, BELIZE_DISTRICTS } from '../data/belizeGeo';
import { ClusteredIncidentMarkers } from './ClusteredIncidentMarkers';
import {
  Locate,
  AlertCircle,
  Layers,
  MapPin,
  ChevronRight,
  Plus,
  X,
  Crosshair,
  Loader2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDSNW7IXPGZ0wh7K3gppFnXkRTwlJS580k';

interface BelizeGoogleIncidentMapProps {
  incidents: EmergencyIncident[];
  onSelectIncident?: (incident: EmergencyIncident) => void;
  selectedIncidentId?: string | null;
  // Picker mode props (for inside the modal)
  isPickerMode?: boolean;
  pickerCoordinates?: { lat: number; lng: number } | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  // External report trigger from map tap
  onReportAtCoordinates?: (coords: { lat: number; lng: number }, district: BelizeDistrict, isAtCurrentLocation?: boolean) => void;
  className?: string;
}

// Dynamic marker scaling based on Google Maps camera zoom level
// Crucial: All pins use transformOrigin: 'bottom center' so scaling never shifts the needle tip
function getMarkerScale(zoom: number): number {
  if (zoom <= 7.5) return 0.68;
  if (zoom <= 8.5) return 0.76; // Default Belize country view
  if (zoom <= 10.5) return 0.86; // Regional district view
  if (zoom <= 12.5) return 0.94; // Municipality / Town view
  if (zoom <= 15) return 1.0;   // Street view
  return 1.1;                   // High-precision building / intersection inspection
}

// Bridge component to obtain and pass the google.maps.Map instance to the parent
function GoogleMapBridge({ onMapReady }: { onMapReady: (map: any) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

// Controller to smoothly pan camera and synchronize live zoom level
function MapCameraController({
  selectedCoords,
  targetZoom,
  onZoomChange,
}: {
  selectedCoords: { lat: number; lng: number } | null;
  targetZoom?: number;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedCoords) return;
    map.panTo(selectedCoords);
    if (targetZoom) {
      map.setZoom(targetZoom);
    }
  }, [map, selectedCoords, targetZoom]);

  // Synchronize camera zoom with component state
  useEffect(() => {
    if (!map) return;
    const handleZoomChanged = () => {
      const z = map.getZoom();
      if (typeof z === 'number') {
        onZoomChange(z);
      }
    };
    const listener = map.addListener('zoom_changed', handleZoomChanged);
    handleZoomChanged();
    return () => {
      listener?.remove?.();
    };
  }, [map, onZoomChange]);

  return null;
}

export const BelizeGoogleIncidentMap: React.FC<BelizeGoogleIncidentMapProps> = ({
  incidents,
  onSelectIncident,
  selectedIncidentId,
  isPickerMode = false,
  pickerCoordinates,
  onCoordinatesChange,
  onReportAtCoordinates,
  className = 'h-[500px] w-full',
}) => {
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(isPickerMode ? 12 : 8.5);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);

  // User's live phone GPS position
  const [phoneLocation, setPhoneLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Active dropped pin on map (interactive precision mobile tap-to-pin)
  const [droppedPin, setDroppedPin] = useState<{
    lat: number;
    lng: number;
    district: BelizeDistrict;
    isVerifiedCurrentLocation?: boolean;
  } | null>(null);

  // Verification prompt modal: "Is the emergency at your current location?"
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingPhoneCoords, setPendingPhoneCoords] = useState<{ lat: number; lng: number; district: BelizeDistrict } | null>(null);
  const [dragHelpToast, setDragHelpToast] = useState<string | null>(null);

  // Helper to determine district based on coordinates
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

  // Sync selected incident
  useEffect(() => {
    if (!selectedIncidentId) {
      setSelectedIncident(null);
      return;
    }
    const found = incidents.find((i) => i.id === selectedIncidentId);
    if (found && typeof found.latitude === 'number' && typeof found.longitude === 'number') {
      setSelectedIncident(found);
      setPanTarget({ lat: found.latitude, lng: found.longitude });
    }
  }, [selectedIncidentId, incidents]);

  // In picker mode, always sync panTarget with pickerCoordinates so camera centers exactly on pin
  useEffect(() => {
    if (isPickerMode && pickerCoordinates) {
      setPanTarget({ lat: pickerCoordinates.lat, lng: pickerCoordinates.lng });
    }
  }, [isPickerMode, pickerCoordinates?.lat, pickerCoordinates?.lng]);

  // Handle map click for both modal picker mode and main map mobile tap-to-pin
  const handleMapClick = useCallback(
    (e: any) => {
      if (!e.detail?.latLng) return;
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;

      if (isPickerMode && onCoordinatesChange) {
        onCoordinatesChange({ lat, lng });
        return;
      }

      // On main map: set dropped pin with precise coordinates
      const district = getClosestDistrict(lat, lng);
      setDroppedPin({ lat, lng, district, isVerifiedCurrentLocation: false });
      setSelectedIncident(null);
      setDragHelpToast(null);
      if (onReportAtCoordinates) {
        onReportAtCoordinates({ lat, lng }, district, false);
      }
    },
    [isPickerMode, onCoordinatesChange, onReportAtCoordinates]
  );

  // Handle GPS "Find My Current Location" via phone
  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your phone browser.');
      return;
    }
    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const district = getClosestDistrict(coords.lat, coords.lng);
        setPhoneLocation(coords);
        setPanTarget(coords);
        setIsLocating(false);

        // Prompt the user: "Is the emergency at your current location?"
        setPendingPhoneCoords({ ...coords, district });
        setShowLocationPrompt(true);
      },
      (err) => {
        setIsLocating(false);
        setGpsError(`Could not find phone location: ${err.message}. Showing Belize City center.`);
        setPanTarget({ lat: 17.4988, lng: -88.1882 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Response: YES, Emergency is at my current location
  const handleConfirmLocationYes = () => {
    if (!pendingPhoneCoords) return;
    setShowLocationPrompt(false);
    setPanTarget({ lat: pendingPhoneCoords.lat, lng: pendingPhoneCoords.lng });

    if (isPickerMode && onCoordinatesChange) {
      onCoordinatesChange({ lat: pendingPhoneCoords.lat, lng: pendingPhoneCoords.lng });
    } else {
      setDroppedPin({
        lat: pendingPhoneCoords.lat,
        lng: pendingPhoneCoords.lng,
        district: pendingPhoneCoords.district,
        isVerifiedCurrentLocation: true,
      });
      setDragHelpToast(`✓ Emergency pin locked to your verified GPS location (${pendingPhoneCoords.lat.toFixed(5)}°, ${pendingPhoneCoords.lng.toFixed(5)}°).`);
      if (onReportAtCoordinates) {
        onReportAtCoordinates(
          { lat: pendingPhoneCoords.lat, lng: pendingPhoneCoords.lng },
          pendingPhoneCoords.district,
          true
        );
      }
    }
  };

  // Response: NO, Emergency is elsewhere
  const handleConfirmLocationNo = () => {
    if (!pendingPhoneCoords) return;
    setShowLocationPrompt(false);

    if (isPickerMode && onCoordinatesChange) {
      onCoordinatesChange({ lat: pendingPhoneCoords.lat, lng: pendingPhoneCoords.lng });
    } else {
      setDroppedPin({
        lat: pendingPhoneCoords.lat,
        lng: pendingPhoneCoords.lng,
        district: pendingPhoneCoords.district,
        isVerifiedCurrentLocation: false,
      });
      if (onReportAtCoordinates) {
        onReportAtCoordinates(
          { lat: pendingPhoneCoords.lat, lng: pendingPhoneCoords.lng },
          pendingPhoneCoords.district,
          false
        );
      }
      setDragHelpToast('📍 Drag the red pin to the exact location of the emergency on the map.');
    }
  };

  const mapInstanceRef = React.useRef<any>(null);

  const handleMapReady = useCallback((map: any) => {
    mapInstanceRef.current = map;
  }, []);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const map = mapInstanceRef.current;
    if (!map) return;
    const current = map.getZoom() ?? 8.5;
    const nextZoom = Math.min(Math.round(current) + 1, 19);
    map.setZoom(nextZoom);
    setCurrentZoom(nextZoom);
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const map = mapInstanceRef.current;
    if (!map) return;
    const current = map.getZoom() ?? 8.5;
    const nextZoom = Math.max(Math.round(current) - 1, 7);
    map.setZoom(nextZoom);
    setCurrentZoom(nextZoom);
  };

  const handleDistrictNav = (districtId: string) => {
    const dist = BELIZE_DISTRICTS.find((d) => d.id === districtId);
    if (dist) {
      setPanTarget({ lat: dist.lat, lng: dist.lng });
    }
  };

  const handleResetBelize = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const map = mapInstanceRef.current;
    if (map) {
      map.panTo({ lat: BELIZE_CENTER.lat, lng: BELIZE_CENTER.lng });
      const targetZ = isPickerMode ? 12 : 8.5;
      map.setZoom(targetZ);
      setCurrentZoom(targetZ);
    } else {
      setPanTarget({ lat: BELIZE_CENTER.lat, lng: BELIZE_CENTER.lng });
    }
  };

  const getSeverityColors = (sev: string) => {
    switch (sev) {
      case 'critical':
        return { bg: '#dc2626', border: '#fca5a5', pulse: true };
      case 'high':
        return { bg: '#ea580c', border: '#fdba74', pulse: false };
      case 'medium':
        return { bg: '#d97706', border: '#fde68a', pulse: false };
      default:
        return { bg: '#059669', border: '#6ee7b7', pulse: false };
    }
  };

  const markerScale = getMarkerScale(currentZoom);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/90 shadow-md ${className}`}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="gmp_mcp_codeassist_v1_aistudio" libraries={['marker']}>
        <Map
          defaultCenter={{ lat: BELIZE_CENTER.lat, lng: BELIZE_CENTER.lng }}
          defaultZoom={isPickerMode ? 12 : 8.5}
          minZoom={7}
          maxZoom={19}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mapTypeId={mapType}
          disableDefaultUI={true}
          gestureHandling="greedy"
          onClick={handleMapClick}
          className="w-full h-full min-h-[380px]"
        >
          <GoogleMapBridge onMapReady={handleMapReady} />
          <MapCameraController
            selectedCoords={panTarget}
            targetZoom={isPickerMode ? 12 : 13}
            onZoomChange={(z) => setCurrentZoom(z)}
          />

          {/* User's Phone GPS Location Marker (Accurately Centered Beacon) */}
          {phoneLocation && (
            <AdvancedMarker position={phoneLocation} title="Your Phone Current Location">
              <div
                className="relative pointer-events-none"
                style={{
                  width: '24px',
                  height: '24px',
                  transform: 'translateY(12px)', // Centers 24px circle directly on bottom-center anchor
                }}
              >
                <span className="absolute -inset-3 rounded-full bg-blue-500/35 animate-ping"></span>
                <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Active Incident Markers with Dynamic Marker Clustering */}
          {!isPickerMode && (
            <ClusteredIncidentMarkers
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={(incident) => {
                setSelectedIncident(incident);
                setDroppedPin(null);
                if (onSelectIncident) onSelectIncident(incident);
              }}
              markerScale={markerScale}
              currentZoom={currentZoom}
              enableClustering={enableClustering}
            />
          )}

          {/* Dropped Precision Pin on Main Map (Mobile Tap-to-Pin & Draggable) */}
          {!isPickerMode && droppedPin && (
            <AdvancedMarker
              position={{ lat: droppedPin.lat, lng: droppedPin.lng }}
              draggable={true}
              onDrag={(e: any) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setDroppedPin((prev) =>
                    prev ? { ...prev, lat, lng } : { lat, lng, district: getClosestDistrict(lat, lng) }
                  );
                }
              }}
              onDragEnd={(e: any) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setDroppedPin({
                    lat,
                    lng,
                    district: getClosestDistrict(lat, lng),
                    isVerifiedCurrentLocation: false,
                  });
                  setDragHelpToast(null);
                }
              }}
            >
              {/* Precision Needle-Tip Marker: Exactly 36px wide by 46px high, tip at (18, 46) */}
              <div
                className="relative cursor-grab active:cursor-grabbing select-none group transition-transform duration-100"
                style={{
                  width: '36px',
                  height: '46px',
                  transformOrigin: 'bottom center',
                  transform: `scale(${markerScale})`,
                }}
              >
                {/* Floating Coordinates Badge (Absolute above pin head, ZERO impact on anchor point) */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-40">
                  <div className="px-2.5 py-1 rounded-full bg-slate-950/95 text-white font-mono text-[10px] font-bold shadow-2xl border border-slate-700/90 flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                    <span>{droppedPin.lat.toFixed(5)}°, {droppedPin.lng.toFixed(5)}°</span>
                  </div>
                </div>

                {/* SVG Teardrop with razor-sharp needle tip at (18, 46) */}
                <svg
                  width="36"
                  height="46"
                  viewBox="0 0 36 46"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] block overflow-visible"
                >
                  <defs>
                    <linearGradient id="emergencyPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                  </defs>

                  {/* Teardrop path with sharp needle tip at (18, 46) */}
                  <path
                    d="M18 0C8.06 0 0 8.06 0 18C0 27.5 13.5 41 17.2 45.3C17.6 45.8 18.4 45.8 18.8 45.3C22.5 41 36 27.5 36 18C36 8.06 27.94 0 18 0Z"
                    fill="url(#emergencyPinGrad)"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                  />
                  {/* Inner white medallion */}
                  <circle cx="18" cy="18" r="10.5" fill="#ffffff" />
                  {/* Emergency warning icon */}
                  <path
                    d="M18 10L23.5 20.5H12.5L18 10Z"
                    fill="#b91c1c"
                  />
                  <circle cx="18" cy="19" r="0.9" fill="#ffffff" />
                  <path d="M18 13.8V16.8" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
                </svg>

                {/* Ground Crosshair Reticle & Shadow directly under needle point (18px, 46px) */}
                <div className="absolute top-[46px] left-[18px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-3.5 h-1.5 rounded-full bg-slate-900/40 blur-[1px]"></div>
                  <span className="absolute -inset-2 rounded-full border border-red-500/80 bg-red-500/20 animate-ping"></span>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-600 border border-white"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Picker Mode Draggable Pin (Inside Report Modal) */}
          {isPickerMode && pickerCoordinates && (
            <AdvancedMarker
              position={pickerCoordinates}
              draggable={true}
              onDrag={(e: any) => {
                if (e.latLng && onCoordinatesChange) {
                  onCoordinatesChange({
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                  });
                }
              }}
              onDragEnd={(e: any) => {
                if (e.latLng && onCoordinatesChange) {
                  onCoordinatesChange({
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                  });
                }
              }}
            >
              {/* Precision Picker Pin: Exact needle tip at (18, 46) */}
              <div
                className="relative cursor-grab active:cursor-grabbing select-none group transition-transform duration-100"
                style={{
                  width: '36px',
                  height: '46px',
                  transformOrigin: 'bottom center',
                  transform: `scale(${markerScale})`,
                }}
              >
                {/* Floating Coordinates Badge */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-40">
                  <div className="px-2.5 py-1 rounded-full bg-slate-950/95 text-white font-mono text-[10px] font-bold shadow-2xl border border-slate-700/90 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                    <span>{pickerCoordinates.lat.toFixed(5)}°, {pickerCoordinates.lng.toFixed(5)}°</span>
                  </div>
                </div>

                <svg
                  width="36"
                  height="46"
                  viewBox="0 0 36 46"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] block overflow-visible"
                >
                  <path
                    d="M18 0C8.06 0 0 8.06 0 18C0 27.5 13.5 41 17.2 45.3C17.6 45.8 18.4 45.8 18.8 45.3C22.5 41 36 27.5 36 18C36 8.06 27.94 0 18 0Z"
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                  />
                  <circle cx="18" cy="18" r="10.5" fill="#ffffff" />
                  <path
                    d="M18 10L23.5 20.5H12.5L18 10Z"
                    fill="#dc2626"
                  />
                  <circle cx="18" cy="19" r="0.9" fill="#ffffff" />
                  <path d="M18 13.8V16.8" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
                </svg>

                {/* Ground target contact point */}
                <div className="absolute top-[46px] left-[18px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-3.5 h-1.5 rounded-full bg-slate-900/40 blur-[1px]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-600 border border-white"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Incident Details InfoWindow */}
          {selectedIncident && (
            <InfoWindow
              position={{
                lat: selectedIncident.latitude,
                lng: selectedIncident.longitude,
              }}
              onCloseClick={() => setSelectedIncident(null)}
            >
              <div className="p-1 min-w-[220px] max-w-[270px] font-sans text-slate-900">
                {selectedIncident.imageUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden h-24 w-full bg-slate-100">
                    <img
                      src={selectedIncident.imageUrl}
                      alt={selectedIncident.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded text-white uppercase ${
                      selectedIncident.severity === 'critical'
                        ? 'bg-red-600'
                        : selectedIncident.severity === 'high'
                        ? 'bg-orange-500'
                        : selectedIncident.severity === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {selectedIncident.severity}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {selectedIncident.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-950 leading-tight mb-1">
                  {selectedIncident.title}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                  {selectedIncident.description}
                </p>
                <div className="text-[10px] text-slate-500 mb-2">
                  📍 {selectedIncident.district} • {selectedIncident.locationName}
                </div>
                <button
                  onClick={() => {
                    if (onSelectIncident) onSelectIncident(selectedIncident);
                  }}
                  className="w-full text-xs font-bold py-1.5 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-center shadow-sm transition flex items-center justify-center gap-1"
                >
                  <span>Open Full Incident Situation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Control Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
        {/* Find My Phone Location Button */}
        <button
          onClick={handleFindMyLocation}
          disabled={isLocating}
          title="Find My Current Phone Location"
          className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-blue-50 text-blue-700 rounded-xl shadow-lg border border-slate-200/90 backdrop-blur transition hover:scale-105 active:scale-95 disabled:opacity-50 text-xs font-bold"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="hidden sm:inline">Finding GPS...</span>
            </>
          ) : (
            <>
              <Locate className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">My Location</span>
            </>
          )}
        </button>

        {/* Zoom In / Zoom Out and Reset View */}
        <div 
          className="bg-white/95 rounded-xl shadow-lg border border-slate-200/90 backdrop-blur flex flex-col overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={currentZoom >= 19}
            title={`Zoom In (Current: ${Math.round(currentZoom)}/19)`}
            aria-label="Zoom in"
            className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 border-b border-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={currentZoom <= 7}
            title={`Zoom Out (Current: ${Math.round(currentZoom)}/7)`}
            aria-label="Zoom out"
            className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 border-b border-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetBelize}
            title="Reset to Full Belize View"
            aria-label="Reset Belize view"
            className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Map Type Switcher */}
        <button
          type="button"
          onClick={() => setMapType(mapType === 'roadmap' ? 'hybrid' : 'roadmap')}
          title="Toggle Google Satellite / Terrain View"
          className="p-2.5 bg-white/95 hover:bg-slate-100 text-[#4d0718] rounded-xl shadow-lg border border-[#d4af37]/70 backdrop-blur transition flex items-center justify-center text-xs font-bold"
        >
          <Layers className="w-4 h-4 text-[#7a1228]" />
        </button>

        {/* Marker Clustering Toggle Button */}
        {!isPickerMode && (
          <button
            type="button"
            onClick={() => setEnableClustering(!enableClustering)}
            title={
              enableClustering
                ? 'Marker Clustering: Enabled (Click to display unclustered individual pins)'
                : 'Marker Clustering: Disabled (Click to group nearby emergency pins)'
            }
            className={`px-2.5 py-1.5 rounded-xl shadow-lg border backdrop-blur transition flex items-center gap-1.5 text-[11px] font-black ${
              enableClustering
                ? 'bg-[#2b0510] text-[#f3c853] border-[#d4af37] ring-1 ring-[#d4af37]/50 shadow-amber-950/40'
                : 'bg-white/95 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                enableClustering ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span className="hidden sm:inline">{enableClustering ? 'Cluster ON' : 'Cluster OFF'}</span>
          </button>
        )}
      </div>

      {/* Quick Belize District Filter Pill bar (Top-Left, Burgundy & Gold) */}
      {!isPickerMode && (
        <div className="absolute top-3 left-3 z-30 max-w-[calc(100%-140px)] overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 bg-[#20030a]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#d4af37]/60 shadow-xl text-white">
            <span className="text-[11px] font-black text-[#f3c853] px-1.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Belize:
            </span>
            {BELIZE_DISTRICTS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleDistrictNav(d.id)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#3d0817] hover:bg-[#d4af37] text-amber-100 hover:text-slate-950 transition whitespace-nowrap border border-[#841c34]"
              >
                {d.capital.split('/')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VERIFICATION PROMPT: "Is the emergency at your current location?" */}
      {showLocationPrompt && pendingPhoneCoords && (
        <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Locate className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  Location Detected ({pendingPhoneCoords.district} District)
                </h4>
                <p className="font-mono text-[11px] text-slate-500">
                  {pendingPhoneCoords.lat.toFixed(5)}°, {pendingPhoneCoords.lng.toFixed(5)}°
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 font-medium">
              <strong>Is the emergency at your current location?</strong>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleConfirmLocationYes}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                <span>Yes, Here</span>
              </button>

              <button
                onClick={handleConfirmLocationNo}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 hover:scale-105 active:scale-95 border border-slate-300"
              >
                <span>No, Drag Pin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Guidance Toast */}
      {dragHelpToast && (
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-30 bg-slate-900/95 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-400 shrink-0 animate-bounce" />
            <span>{dragHelpToast}</span>
          </div>
          <button onClick={() => setDragHelpToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* GPS Error Toast */}
      {gpsError && (
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-30 bg-amber-50 border border-amber-200 text-amber-900 text-xs p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-2">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-amber-700 hover:text-amber-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropped Precision Pin Action Drawer */}
      {!isPickerMode && droppedPin && !showLocationPrompt && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border-2 border-red-500 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
              <MapPin className="w-5 h-5 text-red-600 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-900 uppercase">
                  Incident Location: {droppedPin.district} District
                </span>
                {droppedPin.isVerifiedCurrentLocation ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded flex items-center gap-1">
                    ✓ Verified Current Location
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">
                    Drag needle to adjust exact location
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-slate-600 mt-0.5">
                Lat: {droppedPin.lat.toFixed(5)}° | Lng: {droppedPin.lng.toFixed(5)}°
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-xs font-black text-red-600 flex items-center gap-1 sm:justify-end">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                Coordinates Set
              </span>
              <p className="text-[10px] text-slate-500 hidden sm:block">Click "Report Incident" in top navbar</p>
            </div>
            <button
              onClick={() => {
                setDroppedPin(null);
                setDragHelpToast(null);
                if (onReportAtCoordinates) {
                  onReportAtCoordinates({ lat: 0, lng: 0 }, '' as any, false);
                }
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              Clear Pin
            </button>
          </div>
        </div>
      )}

      {/* Picker Mode Instruction Banner (inside modal) */}
      {isPickerMode && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-blue-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-blue-400/40 shadow-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Precision Pin:</strong> Drag the needle or tap anywhere on Belize to set the incident location.
            </span>
          </div>
          {pickerCoordinates && (
            <div className="font-mono bg-blue-950 px-2 py-1 rounded-lg text-cyan-200 text-[11px] shrink-0 ml-2 font-bold">
              {pickerCoordinates.lat.toFixed(4)}°, {pickerCoordinates.lng.toFixed(4)}°
            </div>
          )}
        </div>
      )}
    </div>
  );
};
