import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { DisabilityRegistration, BelizeDistrict } from '../types';
import { BELIZE_CENTER, BELIZE_DISTRICTS } from '../data/belizeGeo';
import { ClusteredDisabilityMarkers } from './ClusteredDisabilityMarkers';
import { DISABILITY_TYPE_OPTIONS, ASSISTANCE_PRIORITY_OPTIONS } from '../context/DisabilityContext';
import {
  Locate,
  AlertCircle,
  Layers,
  MapPin,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Home,
  Phone,
  Plus,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyDSNW7IXPGZ0wh7K3gppFnXkRTwlJS580k';

interface BelizeGoogleDisabilityMapProps {
  registrations: DisabilityRegistration[];
  onSelectRegistration?: (reg: DisabilityRegistration) => void;
  selectedRegistrationId?: string | null;
  // Picker mode props (inside the registration/edit modal)
  isPickerMode?: boolean;
  pickerCoordinates?: { lat: number; lng: number } | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  // Trigger when user drops a pin on the main disability map to register at that spot
  onPinToRegister?: (
    coords: { lat: number; lng: number },
    district: BelizeDistrict,
    isAtCurrentLocation?: boolean
  ) => void;
  className?: string;
}

function getMarkerScale(zoom: number): number {
  if (zoom <= 7.5) return 0.72;
  if (zoom <= 8.5) return 0.8;
  if (zoom <= 10.5) return 0.9;
  if (zoom <= 12.5) return 0.98;
  if (zoom <= 15) return 1.05;
  return 1.15;
}

function GoogleMapBridge({ onMapReady }: { onMapReady: (map: any) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

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

export const BelizeGoogleDisabilityMap: React.FC<BelizeGoogleDisabilityMapProps> = ({
  registrations,
  onSelectRegistration,
  selectedRegistrationId,
  isPickerMode = false,
  pickerCoordinates,
  onCoordinatesChange,
  onPinToRegister,
  className = 'h-[540px] w-full',
}) => {
  const [activeInfoReg, setActiveInfoReg] = useState<DisabilityRegistration | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('hybrid');
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(isPickerMode ? 14 : 8.5);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);

  const [phoneLocation, setPhoneLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Dropped pin on main map for marking a house location
  const [droppedPin, setDroppedPin] = useState<{
    lat: number;
    lng: number;
    district: BelizeDistrict;
    isVerifiedCurrentLocation?: boolean;
  } | null>(null);

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingPhoneCoords, setPendingPhoneCoords] = useState<{
    lat: number;
    lng: number;
    district: BelizeDistrict;
  } | null>(null);
  const [dragHelpToast, setDragHelpToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedRegistrationId) {
      setActiveInfoReg(null);
      return;
    }
    const found = registrations.find((r) => r.id === selectedRegistrationId);
    if (found && typeof found.latitude === 'number' && typeof found.longitude === 'number') {
      setActiveInfoReg(found);
      setPanTarget({ lat: found.latitude, lng: found.longitude });
    }
  }, [selectedRegistrationId, registrations]);

  useEffect(() => {
    if (isPickerMode && pickerCoordinates) {
      setPanTarget({ lat: pickerCoordinates.lat, lng: pickerCoordinates.lng });
    }
  }, [isPickerMode, pickerCoordinates?.lat, pickerCoordinates?.lng]);

  const handleMapClick = useCallback(
    (e: any) => {
      if (!e.detail?.latLng) return;
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;

      if (isPickerMode && onCoordinatesChange) {
        onCoordinatesChange({ lat, lng });
        return;
      }

      const district = getClosestDistrict(lat, lng);
      setDroppedPin({ lat, lng, district, isVerifiedCurrentLocation: false });
      setActiveInfoReg(null);
      setDragHelpToast(null);
    },
    [isPickerMode, onCoordinatesChange]
  );

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
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

        setPendingPhoneCoords({ ...coords, district });
        setShowLocationPrompt(true);
      },
      (err) => {
        setIsLocating(false);
        setGpsError(
          `Could not detect GPS: ${err.message}. Click anywhere on the map to place the house pin.`
        );
        setPanTarget({ lat: 17.4988, lng: -88.1882 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
      setDragHelpToast(
        `House pin locked to verified GPS (${pendingPhoneCoords.lat.toFixed(5)}°, ${pendingPhoneCoords.lng.toFixed(5)}°).`
      );
    }
  };

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
      setDragHelpToast('Drag the blue house pin to the exact residence location on the map.');
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

  const markerScale = getMarkerScale(currentZoom);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#1e2e4a] shadow-md ${className}`}
    >
      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        solutionChannel="gmp_mcp_codeassist_v1_aistudio"
        libraries={['marker']}
      >
        <Map
          defaultCenter={{ lat: BELIZE_CENTER.lat, lng: BELIZE_CENTER.lng }}
          defaultZoom={isPickerMode ? 13 : 8.5}
          minZoom={7}
          maxZoom={19}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mapTypeId={mapType}
          disableDefaultUI={true}
          gestureHandling="greedy"
          onClick={handleMapClick}
          className="w-full h-full min-h-[360px]"
        >
          <GoogleMapBridge onMapReady={handleMapReady} />
          <MapCameraController
            selectedCoords={panTarget}
            targetZoom={isPickerMode ? 14 : 15}
            onZoomChange={(z) => setCurrentZoom(z)}
          />

          {/* User's Live Phone GPS Location */}
          {phoneLocation && (
            <AdvancedMarker position={phoneLocation} title="Your Current GPS Location">
              <div
                className="relative pointer-events-none"
                style={{
                  width: '24px',
                  height: '24px',
                  transform: 'translateY(12px)',
                }}
              >
                <span className="absolute -inset-3 rounded-full bg-blue-500/35 animate-ping"></span>
                <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Registered Disability Residence Markers */}
          {!isPickerMode && (
            <ClusteredDisabilityMarkers
              registrations={registrations}
              selectedRegistrationId={selectedRegistrationId}
              onSelectRegistration={(reg) => {
                setActiveInfoReg(reg);
                setDroppedPin(null);
                if (onSelectRegistration) onSelectRegistration(reg);
              }}
              markerScale={markerScale}
              currentZoom={currentZoom}
              enableClustering={enableClustering}
            />
          )}

          {/* Dropped Precision House Pin on Main Map */}
          {!isPickerMode && droppedPin && (
            <AdvancedMarker
              position={{ lat: droppedPin.lat, lng: droppedPin.lng }}
              draggable={true}
              onDrag={(e: any) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setDroppedPin((prev) =>
                    prev
                      ? { ...prev, lat, lng }
                      : { lat, lng, district: getClosestDistrict(lat, lng) }
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
              <div
                className="relative cursor-grab active:cursor-grabbing select-none group transition-transform duration-100"
                style={{
                  width: '36px',
                  height: '46px',
                  transformOrigin: 'bottom center',
                  transform: `scale(${markerScale})`,
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-40">
                  <div className="px-2.5 py-1 rounded-full bg-slate-950/95 text-white font-mono text-[10px] font-bold shadow-2xl border border-[#d4af37]/80 flex items-center gap-1.5 backdrop-blur-sm">
                    <span>
                      {droppedPin.lat.toFixed(5)}°, {droppedPin.lng.toFixed(5)}°
                    </span>
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
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                  />
                  <circle cx="18" cy="18" r="10.5" fill="#ffffff" />
                  <path
                    d="M18 11L11.5 16.2V23.5H15.5V19H20.5V23.5H24.5V16.2L18 11Z"
                    fill="#0284c7"
                  />
                </svg>

                <div className="absolute top-[46px] left-[18px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-3.5 h-1.5 rounded-full bg-slate-900/40 blur-[1px]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 border border-white"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Picker Mode Draggable House Pin (Inside Registration Modal) */}
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
              <div
                className="relative cursor-grab active:cursor-grabbing select-none group transition-transform duration-100"
                style={{
                  width: '36px',
                  height: '46px',
                  transformOrigin: 'bottom center',
                  transform: `scale(${markerScale})`,
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-40">
                  <div className="px-2.5 py-1 rounded-full bg-slate-950/95 text-white font-mono text-[10px] font-bold shadow-2xl border border-[#d4af37]/80 flex items-center gap-1.5">
                    <span>
                      {pickerCoordinates.lat.toFixed(5)}°, {pickerCoordinates.lng.toFixed(5)}°
                    </span>
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
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                  />
                  <circle cx="18" cy="18" r="10.5" fill="#ffffff" />
                  <path
                    d="M18 11L11.5 16.2V23.5H15.5V19H20.5V23.5H24.5V16.2L18 11Z"
                    fill="#0284c7"
                  />
                </svg>

                <div className="absolute top-[46px] left-[18px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-3.5 h-1.5 rounded-full bg-slate-900/40 blur-[1px]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-500 border border-white"></div>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* InfoWindow showing House Photo, Disability Type, & Contact */}
          {activeInfoReg && (
            <InfoWindow
              position={{
                lat: activeInfoReg.latitude,
                lng: activeInfoReg.longitude,
              }}
              onCloseClick={() => setActiveInfoReg(null)}
            >
              <div className="p-1 min-w-[230px] max-w-[280px] font-sans text-slate-900">
                {activeInfoReg.houseImageUrl ? (
                  <div className="mb-2 rounded-lg overflow-hidden h-28 w-full bg-slate-100 border border-slate-200">
                    <img
                      src={activeInfoReg.houseImageUrl}
                      alt={`Residence of ${activeInfoReg.fullName}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-2 rounded-lg h-16 w-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[11px] gap-1.5">
                    <Home className="w-4 h-4" />
                    <span>No house photo uploaded</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mb-1 flex-wrap text-[10px] font-bold">
                  <span className="text-sky-700 uppercase">
                    {DISABILITY_TYPE_OPTIONS.find((t) => t.id === activeInfoReg.disabilityType)
                      ?.label || activeInfoReg.disabilityType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      activeInfoReg.verificationStatus === 'verified'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }
                  >
                    {activeInfoReg.verificationStatus === 'verified' ? 'Verified' : 'Pending Review'}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-950 leading-tight mb-1">
                  {activeInfoReg.fullName}
                </h4>

                <p className="text-[11px] text-slate-600 line-clamp-2 mb-1.5">
                  {activeInfoReg.disabilityDetails}
                </p>

                <div className="text-[10px] text-slate-500 space-y-0.5 mb-2">
                  <div>
                    {activeInfoReg.district} District · {activeInfoReg.addressDescription}
                  </div>
                  <div className="font-mono text-slate-700 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{activeInfoReg.phone}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectRegistration) onSelectRegistration(activeInfoReg);
                  }}
                  className="w-full text-xs font-bold py-1.5 px-3 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-center shadow-sm transition flex items-center justify-center gap-1"
                >
                  <span>Inspect Full Profile & House</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Control Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleFindMyLocation}
          disabled={isLocating}
          title="Find My Current GPS Location"
          className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-sky-50 text-sky-700 rounded-xl shadow-lg border border-slate-200/90 backdrop-blur transition hover:scale-105 active:scale-95 disabled:opacity-50 text-xs font-bold"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
              <span className="hidden sm:inline">Finding GPS...</span>
            </>
          ) : (
            <>
              <Locate className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">My Location</span>
            </>
          )}
        </button>

        <div
          className="bg-white/95 rounded-xl shadow-lg border border-slate-200/90 backdrop-blur flex flex-col overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={currentZoom >= 19}
            title={`Zoom In (${Math.round(currentZoom)}/19)`}
            aria-label="Zoom in"
            className="p-2 text-slate-700 hover:text-sky-700 hover:bg-slate-50 border-b border-slate-100 transition disabled:opacity-40"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={currentZoom <= 7}
            title={`Zoom Out (${Math.round(currentZoom)}/7)`}
            aria-label="Zoom out"
            className="p-2 text-slate-700 hover:text-sky-700 hover:bg-slate-50 border-b border-slate-100 transition disabled:opacity-40"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetBelize}
            title="Reset to Full Belize View"
            aria-label="Reset Belize view"
            className="p-2 text-slate-700 hover:text-sky-700 hover:bg-slate-50 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMapType(mapType === 'roadmap' ? 'hybrid' : 'roadmap')}
          title="Toggle Satellite / Roadmap View"
          className="p-2.5 bg-white/95 hover:bg-slate-100 text-[#4d0718] rounded-xl shadow-lg border border-[#d4af37]/70 backdrop-blur transition flex items-center justify-center text-xs font-bold"
        >
          <Layers className="w-4 h-4 text-[#7a1228]" />
        </button>

        {!isPickerMode && (
          <button
            type="button"
            onClick={() => setEnableClustering(!enableClustering)}
            title="Toggle Marker Clustering"
            className={`px-2.5 py-1.5 rounded-xl shadow-lg border backdrop-blur transition flex items-center gap-1.5 text-[11px] font-black ${
              enableClustering
                ? 'bg-[#2b0510] text-[#f3c853] border-[#d4af37]'
                : 'bg-white/95 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <span>{enableClustering ? 'Cluster ON' : 'Cluster OFF'}</span>
          </button>
        )}
      </div>

      {/* Top-Left District Quick-Nav Pill Bar */}
      {!isPickerMode && (
        <div className="absolute top-3 left-3 z-30 max-w-[calc(100%-140px)] overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 bg-[#20030a]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#d4af37]/60 shadow-xl text-white">
            <span className="text-[11px] font-black text-[#f3c853] px-1.5 whitespace-nowrap">
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

      {/* GPS Location Prompt Modal */}
      {showLocationPrompt && pendingPhoneCoords && (
        <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Locate className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  GPS Detected ({pendingPhoneCoords.district} District)
                </h4>
                <p className="font-mono text-[11px] text-slate-500">
                  {pendingPhoneCoords.lat.toFixed(5)}°, {pendingPhoneCoords.lng.toFixed(5)}°
                </p>
              </div>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 font-medium">
              <strong>Is the registered house at your current location?</strong>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmLocationYes}
                className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                <span>Yes, Here</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmLocationNo}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-300"
              >
                <span>No, Drag Pin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Guidance Toast */}
      {dragHelpToast && (
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-30 bg-slate-900/95 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{dragHelpToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDragHelpToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* GPS Error Toast */}
      {gpsError && (
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-30 bg-amber-50 border border-amber-200 text-amber-900 text-xs p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-2">
          <span>{gpsError}</span>
          <button
            type="button"
            onClick={() => setGpsError(null)}
            className="text-amber-700 hover:text-amber-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropped Precision Pin Action Drawer on Main Map */}
      {!isPickerMode && droppedPin && !showLocationPrompt && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border-2 border-sky-600 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border border-sky-200">
              <Home className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-xs font-black text-slate-900 uppercase">
                <span>House Pin: {droppedPin.district} District</span>
                <span className="text-[10px] font-semibold text-sky-700 normal-case">
                  Drag blue needle to adjust exact house
                </span>
              </div>
              <div className="font-mono text-xs text-slate-600 mt-0.5 tabular-nums">
                Lat: {droppedPin.lat.toFixed(5)}° · Lng: {droppedPin.lng.toFixed(5)}°
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onPinToRegister && (
              <button
                type="button"
                onClick={() => {
                  onPinToRegister(
                    { lat: droppedPin.lat, lng: droppedPin.lng },
                    droppedPin.district,
                    Boolean(droppedPin.isVerifiedCurrentLocation)
                  );
                }}
                className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black shadow transition flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Person at Pin</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDroppedPin(null);
                setDragHelpToast(null);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              Clear Pin
            </button>
          </div>
        </div>
      )}

      {/* Picker Mode Instruction Banner */}
      {isPickerMode && (
        <div className="absolute bottom-3 left-3 right-3 z-30 bg-slate-950/90 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#d4af37]/50 shadow-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#f3c853] shrink-0" />
            <span>
              <strong>House Pin:</strong> Tap anywhere on Belize or drag the blue pin onto the exact house roof/lot.
            </span>
          </div>
          {pickerCoordinates && (
            <div className="font-mono bg-slate-900 px-2 py-1 rounded-lg text-sky-300 text-[11px] shrink-0 ml-2 font-bold tabular-nums">
              {pickerCoordinates.lat.toFixed(4)}°, {pickerCoordinates.lng.toFixed(4)}°
            </div>
          )}
        </div>
      )}
    </div>
  );
};
