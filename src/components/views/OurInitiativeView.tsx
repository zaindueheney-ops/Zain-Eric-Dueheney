import React from 'react';
import {
  Award,
  GraduationCap,
  Shield,
  Radio,
  Users,
  Compass,
  ArrowRight,
  HeartHandshake,
  Globe2,
  FileText,
  Building,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';

export const OurInitiativeView: React.FC = () => {
  const { setActiveTab } = useCommand();

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Hero Showcase Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1629] via-[#09101d] to-[#040810] border-2 border-[#d4af37]/50 shadow-2xl p-6 sm:p-8 lg:p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Photo & Founder Credentials */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#d4af37] via-amber-500 to-[#b8860b] rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/90 shadow-2xl max-w-sm">
                <img
                  src="/assets/aistudio/Screenshot_2026-11-02_at_08.22.00_6248165a.png"
                  alt="Zain Dueheney - Founder of Belize Alerts DRR Initiative"
                  className="w-full h-auto object-cover object-top max-h-[380px] shadow-inner"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 text-left">
                  <h3 className="font-black text-white text-base">Zain Dueheney</h3>
                  <p className="text-[11px] text-[#f3c853] font-bold">
                    Lecturer at Galen University • DRR Innovator
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    Lead Architect & Founder, Belize Alerts
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Credential Badges */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[10px]">
              <span className="px-2.5 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                PhD Candidate (Public Admin & Business Science)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-[#f3c853] border border-amber-500/40 font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
                InfoSec & Business Continuity
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                Project Management & Cyber Security
              </span>
            </div>
          </div>

          {/* Core Initiative Narrative */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3c853] text-xs font-black tracking-widest uppercase shadow">
              <Award className="w-4 h-4 text-[#d4af37]" />
              <span>National DRR Platform</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              OUR INITIATIVE
            </h1>

            <div className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal space-y-3">
              <p className="font-semibold text-white">
                <strong className="text-[#f3c853]">Belize Alerts</strong> is a technology-driven Disaster Risk Reduction (DRR) initiative designed and developed by <strong className="text-white">Zain Dueheney</strong>, Lecturer at Galen University.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                With postgraduate qualifications in Information Security and Business Continuity, Project Management, and Cyber Security, and currently completing a PhD in Public Administration and Business Science, he conceptualized Belize Alerts to leverage technology in strengthening community resilience, improving early warning communication and enhancing citizen response to emergencies and disasters.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                The platform connects citizens, communities and emergency management stakeholders through accessible digital tools for emergency alerts, incident reporting, preparedness and information sharing.
              </p>

              <div className="p-4 rounded-2xl bg-[#070d18] border border-[#1e2d47] text-white">
                <div className="flex items-center gap-2 text-[#f3c853] font-bold text-xs uppercase tracking-wide">
                  <Lightbulb className="w-4 h-4 text-[#d4af37]" />
                  <span>Our Mission & Goal</span>
                </div>
                <p className="mt-1 text-sm sm:text-base font-bold italic text-slate-100">
                  “Our goal is to empower citizens, reduce disaster risks and contribute to a safer, more resilient Belize.”
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-base sm:text-lg font-black text-[#f3c853]">
                <Radio className="w-5 h-5 text-[#d4af37] animate-pulse" />
                <span>Belize Alerts – Connecting Information to Action.</span>
              </div>
            </div>

            {/* Quick Navigation Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('command_dashboard')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#b8860b] hover:from-[#f3c853] hover:to-[#d4af37] text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2 active:scale-95"
              >
                <span>Go to Command Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('community_safety')}
                className="px-4 py-2.5 rounded-xl bg-[#141d2e] hover:bg-[#1e2a42] text-slate-200 font-bold text-xs border border-[#273857] shadow transition flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Explore Community Safety Network</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic DRR Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1 */}
        <div className="bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-2.5 hover:border-[#d4af37]/60 transition">
          <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-500/40 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Early Warning Communication</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Direct integration with National Meteorological Service (NMS) bulletins, tropical cyclone watches, and national alert broadcasts.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-2.5 hover:border-[#d4af37]/60 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Citizen Empowerment</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Accessible digital reporting tools enabling verified citizens to communicate incidents directly to Emergency Operations Centres.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-2.5 hover:border-[#d4af37]/60 transition">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/40 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Institutional Coordination</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            National shelter tracking, school readiness audits, and multi-agency coordination suitable for NEMO, municipal, and NGO teams.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-lg space-y-2.5 hover:border-[#d4af37]/60 transition">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-[#f3c853] border border-amber-500/40 flex items-center justify-center">
            <Globe2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm">Sendai Framework (DRR)</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Aligned with the global Sendai Framework for Disaster Risk Reduction 2015–2030 to build systemic resilience across Belize.
          </p>
        </div>
      </div>

      {/* Galen University & Academic Leadership Citation */}
      <div className="bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#070b14] border border-[#d4af37]/40 flex items-center justify-center p-2 shrink-0">
            <GraduationCap className="w-7 h-7 text-[#d4af37]" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Galen University Academic Partnership & DRR Research</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Developed in Belize to foster applied research in Public Administration, Cyber Security, and Crisis Management.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono text-center sm:text-right shrink-0">
          Galen University • Belize
        </div>
      </div>
    </div>
  );
};
