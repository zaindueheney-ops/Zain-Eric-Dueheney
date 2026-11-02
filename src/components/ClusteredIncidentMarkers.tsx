import React, { useMemo } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { EmergencyIncident } from '../types';

interface ClusteredIncidentMarkersProps {
  incidents: EmergencyIncident[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: EmergencyIncident) => void;
  markerScale: number;
  currentZoom: number;
  enableClustering?: boolean;
}

interface IncidentCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  incidents: EmergencyIncident[];
  hasCritical: boolean;
  hasActive: boolean;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function getSeverityColors(severity: string) {
  switch (severity) {
    case 'critical':
      return { bg: '#dc2626', text: '#ffffff', pulse: true };
    case 'high':
      return { bg: '#ea580c', text: '#ffffff', pulse: false };
    case 'medium':
      return { bg: '#d4af37', text: '#1e293b', pulse: false };
    case 'low':
    default:
      return { bg: '#3b82f6', text: '#ffffff', pulse: false };
  }
}

// Cluster distance threshold based on Google Maps camera zoom level
function getClusterThreshold(zoom: number): number {
  if (zoom <= 7.5) return 0.35;
  if (zoom <= 8.5) return 0.22;
  if (zoom <= 9.5) return 0.14;
  if (zoom <= 10.5) return 0.08;
  if (zoom <= 11.5) return 0.04;
  return 0; // Zoom >= 12: uncluster all pins into individual needles
}

export const ClusteredIncidentMarkers: React.FC<ClusteredIncidentMarkersProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  markerScale,
  currentZoom,
  enableClustering = true,
}) => {
  const map = useMap();

  // Spatial clustering calculation
  const clusters = useMemo(() => {
    const validIncidents = incidents.filter(
      (inc) => typeof inc.latitude === 'number' && typeof inc.longitude === 'number'
    );

    const threshold = enableClustering ? getClusterThreshold(currentZoom) : 0;

    // If clustering threshold is 0 (zoomed in or disabled), every incident is its own item
    if (threshold === 0) {
      return validIncidents.map((inc) => ({
        id: `single_${inc.id}`,
        lat: inc.latitude,
        lng: inc.longitude,
        count: 1,
        incidents: [inc],
        hasCritical: inc.severity === 'critical' || inc.severity === 'high',
        hasActive: inc.status !== 'resolved' && inc.status !== 'false_alarm',
        minLat: inc.latitude,
        maxLat: inc.latitude,
        minLng: inc.longitude,
        maxLng: inc.longitude,
      }));
    }

    const clusterList: IncidentCluster[] = [];

    validIncidents.forEach((inc) => {
      let matchedCluster: IncidentCluster | null = null;
      let minDistance = Infinity;

      for (const cluster of clusterList) {
        const dx = (inc.longitude - cluster.lng) * Math.cos(((inc.latitude + cluster.lat) / 2) * (Math.PI / 180));
        const dy = inc.latitude - cluster.lat;
        const dist = Math.hypot(dx, dy);

        if (dist <= threshold && dist < minDistance) {
          minDistance = dist;
          matchedCluster = cluster;
        }
      }

      const isCrit = inc.severity === 'critical' || inc.severity === 'high';
      const isActive = inc.status !== 'resolved' && inc.status !== 'false_alarm';

      if (matchedCluster) {
        // Add to existing cluster and compute weighted centroid
        const total = matchedCluster.count + 1;
        matchedCluster.lat = (matchedCluster.lat * matchedCluster.count + inc.latitude) / total;
        matchedCluster.lng = (matchedCluster.lng * matchedCluster.count + inc.longitude) / total;
        matchedCluster.count = total;
        matchedCluster.incidents.push(inc);
        matchedCluster.minLat = Math.min(matchedCluster.minLat, inc.latitude);
        matchedCluster.maxLat = Math.max(matchedCluster.maxLat, inc.latitude);
        matchedCluster.minLng = Math.min(matchedCluster.minLng, inc.longitude);
        matchedCluster.maxLng = Math.max(matchedCluster.maxLng, inc.longitude);
        if (isCrit) matchedCluster.hasCritical = true;
        if (isActive) matchedCluster.hasActive = true;
      } else {
        // Create new cluster entry
        clusterList.push({
          id: `cluster_${inc.id}_${clusterList.length}`,
          lat: inc.latitude,
          lng: inc.longitude,
          count: 1,
          incidents: [inc],
          hasCritical: isCrit,
          hasActive: isActive,
          minLat: inc.latitude,
          maxLat: inc.latitude,
          minLng: inc.longitude,
          maxLng: inc.longitude,
        });
      }
    });

    return clusterList;
  }, [incidents, currentZoom, enableClustering]);

  // Handle clicking a cluster badge: smoothly zoom and pan to reveal individual incidents
  const handleClusterClick = (cluster: IncidentCluster) => {
    if (!map) return;

    if (cluster.count > 1) {
      const latSpan = cluster.maxLat - cluster.minLat;
      const lngSpan = cluster.maxLng - cluster.minLng;

      // If points are at almost the exact same location, zoom in directly
      if (latSpan < 0.0005 && lngSpan < 0.0005) {
        map.panTo({ lat: cluster.lat, lng: cluster.lng });
        map.setZoom(Math.min(Math.round(currentZoom) + 3, 17));
      } else if (typeof google !== 'undefined' && google.maps?.LatLngBounds) {
        const bounds = new google.maps.LatLngBounds();
        cluster.incidents.forEach((i) => bounds.extend({ lat: i.latitude, lng: i.longitude }));
        map.fitBounds(bounds, 50);
      } else {
        map.panTo({ lat: cluster.lat, lng: cluster.lng });
        map.setZoom(Math.min(Math.round(currentZoom) + 2, 17));
      }
    }
  };

  return (
    <>
      {clusters.map((cluster) => {
        // Case A: Grouped Cluster (2 or more incidents merged)
        if (cluster.count > 1) {
          const isCrit = cluster.hasCritical;
          const count = cluster.count;
          const badgeSize = count >= 10 ? 52 : count >= 5 ? 46 : 40;

          return (
            <AdvancedMarker
              key={cluster.id}
              position={{ lat: cluster.lat, lng: cluster.lng }}
              title={`${count} emergencies reported nearby. Tap to zoom in.`}
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
                {/* Ping aura if cluster contains critical active emergencies */}
                {isCrit && (
                  <span className="absolute -inset-1.5 rounded-full bg-red-500/40 animate-ping pointer-events-none"></span>
                )}

                {/* Belize Emergency Cluster Medallion */}
                <div
                  className={`w-full h-full rounded-full flex flex-col items-center justify-center shadow-xl border-2 transition-all group-hover:scale-110 ${
                    isCrit
                      ? 'bg-gradient-to-br from-red-600 to-[#7a0d1e] border-amber-300 shadow-red-950/80'
                      : 'bg-gradient-to-br from-[#841c34] to-[#24050e] border-[#d4af37] shadow-black/80'
                  }`}
                  style={{
                    boxShadow: isCrit
                      ? '0 4px 14px rgba(220, 38, 38, 0.6), 0 0 10px rgba(243, 200, 83, 0.4)'
                      : '0 4px 12px rgba(0, 0, 0, 0.6), 0 0 8px rgba(212, 175, 55, 0.4)',
                  }}
                >
                  <span className="font-mono text-sm font-black text-[#f3c853] leading-none text-shadow-sm">
                    {count}
                  </span>
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-white/90 leading-none mt-0.5">
                    Alerts
                  </span>
                </div>

                {/* Hover Tooltip Preview */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-2xl border border-[#d4af37]/60 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <span>{count} Incidents (Click to expand)</span>
                </div>
              </div>
            </AdvancedMarker>
          );
        }

        // Case B: Individual Single Incident (Teardrop Needle Pin)
        const incident = cluster.incidents[0];
        if (!incident) return null;

        const colors = getSeverityColors(incident.severity);
        const isSelected = selectedIncidentId === incident.id;
        const isResolved =
          incident.status === 'resolved' || incident.status === 'false_alarm';

        return (
          <AdvancedMarker
            key={incident.id}
            position={{ lat: incident.latitude, lng: incident.longitude }}
            title={incident.title}
            onClick={() => {
              if (onSelectIncident) onSelectIncident(incident);
            }}
          >
            {/* Teardrop Needle Pin, anchored at bottom center */}
            <div
              className="relative group cursor-pointer select-none transition-transform duration-150"
              style={{
                width: '30px',
                height: '38px',
                transformOrigin: 'bottom center',
                transform: `scale(${isSelected ? markerScale * 1.25 : markerScale})`,
              }}
            >
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-slate-950/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-40">
                {incident.title.length > 24
                  ? incident.title.substring(0, 22) + '...'
                  : incident.title}
              </div>

              {/* Precision SVG Teardrop Pin */}
              <svg
                width="30"
                height="38"
                viewBox="0 0 30 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md overflow-visible block"
              >
                {/* Outer ping aura on critical incidents */}
                {colors.pulse && !isResolved && (
                  <circle
                    cx="15"
                    cy="15"
                    r="14"
                    fill="rgba(220, 38, 38, 0.4)"
                    className="animate-ping"
                  />
                )}

                {/* Teardrop needle body curving down to needle tip at (15, 38) */}
                <path
                  d="M15 0C6.72 0 0 6.72 0 15C0 23.2 11.2 34 14.3 37.4C14.7 37.8 15.3 37.8 15.7 37.4C18.8 34 30 23.2 30 15C30 6.72 23.28 0 15 0Z"
                  fill={isResolved ? '#475569' : colors.bg}
                  stroke={isSelected ? '#facc15' : '#ffffff'}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                />
                {/* Inner circular medallion */}
                <circle cx="15" cy="15" r="9" fill="#ffffff" />
                {/* Category Initial */}
                <text
                  x="15"
                  y="18.5"
                  textAnchor="middle"
                  fill={isResolved ? '#475569' : colors.bg}
                  fontSize="10"
                  fontWeight="900"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {incident.category.charAt(0).toUpperCase()}
                </text>
              </svg>

              {/* Ground contact shadow at (15px, 38px) */}
              <div className="absolute top-[38px] left-[15px] -translate-x-1/2 -translate-y-1/2 w-2.5 h-1.5 rounded-full bg-slate-950/30 blur-[0.8px] pointer-events-none"></div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};
