import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  User,
  Shield,
  Truck,
  Flame,
  Activity,
  CloudRain,
  Car,
  ShieldAlert,
  Anchor,
  Zap,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Trash2,
  Loader2
} from 'lucide-react';
import { EmergencyIncident, EmergencyCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';

interface IncidentCardProps {
  incident: EmergencyIncident;
  onClick: () => void;
  isSelected?: boolean;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onClick,
  isSelected = false,
}) => {
  const { isAdmin } = useAuth();
  const { deleteIncident } = useIncidents();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const getCategoryIcon = (cat: EmergencyCategory) => {
    switch (cat) {
      case 'fire':
        return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case 'medical':
        return <Activity className="w-3.5 h-3.5 text-rose-400" />;
      case 'accident':
        return <Car className="w-3.5 h-3.5 text-amber-400" />;
      case 'flood_weather':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'crime_security':
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />;
      case 'marine_coastal':
        return <Anchor className="w-3.5 h-3.5 text-teal-400" />;
      case 'infrastructure':
        return <Zap className="w-3.5 h-3.5 text-orange-400" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-600 text-white font-black animate-pulse';
      case 'high':
        return 'bg-orange-600 text-white font-black';
      case 'medium':
        return 'bg-[#d4af37] text-slate-950 font-black';
      default:
        return 'bg-emerald-600 text-white font-bold';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'reported':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/60';
      case 'dispatched':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/60';
      case 'in_progress':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/60';
      case 'resolved':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60';
      case 'false_alarm':
        return 'bg-slate-800 text-slate-300 border-slate-600';
      default:
        return 'bg-[#3b0816] text-amber-200 border-[#841c34]';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden p-3 flex flex-col justify-between ${
        isSelected
          ? 'bg-[#360814] border-2 border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-lg shadow-black/50'
          : 'bg-[#22040c] border border-[#841c34]/80 hover:border-[#d4af37]/70 hover:bg-[#2b0610] shadow-md'
      }`}
    >
      {/* Top Meta Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${getSeverityBadge(
                incident.severity
              )}`}
            >
              {incident.severity}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border ${getStatusBadge(
                incident.status
              )}`}
            >
              {incident.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-amber-200/70 font-semibold">
            {getCategoryIcon(incident.category)}
            <span className="capitalize hidden sm:inline">{incident.category.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Thumbnail + Title Row */}
        <div className="flex gap-2.5">
          {incident.imageUrl && (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-black/40 shrink-0 border border-[#841c34]">
              <img
                src={incident.imageUrl}
                alt={incident.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xs sm:text-sm text-white group-hover:text-[#f3c853] transition leading-snug">
              {incident.title}
            </h3>
            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
              {incident.description}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 pt-2 border-t border-[#841c34]/60 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1 font-bold text-amber-200 truncate text-[11px]">
            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
            <span>{incident.district}: {incident.locationName}</span>
          </span>
          <span className="text-[10px] text-amber-200/60 shrink-0 font-mono">
            {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {incident.assignedUnit && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-200 font-bold bg-[#380714] px-2 py-0.5 rounded border border-[#d4af37]/30">
            <Truck className="w-3 h-3 text-[#d4af37] shrink-0" />
            <span className="truncate">{incident.assignedUnit}</span>
          </div>
        )}

        {/* Admin Quick Delete Confirmation Bar */}
        {isAdmin && confirmDelete && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-red-950/95 border border-red-500 rounded-lg text-xs space-y-1.5 animate-in fade-in"
          >
            <div className="text-[11px] font-bold text-red-200">
              Permanently delete this incident?
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsDeleting(true);
                  try {
                    await deleteIncident(incident.id);
                  } catch (err) {
                    console.error('Failed to delete incident', err);
                    setIsDeleting(false);
                    setConfirmDelete(false);
                  }
                }}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 transition"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Yes, Delete
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">
              By: <strong className="text-amber-200">{incident.reporterName}</strong>
            </span>
            {isAdmin && !confirmDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                title="Admin: Delete Incident"
                className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/60 transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className="text-[11px] font-black text-[#d4af37] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
