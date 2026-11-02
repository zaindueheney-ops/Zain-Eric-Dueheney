import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Building,
  Phone,
  ExternalLink,
  Save
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useAuth } from '../../context/AuthContext';
import { EOCAlertPhase, NationalEmergencyStatus } from '../../types';

export const SystemSettingsView: React.FC = () => {
  const { nationalStatus, updateNationalStatus } = useCommand();
  const { isAdmin } = useAuth();

  const [phase, setPhase] = useState<EOCAlertPhase>(nationalStatus.phase);
  const [phaseLabel, setPhaseLabel] = useState(nationalStatus.phaseLabel);
  const [bulletinSummary, setBulletinSummary] = useState(nationalStatus.bulletinSummary);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePhaseChange = (newPhase: EOCAlertPhase) => {
    setPhase(newPhase);
    switch (newPhase) {
      case 'green_normal':
        setPhaseLabel('Green Alert (Phase 1) - Normal Operations');
        setBulletinSummary('All national emergency systems are functioning normally under Phase 1 baseline readiness.');
        break;
      case 'yellow_advisory':
        setPhaseLabel('Yellow Alert (Phase 2) - Weather Advisory');
        setBulletinSummary('Elevated monitoring active. Regional tropical weather or coastal flood watch in effect for Belize.');
        break;
      case 'orange_watch':
        setPhaseLabel('Orange Alert (Phase 3) - Disaster / Storm Watch');
        setBulletinSummary('Civil emergency units on 24/7 standby. Evacuation centres pre-positioned. Mandatory coordination active.');
        break;
      case 'red_warning':
        setPhaseLabel('Red Alert (Phase 4) - Disaster Warning Active');
        setBulletinSummary('IMMINENT LIFE THREAT EMERGENCY. Full EOC mobilization across all six districts. Evacuate designated flood zones.');
        break;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateNationalStatus({
        phase,
        phaseLabel,
        bulletinSummary,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Command Centre System Settings & EOC Status
            </h2>
            <p className="text-[11px] text-slate-400">
              National alert phases, live meteorological synchronization, and statutory EOC declarations
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>✓ National Emergency Operation Status updated across all connected devices.</span>
        </div>
      )}

      {/* National Emergency Alert Phase / DEFCON Selector */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#d4af37]" />
            <span>National EOC Operational Readiness Phase (DEFCON)</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Declared: {new Date(nationalStatus.declaredAt).toLocaleTimeString()}
          </span>
        </div>

        {isAdmin ? (
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePhaseChange('green_normal')}
                className={`p-3 rounded-xl border text-left transition ${
                  phase === 'green_normal'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold shadow-lg ring-2 ring-emerald-500/50'
                    : 'bg-[#121c2e] text-slate-400 border-[#233555] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="font-black text-xs uppercase">Phase 1: Green</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-400">Normal Readiness</div>
              </button>

              <button
                type="button"
                onClick={() => handlePhaseChange('yellow_advisory')}
                className={`p-3 rounded-xl border text-left transition ${
                  phase === 'yellow_advisory'
                    ? 'bg-amber-950/80 text-yellow-300 border-amber-500 font-bold shadow-lg ring-2 ring-amber-500/50'
                    : 'bg-[#121c2e] text-slate-400 border-[#233555] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="font-black text-xs uppercase">Phase 2: Yellow</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-400">Hazard Advisory</div>
              </button>

              <button
                type="button"
                onClick={() => handlePhaseChange('orange_watch')}
                className={`p-3 rounded-xl border text-left transition ${
                  phase === 'orange_watch'
                    ? 'bg-orange-950/80 text-orange-300 border-orange-500 font-bold shadow-lg ring-2 ring-orange-500/50'
                    : 'bg-[#121c2e] text-slate-400 border-[#233555] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <span className="font-black text-xs uppercase">Phase 3: Orange</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-400">Storm / Flood Watch</div>
              </button>

              <button
                type="button"
                onClick={() => handlePhaseChange('red_warning')}
                className={`p-3 rounded-xl border text-left transition ${
                  phase === 'red_warning'
                    ? 'bg-red-950/90 text-red-300 border-red-500 font-bold shadow-lg ring-2 ring-red-500/50 animate-pulse'
                    : 'bg-[#121c2e] text-slate-400 border-[#233555] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="font-black text-xs uppercase">Phase 4: Red</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-400">Disaster Mobilization</div>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                National Broadcast Bulletin Summary:
              </label>
              <textarea
                rows={2}
                value={bulletinSummary}
                onChange={(e) => setBulletinSummary(e.target.value)}
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating EOC Status...' : 'Publish Phase Update'}</span>
            </button>
          </form>
        ) : (
          <div className="bg-[#070c17] p-3 rounded-xl border border-[#1e2e4a] text-xs space-y-1">
            <div className="font-bold text-white text-sm">{nationalStatus.phaseLabel}</div>
            <p className="text-slate-300 text-[11px]">{nationalStatus.bulletinSummary}</p>
          </div>
        )}
      </div>

      {/* External Data Integrations Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>National Meteorological Service of Belize</span>
            </h4>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Synced Live
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Direct feed authorized under Chief Meteorologist Ronald Gordon. Synchronizes real-time marine weather, tropical outlooks, and localized rainfall alerts from <strong className="text-white">nms.gov.bz</strong>.
          </p>
          <a
            href="https://nms.gov.bz/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#d4af37] hover:underline font-bold inline-flex items-center gap-1 mt-1"
          >
            <span>Visit Official NMS Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-[#d4af37]" />
              <span>National EOC Belmopan HQ</span>
            </h4>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Stationed
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Central Emergency Operations Centre, NEMO Headquarters, University Drive, City of Belmopan, Cayo District, Belize. Hotline: <strong className="text-white">822-0153 / 822-2054</strong>.
          </p>
          <div className="text-[10px] text-slate-400 font-mono pt-1">
            Compliant with Sendai Framework for Disaster Risk Reduction 2015–2030
          </div>
        </div>
      </div>
    </div>
  );
};
