import React, { useEffect, useState, useCallback } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import {
  Flame,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  Info,
  Shield,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  FirmsHotspot,
  fetchBelizeFirmsHotspots,
  BELIZE_FIRMS_BBOX
} from '../services/firmsService';

export interface FireLayersProps {
  visible?: boolean;
  selectedHotspotId?: string | null;
  onSelectHotspot?: (hotspot: FirmsHotspot | null) => void;
  onHotspotsLoaded?: (hotspots: FirmsHotspot[], source: 'live_nrt' | 'cached_nrt', lastUpdated: string) => void;
  confidenceFilter?: 'all' | 'high_nominal' | 'high';
  sensorFilter?: 'all' | 'VIIRS' | 'MODIS';
  fireTypeFilter?: string;
  districtFilter?: string;
  refreshTrigger?: number;
}

export const FireLayers: React.FC<FireLayersProps> = ({
  visible = true,
  selectedHotspotId,
  onSelectHotspot,
  onHotspotsLoaded,
  confidenceFilter = 'all',
  sensorFilter = 'all',
  fireTypeFilter = 'all',
  districtFilter = 'all',
  refreshTrigger = 0
}) => {
  const map = useMap();
  const [hotspots, setHotspots] = useState<FirmsHotspot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<FirmsHotspot | null>(null);

  // Fetch FIRMS active hotspots for Belize Bounding Box
  const loadFirmsData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBelizeFirmsHotspots();
      setHotspots(data.hotspots);
      if (onHotspotsLoaded) {
        onHotspotsLoaded(data.hotspots, data.source, data.lastUpdated);
      }
    } catch (err) {
      console.warn('Error loading NASA FIRMS dynamic layer:', err);
    } finally {
      setLoading(false);
    }
  }, [onHotspotsLoaded]);

  useEffect(() => {
    loadFirmsData();
  }, [loadFirmsData, refreshTrigger]);

  // Sync selected hotspot from parent props
  useEffect(() => {
    if (selectedHotspotId) {
      const match = hotspots.find((h) => h.id === selectedHotspotId);
      if (match) {
        setActiveHotspot(match);
      }
    } else {
      setActiveHotspot(null);
    }
  }, [selectedHotspotId, hotspots]);

  if (!visible) return null;

  // Filter hotspots dynamically
  const displayedHotspots = hotspots.filter((h) => {
    if (sensorFilter !== 'all' && h.sensor !== sensorFilter) return false;
    if (confidenceFilter === 'high' && h.confidence !== 'high') return false;
    if (confidenceFilter === 'high_nominal' && h.confidence === 'low') return false;
    if (districtFilter !== 'all' && h.district !== districtFilter) return false;
    if (fireTypeFilter !== 'all') {
      if (fireTypeFilter === 'agricultural' && h.estimatedType !== 'Agricultural Burn') return false;
      if (fireTypeFilter === 'wildland' && h.estimatedType !== 'Wildland / Forest' && h.estimatedType !== 'Bush / Savanna') return false;
    }
    return true;
  });

  return (
    <>
      {/* Dynamic Thermal Markers on the Map */}
      {displayedHotspots.map((hotspot) => {
        const isSelected = activeHotspot?.id === hotspot.id;
        const isHighFRP = hotspot.frp > 15;
        const isModerateFRP = hotspot.frp > 5;

        return (
          <AdvancedMarker
            key={hotspot.id}
            position={{ lat: hotspot.latitude, lng: hotspot.longitude }}
            onClick={() => {
              setActiveHotspot(hotspot);
              if (onSelectHotspot) {
                onSelectHotspot(hotspot);
              }
            }}
          >
            <div className="relative cursor-pointer group select-none">
              {/* Outer pulsing thermal wave for high-intensity detections */}
              {isHighFRP && (
                <div className="absolute -inset-2 bg-red-600/40 rounded-full animate-ping pointer-events-none" />
              )}
              {isModerateFRP && !isHighFRP && (
                <div className="absolute -inset-1.5 bg-orange-500/30 rounded-full animate-pulse pointer-events-none" />
              )}

              {/* Pin Icon */}
              <div
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-2 ${
                  isSelected
                    ? 'w-10 h-10 bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 border-white scale-125 z-30'
                    : isHighFRP
                    ? 'w-8 h-8 bg-gradient-to-br from-red-600 via-orange-600 to-amber-500 border-white/90 hover:scale-125 z-20'
                    : 'w-7 h-7 bg-gradient-to-br from-orange-500 to-amber-600 border-white/80 hover:scale-125 z-10'
                }`}
                title={`NASA FIRMS Thermal Hotspot: ${hotspot.nearestLocation} (${hotspot.frp} MW FRP)`}
              >
                <Flame
                  className={`drop-shadow ${
                    isSelected ? 'w-5 h-5 text-white animate-bounce' : 'w-4 h-4 text-white'
                  }`}
                />
              </div>

              {/* Compact Floating Label on Hover */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none border border-orange-500/50 shadow">
                {hotspot.frp.toFixed(1)} MW FRP • {hotspot.sensor}
              </div>
            </div>
          </AdvancedMarker>
        );
      })}

      {/* InfoWindow for Active Selected Hotspot */}
      {activeHotspot && (
        <InfoWindow
          position={{
            lat: activeHotspot.latitude,
            lng: activeHotspot.longitude
          }}
          onCloseClick={() => {
            setActiveHotspot(null);
            if (onSelectHotspot) onSelectHotspot(null);
          }}
        >
          <div className="text-slate-900 p-2 max-w-xs text-xs font-sans space-y-2">
            {/* Header Badge */}
            <div className="flex items-center justify-between gap-2 border-b pb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px] uppercase border border-orange-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-600" />
                <span>{activeHotspot.sensorLabel}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {activeHotspot.daynight} Pass
              </span>
            </div>

            {/* Title & Location */}
            <div>
              <h4 className="font-black text-slate-900 text-sm leading-tight">
                {activeHotspot.nearestLocation}
              </h4>
              <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                <span>{activeHotspot.district} District, Belize</span>
              </p>
            </div>

            {/* Satellite Telemetry Grid */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-700">
              <div>
                <strong>Brightness:</strong> {activeHotspot.brightness.toFixed(1)} K
              </div>
              <div>
                <strong>FRP:</strong>{' '}
                <span className="text-red-600 font-black">{activeHotspot.frp.toFixed(2)} MW</span>
              </div>
              <div>
                <strong>Confidence:</strong>{' '}
                <span
                  className={`font-bold uppercase ${
                    activeHotspot.confidence === 'high'
                      ? 'text-red-700'
                      : activeHotspot.confidence === 'nominal'
                      ? 'text-amber-700'
                      : 'text-slate-600'
                  }`}
                >
                  {activeHotspot.confidence}
                </span>
              </div>
              <div>
                <strong>Acquisition:</strong> {activeHotspot.acqTime} UTC
              </div>
              <div className="col-span-2">
                <strong>Coordinates:</strong> {activeHotspot.latitude.toFixed(4)},{' '}
                {activeHotspot.longitude.toFixed(4)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <a
                href={`https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@${activeHotspot.longitude.toFixed(3)},${activeHotspot.latitude.toFixed(3)},11.0z`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-700 hover:text-orange-900 font-bold underline flex items-center gap-1"
              >
                <span>Verify on NASA FIRMS</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <span className="text-[10px] text-slate-400">
                BBOX: Belize
              </span>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};
