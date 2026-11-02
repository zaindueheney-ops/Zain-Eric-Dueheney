import React from 'react';
import {
  AlertTriangle,
  Flame,
  Shield,
  User,
  LogOut,
  LogIn,
  Radio,
  SlidersHorizontal,
  Activity,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { useChat } from '../context/ChatContext';

interface NavbarProps {
  onOpenReportModal: () => void;
  onToggleFilters?: () => void;
  hasPinnedLocation?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenReportModal,
  onToggleFilters,
  hasPinnedLocation,
}) => {
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

  // Public active counts MUST strictly count approved emergency incidents
  const activeIncidentsCount = approvedIncidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'false_alarm'
  ).length;

  const criticalCount = approvedIncidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'false_alarm'
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-[#2b0510] border-b-2 border-[#d4af37] text-white shadow-xl shadow-black/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        {/* Brand and Official Belize Alerts Logo */}
        <div className="flex items-center gap-3">
          {/* Official Belize Alerts Sendai Framework Logo */}
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts Logo"
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl object-cover border-2 border-[#d4af37] shadow-xl shadow-black/60 hover:scale-105 transition-transform"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-xl text-white tracking-tight leading-none">
                Belize <span className="text-[#f3c853]">Alerts</span>
              </h1>
              {/* Live Dispatch Badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-slate-950 shadow-sm border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                LIVE DISPATCH
              </span>
            </div>
            {/* Zain Dueheney Subtitle */}
            <p className="text-[11px] font-semibold text-[#f3c853] tracking-wide block leading-tight mt-0.5">
              by Zain Dueheney
            </p>
          </div>
        </div>

        {/* Status Indicators & Action CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Incidents Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#3d0817] border border-[#d4af37]/50 text-xs text-amber-200">
            <span className="text-amber-200/80 font-bold">Active:</span>
            <span className={`font-black ${activeIncidentsCount > 0 ? 'text-[#facc15]' : 'text-emerald-400'}`}>
              {activeIncidentsCount}
            </span>
            {criticalCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">
                {criticalCount} Critical
              </span>
            ) : activeIncidentsCount === 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                All Clear
              </span>
            ) : null}
          </div>

          {/* Administrator Pending Approvals Badge (Prominently visible when logged in as admin) */}
          {isAdmin && (
            <a
              href="#admin-approvals-desk"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                pendingIncidents.length > 0
                  ? 'bg-amber-500/20 text-yellow-300 border-[#d4af37] animate-pulse hover:bg-amber-500/30'
                  : 'bg-[#3d0817] text-amber-200/80 border-[#841c34] hover:bg-[#4d0b1f]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Admin: {pendingIncidents.length} Pending</span>
            </a>
          )}

          {/* The Single Official Report Incident Button (Burgundy & Gold Styled) */}
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
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-[#8b152e] to-[#600b1d] hover:from-red-500 hover:to-[#8b152e] text-white text-xs sm:text-sm font-black border-2 border-[#d4af37] shadow-lg shadow-black/50 transition hover:scale-105 active:scale-95 ${
              hasPinnedLocation ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#2b0510]' : ''
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#facc15] animate-bounce shrink-0" />
            <span>Report Incident</span>
            {hasPinnedLocation && (
              <span className="hidden sm:inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-[#d4af37] text-slate-950 font-black">
                📍 Pin Set
              </span>
            )}
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
            title="Open Live Dispatch Chat"
            className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#3d0817] hover:bg-[#520b1f] text-amber-200 hover:text-white border border-[#d4af37]/60 text-xs font-bold transition shadow hover:scale-105 active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-[#d4af37]" />
            <span className="hidden sm:inline">Dispatch Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center animate-pulse border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                title="View / Edit Responder Profile"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#3d0817] hover:bg-[#4d0b1f] border border-[#d4af37]/60 text-white transition"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-[#d4af37] object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#d4af37] text-slate-950 flex items-center justify-center text-xs font-black">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold leading-none truncate max-w-[120px] text-white">
                    {profile?.displayName || user.displayName || 'Citizen'}
                  </div>
                  <div className="text-[10px] text-[#f3c853] font-semibold uppercase">
                    {profile?.role || (isAdmin ? 'Admin' : 'Citizen')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={signOut}
                title="Sign Out"
                className="p-2 rounded-xl text-amber-200/80 hover:text-red-400 hover:bg-[#3d0817] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthGreetingModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-slate-950 text-xs font-black shadow transition hover:scale-105"
            >
              <LogIn className="w-4 h-4 text-slate-950" />
              <span>Log In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
