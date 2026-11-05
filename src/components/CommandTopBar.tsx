import React, { useState, useEffect } from 'react';
import {
  Menu,
  AlertTriangle,
  Clock,
  Radio,
  MessageSquare,
  Shield,
  LogOut,
  User,
  ExternalLink,
  ChevronDown,
  Bell,
  Award
} from 'lucide-react';
import { useCommand } from '../context/CommandContext';
import { useAuth, isAuthorizedAdminEmail } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { useChat } from '../context/ChatContext';

interface CommandTopBarProps {
  onOpenReportModal: () => void;
  hasPinnedLocation?: boolean;
}

export const CommandTopBar: React.FC<CommandTopBarProps> = ({
  onOpenReportModal,
  hasPinnedLocation,
}) => {
  const {
    nationalStatus,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    setActiveTab,
  } = useCommand();

  const {
    user,
    profile,
    isAdmin,
    signOut,
    setShowRegisterModal,
    setShowAuthGreetingModal,
  } = useAuth();

  const { approvedIncidents, pendingIncidents } = useIncidents();
  const { setIsChatOpen, unreadCount } = useChat();

  // Clock in Belize Local Time (UTC-6)
  const [belizeTime, setBelizeTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Belize time (UTC-6)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Belize',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setBelizeTime(new Intl.DateTimeFormat('en-US', options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSuperAdmin = Boolean(
    isAuthorizedAdminEmail(user?.email) || profile?.adminRole === 'super_admin'
  );

  const activeCount = approvedIncidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'false_alarm'
  ).length;

  const criticalCount = approvedIncidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'false_alarm'
  ).length;

  // Status phase styling
  const phaseStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    green_normal: {
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-300',
      border: 'border-emerald-500/50',
      dot: 'bg-emerald-400',
    },
    yellow_advisory: {
      bg: 'bg-amber-950/80',
      text: 'text-yellow-300',
      border: 'border-amber-500/50',
      dot: 'bg-yellow-400',
    },
    orange_watch: {
      bg: 'bg-orange-950/80',
      text: 'text-orange-300',
      border: 'border-orange-500/50',
      dot: 'bg-orange-400',
    },
    red_warning: {
      bg: 'bg-red-950/90',
      text: 'text-red-300',
      border: 'border-red-500/60',
      dot: 'bg-red-500',
    },
  };

  const currentPhaseStyle = phaseStyles[nationalStatus.phase] || phaseStyles.green_normal;

  return (
    <header className="sticky top-0 z-30 bg-[#070c17] border-b border-[#1e293b] text-white shadow-xl shadow-black/50 backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: Mobile Sidebar Toggle & Platform Title */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#131b2e] hover:bg-[#1c2945] text-slate-300 hover:text-white border border-[#233555] transition"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-[#d4af37]/80 shadow shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5 leading-none">
                  <span>BELIZE ALERTS</span>
                  <span className="text-[#f3c853] font-bold text-xs sm:text-sm">by Zain Dueheney</span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide hidden sm:block mt-0.5">
                National Emergency Information & Response Operations Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: Operational Status Pill & Live Clock */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* DEFCON / Emergency Alert Phase */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-black shadow-inner ${currentPhaseStyle.bg} ${currentPhaseStyle.text} ${currentPhaseStyle.border}`}
            title={`Declared by: ${nationalStatus.declaredBy}`}
          >
            <span className={`w-2 h-2 rounded-full ${currentPhaseStyle.dot} animate-ping`} />
            <span className="uppercase tracking-wider text-[11px]">{nationalStatus.phaseLabel}</span>
          </div>

          {/* Belize Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#101726] border border-[#1e293b] text-[11px] font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{belizeTime || 'Belize Time (UTC-6)'}</span>
          </div>
        </div>

        {/* Right: Actions, Incident CTA, Live Dispatch, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Our Initiative Button */}
          <button
            type="button"
            onClick={() => setActiveTab('our_initiative')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141d2e] hover:bg-[#1e2c45] border border-[#273857] text-[#d4af37] text-xs font-bold transition shadow-sm"
            title="Our Initiative • Zain Dueheney"
          >
            <Award className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Our Initiative</span>
          </button>

          {/* Active / Critical Incidents Badge */}
          <button
            type="button"
            onClick={() => setActiveTab('incident_management')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#101726] hover:bg-[#1a253d] border border-[#233555] text-xs transition"
            title="View Incidents"
          >
            <span className="text-slate-400 font-bold text-[11px]">Active:</span>
            <span className={`font-black ${activeCount > 0 ? 'text-[#facc15]' : 'text-emerald-400'}`}>
              {activeCount}
            </span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-600 text-white animate-pulse">
                {criticalCount} Critical
              </span>
            )}
          </button>

          {/* Pending Verification Counter for Admins */}
          {isAdmin && pendingIncidents.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('incident_management')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-yellow-300 border border-[#d4af37] text-xs font-black transition animate-pulse"
              title="Reports Awaiting Administrator Verification"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              <span>{pendingIncidents.length} Pending</span>
            </button>
          )}

          {/* Official Report Incident CTA */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                setShowAuthGreetingModal(true);
                return;
              }
              if (!profile) {
                setShowRegisterModal(true);
                return;
              }
              onOpenReportModal();
            }}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-[#8b152e] to-[#600b1d] hover:from-red-500 hover:to-[#8b152e] text-white text-xs font-black border border-[#d4af37] shadow-lg shadow-black/50 transition hover:scale-105 active:scale-95 ${
              hasPinnedLocation ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#070c17]' : ''
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#facc15] animate-bounce shrink-0" />
            <span>Report Incident</span>
          </button>

          {/* Live Dispatch Chat Button */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                setShowAuthGreetingModal(true);
                return;
              }
              if (!profile) {
                setShowRegisterModal(true);
                return;
              }
              setIsChatOpen(true);
            }}
            className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#131b2e] hover:bg-[#1d2a47] text-amber-200 hover:text-white border border-[#2a3b5c] text-xs font-bold transition shadow"
            title="Open Live Central Dispatch Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden xl:inline">Dispatch Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center animate-pulse border border-white">
                {unreadCount}
              </span>
            )}
          </button>


          {/* User Auth Profile Dropdown */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                title="Profile Details & District Scope"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#101726] hover:bg-[#1a253d] border border-[#233555] text-white transition"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-slate-950 flex items-center justify-center text-xs font-black">
                  {profile?.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold leading-none truncate max-w-[110px] text-white">
                    {profile?.displayName || 'Responder'}
                  </div>
                  <div className="text-[9px] text-[#f3c853] font-semibold uppercase mt-0.5">
                    {isSuperAdmin ? 'Super Admin' : profile?.adminRole || profile?.role || 'Citizen'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-[#1a253d] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthGreetingModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black shadow transition hover:scale-105"
            >
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
