import React, { useState } from 'react';
import { BELIZE_EMERGENCY_HOTLINES } from '../data/belizeGeo';
import { Phone, Shield, Flame, Activity, Waves, CloudLightning, ChevronRight, X } from 'lucide-react';
import { EmergencyHotline } from '../types';

export const EmergencyHotlinesBar: React.FC = () => {
  const [selectedHotline, setSelectedHotline] = useState<EmergencyHotline | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'police':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'fire':
        return <Flame className="w-4 h-4 text-red-600" />;
      case 'medical':
        return <Activity className="w-4 h-4 text-rose-600" />;
      case 'marine':
        return <Waves className="w-4 h-4 text-teal-600" />;
      default:
        return <CloudLightning className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-white py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="uppercase tracking-wider font-bold text-red-400">Belize Emergency Hotlines:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
            {BELIZE_EMERGENCY_HOTLINES.map((h) => (
              <button
                key={h.number}
                onClick={() => setSelectedHotline(h)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition shrink-0 hover:scale-105 active:scale-95"
              >
                {getIcon(h.iconType)}
                <span className="font-bold text-white">{h.number}</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-[100px]">
                  {h.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hotline Modal */}
      {selectedHotline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    {getIcon(selectedHotline.iconType)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {selectedHotline.name}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedHotline.organization}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHotline(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase">Emergency Dispatch Number</div>
                <div className="text-3xl font-black text-red-600 tracking-tight font-mono">
                  {selectedHotline.number}
                </div>
                <p className="text-xs text-slate-600">{selectedHotline.description}</p>
                <div className="text-[11px] text-slate-500 font-medium pt-1">
                  Availability: {selectedHotline.available}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedHotline(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <a
                  href={`tel:${selectedHotline.number.replace(/[^0-9]/g, '')}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition hover:scale-105"
                >
                  <Phone className="w-4 h-4" />
                  Dial Direct ({selectedHotline.number})
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
