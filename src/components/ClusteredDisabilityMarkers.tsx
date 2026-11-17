import React, { useMemo } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { DisabilityRegistration } from '../types';
import { DISABILITY_TYPE_OPTIONS } from '../context/DisabilityContext';

interface ClusteredDisabilityMarkersProps {
  registrations: DisabilityRegistration[];
  selectedRegistrationId?: string | null;
  onSelectRegistration?: (reg: DisabilityRegistration) => void;
  markerScale: number;
  currentZoom: number;
  enableClustering?: boolean;
}

interface DisabilityCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  registrations: DisabilityRegistration[];
  hasCritical: boolean;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function getDisabilityPinColor(reg: DisabilityRegistration): { bg: string; pulse: boolean } {
  const typeMeta = DISABILITY_TYPE_OPTIONS.find((t) => t.id === reg.disabilityType);
  const bg = typeMeta?.pinColor || '#0284c7';
  const pulse =
    reg.assistancePriority === 'critical_life_support' || reg.requiresMedicalPower;
  return { bg, pulse };
}

function getClusterThreshold(zoom: number): number {
  if (zoom <= 7.5) return 0.35;
  if (zoom <= 8.5) return 0.22;
  if (zoom <= 9.5) return 0.14;
  if (zoom <= 10.5) return 0.08;
  if (zoom <= 11.5) return 0.04;
  return 0;
}

export const ClusteredDisabilityMarkers: React.FC<ClusteredDisabilityMarkersProps> = ({
  registrations,
  selectedRegistrationId,
  onSelectRegistration,
  markerScale,
  currentZoom,
  enableClustering = true,
}) => {
  const map = useMap();

  const clusters = useMemo(() => {
    const valid = registrations.filter(
      (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number'
    );

    const threshold = enableClustering ? getClusterThreshold(currentZoom) : 0;

    if (threshold === 0) {
      return valid.map((reg) => ({
        id: `single_${reg.id}`,
        lat: reg.latitude,
        lng: reg.longitude,
        count: 1,
        registrations: [reg],
        hasCritical:
          reg.assistancePriority === 'critical_life_support' || reg.requiresMedicalPower,
        minLat: reg.latitude,
        maxLat: reg.latitude,
        minLng: reg.longitude,
        maxLng: reg.longitude,
      }));
    }

    const clusterList: DisabilityCluster[] = [];

    valid.forEach((reg) => {
      let matchedCluster: DisabilityCluster | null = null;
      let minDistance = Infinity;

      for (const cluster of clusterList) {
        const dx =
          (reg.longitude - cluster.lng) *
          Math.cos(((reg.latitude + cluster.lat) / 2) * (Math.PI / 180));
        const dy = reg.latitude - cluster.lat;
        const dist = Math.hypot(dx, dy);

        if (dist <= threshold && dist < minDistance) {
          minDistance = dist;
          matchedCluster = cluster;
        }
      }

      const isCrit =
        reg.assistancePriority === 'critical_life_support' || reg.requiresMedicalPower;

      if (matchedCluster) {
        const total = matchedCluster.count + 1;
        matchedCluster.lat =
          (matchedCluster.lat * matchedCluster.count + reg.latitude) / total;
        matchedCluster.lng =
          (matchedCluster.lng * matchedCluster.count + reg.longitude) / total;
        matchedCluster.count = total;
        matchedCluster.registrations.push(reg);
        matchedCluster.minLat = Math.min(matchedCluster.minLat, reg.latitude);
        matchedCluster.maxLat = Math.max(matchedCluster.maxLat, reg.latitude);
        matchedCluster.minLng = Math.min(matchedCluster.minLng, reg.longitude);
        matchedCluster.maxLng = Math.max(matchedCluster.maxLng, reg.longitude);
        if (isCrit) matchedCluster.hasCritical = true;
      } else {
        clusterList.push({
          id: `dis_cluster_${reg.id}_${clusterList.length}`,
          lat: reg.latitude,
          lng: reg.longitude,
          count: 1,
          registrations: [reg],
          hasCritical: isCrit,
          minLat: reg.latitude,
          maxLat: reg.latitude,
          minLng: reg.longitude,
          maxLng: reg.longitude,
        });
      }
    });

    return clusterList;
  }, [registrations, currentZoom, enableClustering]);

  const handleClusterClick = (cluster: DisabilityCluster) => {
    if (!map || cluster.count <= 1) return;

    const latSpan = cluster.maxLat - cluster.minLat;
    const lngSpan = cluster.maxLng - cluster.minLng;

    if (latSpan < 0.0005 && lngSpan < 0.0005) {
      map.panTo({ lat: cluster.lat, lng: cluster.lng });
      map.setZoom(Math.min(Math.round(currentZoom) + 3, 17));
    } else if (typeof google !== 'undefined' && google.maps?.LatLngBounds) {
      const bounds = new google.maps.LatLngBounds();
      cluster.registrations.forEach((r) =>
        bounds.extend({ lat: r.latitude, lng: r.longitude })
      );
      map.fitBounds(bounds, 50);
    } else {
      map.panTo({ lat: cluster.lat, lng: cluster.lng });
      map.setZoom(Math.min(Math.round(currentZoom) + 2, 17));
    }
  };

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.count > 1) {
          const isCrit = cluster.hasCritical;
          const count = cluster.count;
          const badgeSize = count >= 10 ? 52 : count >= 5 ? 46 : 40;

          return (
            <AdvancedMarker
              key={cluster.id}
              position={{ lat: cluster.lat, lng: cluster.lng }}
              title={`${count} registered households nearby. Click to expand.`}
              onClick={() => handleClusterClick(cluster)}
            >
              <div
                className="relative group cursor-pointer select-none transition-transform active:scale-95 duration-150"
                style={{
                  width: `${badgeSize}px`,
                  height: `${badgeSize}px`,
                  transformOrigin: 'center center',
                }}
              >
                {isCrit && (
                  <span className="absolute -inset-1.5 rounded-full bg-sky-500/40 animate-ping pointer-events-none"></span>
                )}

                <div
                  className={`w-full h-full rounded-full flex flex-col items-center justify-center shadow-xl border-2 transition-all group-hover:scale-110 ${
                    isCrit
                      ? 'bg-gradient-to-br from-sky-600 to-[#0f172a] border-[#d4af37]'
                      : 'bg-gradient-to-br from-[#0284c7] to-[#0b1220] border-[#d4af37]'
                  }`}
                >
                  <span className="font-mono text-sm font-black text-[#f3c853] leading-none">
                    {count}
                  </span>
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-white/90 leading-none mt-0.5">
                    Homes
                  </span>
                </div>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-2xl border border-[#d4af37]/60 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <span>{count} Registered Residences (Click to zoom)</span>
                </div>
              </div>
            </AdvancedMarker>
          );
        }

        const reg = cluster.registrations[0];
        if (!reg) return null;

        const { bg, pulse } = getDisabilityPinColor(reg);
        const isSelected = selectedRegistrationId === reg.id;
        const typeMeta = DISABILITY_TYPE_OPTIONS.find((t) => t.id === reg.disabilityType);

        return (
          <AdvancedMarker
            key={reg.id}
            position={{ lat: reg.latitude, lng: reg.longitude }}
            title={`${reg.fullName} — ${typeMeta?.label || reg.disabilityType}`}
            onClick={() => {
              if (onSelectRegistration) onSelectRegistration(reg);
            }}
          >
            <div
              className="relative group cursor-pointer select-none transition-transform duration-150"
              style={{
                width: '32px',
                height: '40px',
                transformOrigin: 'bottom center',
                transform: `scale(${isSelected ? markerScale * 1.25 : markerScale})`,
              }}
            >
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-2xl border border-[#d4af37]/60 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-40">
                {reg.fullName} · {typeMeta?.shortLabel || 'Registered'}
              </div>

              <svg
                width="32"
                height="40"
                viewBox="0 0 32 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md overflow-visible block"
              >
                {pulse && (
                  <circle
                    cx="16"
                    cy="16"
                    r="15"
                    fill="rgba(220, 38, 38, 0.35)"
                    className="animate-ping"
                  />
                )}

                <path
                  d="M16 0C7.16 0 0 7.16 0 16C0 24.7 11.9 36 15.2 39.4C15.6 39.8 16.4 39.8 16.8 39.4C20.1 36 32 24.7 32 16C32 7.16 24.84 0 16 0Z"
                  fill={bg}
                  stroke={isSelected ? '#facc15' : '#ffffff'}
                  strokeWidth={isSelected ? '2.6' : '1.9'}
                />
                <circle cx="16" cy="16" r="9.5" fill="#ffffff" />
                {/* House silhouette + accessibility mark */}
                <path
                  d="M16 9.5L10.5 14.2V20.8H14V16.8H18V20.8H21.5V14.2L16 9.5Z"
                  fill={bg}
                />
              </svg>

              {/* Ground contact shadow */}
              <div className="absolute top-[40px] left-[16px] -translate-x-1/2 -translate-y-1/2 w-2.5 h-1.5 rounded-full bg-slate-950/35 blur-[0.8px] pointer-events-none"></div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};
