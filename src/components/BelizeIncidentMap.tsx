import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { EmergencyIncident, BelizeDistrict } from '../types';
import { BELIZE_CENTER, BELIZE_DISTRICTS } from '../data/belizeGeo';
import {
  Locate,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  MapPin,
  Plus,
  X,
  Crosshair,
  Loader2,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface BelizeIncidentMapProps {
  incidents: EmergencyIncident[];
  onSelectIncident?: (incident: EmergencyIncident) => void;
  selectedIncidentId?: string | null;
  // Picker mode props
  isPickerMode?: boolean;
  pickerCoordinates?: { lat: number; lng: number } | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  // Direct tap-to-report on map
  onReportAtCoordinates?: (coords: { lat: number; lng: number }, district: BelizeDistrict, isAtCurrentLocation?: boolean) => void;
  className?: string;
}

// Marker scaling helper based on Leaflet zoom
function getLeafletMarkerScale(zoom: number): number {
  if (zoom <= 7.5) return 0.70;
  if (zoom <= 8.5) return 0.78;
  if (zoom <= 10.5) return 0.88;
  if (zoom <= 12.5) return 0.95;
  if (zoom <= 15) return 1.0;
  return 1.1;
}

export const BelizeIncidentMap: React.FC<BelizeIncidentMapProps> = ({
  incidents,
  onSelectIncident,
  selectedIncidentId,
  isPickerMode = false,
  pickerCoordinates,
  onCoordinatesChange,
  onReportAtCoordinates,
  className = 'h-[500px] w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const droppedPinMarkerRef = useRef<L.Marker | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(isPickerMode ? 12 : BELIZE_CENTER.zoom);
  const [isLocating, setIsLocating] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{
    lat: number;
    lng: number;
    district: BelizeDistrict;
    isVerifiedCurrentLocation?: boolean;
  } | null>(null);

  // Verification prompt modal
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingPhoneCoords, setPendingPhoneCoords] = useState<{ lat: number; lng: number; district: BelizeDistrict } | null>(null);
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const belizeBounds = L.latLngBounds(
      L.latLng(15.7, -89.4),
      L.latLng(18.6, -87.4)
    );

    const map = L.map(mapContainerRef.current, {
      center: [BELIZE_CENTER.lat, BELIZE_CENTER.lng],
      zoom: isPickerMode ? 12 : BELIZE_CENTER.zoom,
      minZoom: 7,
      maxZoom: 18,
      maxBounds: belizeBounds.pad(0.4),
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Listen to zoom events to dynamically update marker scaling
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Click on map: handle picker mode or main map mobile tap-to-pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (isPickerMode && onCoordinatesChange) {
        onCoordinatesChange({ lat, lng });
      } else {
        const district = getClosestDistrict(lat, lng);
        setDroppedPin({ lat, lng, district, isVerifiedCurrentLocation: false });
        setDragHelpToast(null);
      }
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isPickerMode, onCoordinatesChange]);

  const scale = getLeafletMarkerScale(currentZoom);

  // Handle Main Map Dropped Pin with Pixel-Anchored Needle Tip
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (droppedPinMarkerRef.current) {
      droppedPinMarkerRef.current.remove();
      droppedPinMarkerRef.current = null;
    }

    if (droppedPin && !isPickerMode) {
      const iconW = Math.round(36 * scale);
      const iconH = Math.round(46 * scale);

      // SVG teardrop pin anchored directly at bottom-center (iconW/2, iconH)
      // Zero double-translation offsets inside the HTML!
      const pinIcon = L.divIcon({
        className: 'custom-picker-pin-leaflet',
        html: `
          <div style="width: ${iconW}px; height: ${iconH}px; position: relative; cursor: grab;">
            <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 6px; white-space: nowrap; pointer-events: none; z-index: 50;">
              <div style="padding: 3px 8px; border-radius: 9999px; background: rgba(2, 6, 23, 0.95); color: #fff; font-family: monospace; font-size: 10px; font-weight: bold; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                ${droppedPin.lat.toFixed(5)}°, ${droppedPin.lng.toFixed(5)}°
              </div>
            </div>
            <svg width="${iconW}" height="${iconH}" viewBox="0 0 36 46" fill="none" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); display: block;">
              <path d="M18 0C8.06 0 0 8.06 0 18C0 27.5 13.5 41 17.2 45.3C17.6 45.8 18.4 45.8 18.8 45.3C22.5 41 36 27.5 36 18C36 8.06 27.94 0 18 0Z" fill="#dc2626" stroke="#ffffff" stroke-width="2.2"/>
              <circle cx="18" cy="18" r="10.5" fill="#ffffff" />
              <path d="M18 10L23.5 20.5H12.5L18 10Z" fill="#dc2626" />
              <circle cx="18" cy="19" r="0.9" fill="#ffffff" />
              <path d="M18 13.8V16.8" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" />
            </svg>
            <div style="position: absolute; top: ${iconH}px; left: ${iconW / 2}px; transform: translate(-50%, -50%); width: 8px; height: 3px; background: rgba(0,0,0,0.35); border-radius: 9999px; pointer-events: none;"></div>
          </div>
        `,
        iconSize: [iconW, iconH],
        iconAnchor: [iconW / 2, iconH],
      });

      const marker = L.marker([droppedPin.lat, droppedPin.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setDroppedPin({
          lat: pos.lat,
          lng: pos.lng,
          district: getClosestDistrict(pos.lat, pos.lng),
          isVerifiedCurrentLocation: false,
        });
        setDragHelpToast(null);
      });

      droppedPinMarkerRef.current = marker;
    }
  }, [droppedPin, isPickerMode, scale]);

  // Handle Modal Picker Mode Pin updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode && pickerCoordinates) {
      map.panTo([pickerCoordinates.lat, pickerCoordinates.lng]);

      const iconW = Math.round(36 * scale);
      const iconH = Math.round(46 * scale);

      const pinIcon = L.divIcon({
        className: 'custom-picker-pin-leaflet',
        html: `
          <div style="width: ${iconW}px; height: ${iconH}px; position: relative; cursor: grab;">
            <div style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 6px; white-space: nowrap; pointer-events: none; z-index: 50;">
              <div style="padding: 3px 8px; border-radius: 9999px; background: rgba(2, 6, 23, 0.95); color: #fff; font-family: monospace; font-size: 10px; font-weight: bold; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                ${pickerCoordinates.lat.toFixed(5)}°, ${pickerCoordinates.lng.toFixed(5)}°
              </div>
            </div>
            <svg width="${iconW}" height="${iconH}" viewBox="0 0 36 46" fill="none" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); display: block;">
              <path d="M18 0C8.06 0 0 8.06 0 18C0 27.5 13.5 41 17.2 45.3C17.6 45.8 18.4 45.8 18.8 45.3C22.5 41 36 27.5 36 18C36 8.06 27.94 0 18 0Z" fill="#dc2626" stroke="#ffffff" stroke-width="2.2"/>
              <circle cx="18" cy="18" r="10.5" fill="#ffffff" />
              <path d="M18 10L23.5 20.5H12.5L18 10Z" fill="#dc2626" />
              <circle cx="18" cy="19" r="0.9" fill="#ffffff" />
              <path d="M18 13.8V16.8" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" />
            </svg>
            <div style="position: absolute; top: ${iconH}px; left: ${iconW / 2}px; transform: translate(-50%, -50%); width: 8px; height: 3px; background: rgba(0,0,0,0.35); border-radius: 9999px; pointer-events: none;"></div>
          </div>
        `,
        iconSize: [iconW, iconH],
        iconAnchor: [iconW / 2, iconH],
      });

      if (!pickerMarkerRef.current) {
        const marker = L.marker([pickerCoordinates.lat, pickerCoordinates.lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onCoordinatesChange) {
            onCoordinatesChange({ lat: pos.lat, lng: pos.lng });
          }
        });

        pickerMarkerRef.current = marker;
      } else {
        pickerMarkerRef.current.setLatLng([pickerCoordinates.lat, pickerCoordinates.lng]);
        pickerMarkerRef.current.setIcon(pinIcon);
      }
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPickerMode, pickerCoordinates?.lat, pickerCoordinates?.lng, onCoordinatesChange, scale]);

  // Render Incident Markers as Pixel-Anchored Teardrops
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (isPickerMode) return;

    const iconW = Math.round(30 * scale);
    const iconH = Math.round(38 * scale);

    incidents.forEach((incident) => {
      if (typeof incident.latitude !== 'number' || typeof incident.longitude !== 'number') {
        return;
      }

      const isSelected = selectedIncidentId === incident.id;
      const isResolved = incident.status === 'resolved' || incident.status === 'false_alarm';

      let fillColor = '#d97706';
      if (incident.severity === 'critical') fillColor = '#dc2626';
      else if (incident.severity === 'high') fillColor = '#ea580c';
      else if (incident.severity === 'low') fillColor = '#059669';
      if (isResolved) fillColor = '#475569';

      const markerHtml = `
        <div style="width: ${iconW}px; height: ${iconH}px; position: relative; cursor: pointer;">
          <svg width="${iconW}" height="${iconH}" viewBox="0 0 30 38" fill="none" style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.3)); display: block;">
            <path d="M15 0C6.72 0 0 6.72 0 15C0 23.2 11.2 34 14.3 37.4C14.7 37.8 15.3 37.8 15.7 37.4C18.8 34 30 23.2 30 15C30 6.72 23.28 0 15 0Z" fill="${fillColor}" stroke="${isSelected ? '#facc15' : '#ffffff'}" stroke-width="${isSelected ? '2.5' : '1.8'}"/>
            <circle cx="15" cy="15" r="9" fill="#ffffff" />
            <text x="15" y="18.5" text-anchor="middle" fill="${fillColor}" font-size="10" font-weight="900" font-family="sans-serif">
              ${incident.category.charAt(0).toUpperCase()}
            </text>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-incident-pin-leaflet',
        html: markerHtml,
        iconSize: [iconW, iconH],
        iconAnchor: [iconW / 2, iconH],
      });

      const marker = L.marker([incident.latitude, incident.longitude], {
        icon: customIcon,
        title: incident.title,
      });

      marker.on('click', () => {
        setDroppedPin(null);
        if (onSelectIncident) onSelectIncident(incident);
      });

      marker.addTo(group);
    });
  }, [incidents, selectedIncidentId, isPickerMode, onSelectIncident, scale]);

  // Phone GPS "Locate Me" with confirmation prompt
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      alert('Geolocation is not supported by your phone browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setIsLocating(false);
        const district = getClosestDistrict(lat, lng);
        mapInstanceRef.current?.flyTo([lat, lng], 13);

        setPendingPhoneCoords({ lat, lng, district });
        setShowLocationPrompt(true);
      },
      (err) => {
        setIsLocating(false);
        mapInstanceRef.current?.flyTo([17.4988, -88.1882], 12);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirmLocationYes = () => {
    if (!pendingPhoneCoords) return;
    setShowLocationPrompt(false);
    if (isPickerMode && onCoordinatesChange) {
      onCoordinatesChange({ lat: pendingPhoneCoords.lat, lng: pendingPhoneCoords.lng });
    } else {
      setDroppedPin({
        lat: pendingPhoneCoords.lat,
        lng: pendingPhoneCoords.lng,
        district: pendingPhoneCoords.district,
        isVerifiedCurrentLocation: true,
      });
      setDragHelpToast(`✓ Emergency pin locked to your verified GPS position.`);
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
    }
    setDragHelpToast('📍 Drag the red pin to the exact location of the emergency on the map.');
  };

  const handleZoom = (direction: 'in' | 'out', e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const map = mapInstanceRef.current;
    if (!map) return;
    const current = map.getZoom();
    if (direction === 'in') {
      const nextZoom = Math.min(Math.round(current) + 1, 18);
      map.setZoom(nextZoom);
      setCurrentZoom(nextZoom);
    } else {
      const nextZoom = Math.max(Math.round(current) - 1, 7);
      map.setZoom(nextZoom);
      setCurrentZoom(nextZoom);
    }
  };

  const handleDistrictNav = (districtId: string) => {
    const dist = BELIZE_DISTRICTS.find((d) => d.id === districtId);
    if (dist && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([dist.lat, dist.lng], 11, { duration: 1.0 });
    }
  };

  const handleResetBelize = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([BELIZE_CENTER.lat, BELIZE_CENTER.lng], BELIZE_CENTER.zoom, { duration: 1.0 });
      setCurrentZoom(BELIZE_CENTER.zoom);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-md ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px] z-0" />

      {/* Floating Control Buttons */}
      <div 
        className="absolute top-3 right-3 z-[400] flex flex-col gap-2"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          title="Find My Current Phone Location"
          className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-blue-50 text-blue-700 rounded-xl shadow-lg border border-slate-200 backdrop-blur transition hover:scale-105 active:scale-95 text-xs font-bold"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="hidden sm:inline">Locating...</span>
            </>
          ) : (
            <>
              <Locate className="w-4 h-4" />
              <span className="hidden sm:inline">My Location</span>
            </>
          )}
        </button>

        <div className="bg-white/95 rounded-xl shadow-md border border-slate-200 backdrop-blur flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={(e) => handleZoom('in', e)}
            disabled={currentZoom >= 18}
            title={`Zoom In (Current: ${Math.round(currentZoom)}/18)`}
            aria-label="Zoom in"
            className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 border-b border-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => handleZoom('out', e)}
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
            title="View All Belize (Zoom Out)"
            aria-label="Reset Belize view"
            className="p-2 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Belize District Filter Pill bar (Top-Left) */}
      {!isPickerMode && (
        <div className="absolute top-3 left-3 z-[400] max-w-[calc(100%-140px)] overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg text-white">
            <span className="text-[11px] font-bold text-slate-300 px-1.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Belize:
            </span>
            {BELIZE_DISTRICTS.map((d) => (
              <button
                key={d.id}
                onClick={() => handleDistrictNav(d.id)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-blue-600 text-slate-200 hover:text-white transition whitespace-nowrap"
              >
                {d.capital.split('/')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VERIFICATION PROMPT: "Is the emergency at your current location?" */}
      {showLocationPrompt && pendingPhoneCoords && (
        <div className="absolute inset-0 z-[500] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-[400] bg-slate-900/95 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-400 shrink-0 animate-bounce" />
            <span>{dragHelpToast}</span>
          </div>
          <button onClick={() => setDragHelpToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropped Pin Action Drawer (Mobile Tap-to-Pin) */}
      {!isPickerMode && droppedPin && !showLocationPrompt && (
        <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border-2 border-red-500 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
              <MapPin className="w-5 h-5 text-red-600 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-slate-900 uppercase">
                  Location Pinned: {droppedPin.district} District
                </span>
                {droppedPin.isVerifiedCurrentLocation ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded flex items-center gap-1">
                    ✓ Verified Current Location
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">
                    Drag needle to adjust
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

      {/* Picker Mode Instruction Banner */}
      {isPickerMode && (
        <div className="absolute bottom-3 left-3 right-3 z-[400] bg-blue-900/90 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-blue-400/40 shadow-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Touch Map to Pin:</strong> Tap or drag the needle anywhere on Belize to set incident position.
            </span>
          </div>
          {pickerCoordinates && (
            <div className="font-mono bg-blue-950/80 px-2 py-1 rounded text-cyan-200 text-[11px] shrink-0 ml-2 font-bold">
              {pickerCoordinates.lat.toFixed(4)}°, {pickerCoordinates.lng.toFixed(4)}°
            </div>
          )}
        </div>
      )}
    </div>
  );
};
