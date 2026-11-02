import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IncidentProvider, useIncidents } from './context/IncidentContext';
import { AdvisoryProvider } from './context/AdvisoryContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Navbar } from './components/Navbar';
import { TopAdvisoryBanner } from './components/TopAdvisoryBanner';
import { BelizeGoogleIncidentMap } from './components/BelizeGoogleIncidentMap';
import { IncidentFilterBar } from './components/IncidentFilterBar';
import { IncidentCard } from './components/IncidentCard';
import { ReportEmergencyModal } from './components/ReportEmergencyModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { SelfRegistrationModal } from './components/SelfRegistrationModal';
import { WelcomeAuthModal } from './components/WelcomeAuthModal';
import { AdminPendingApprovals } from './components/AdminPendingApprovals';
import { DispatchChatModal } from './components/DispatchChatModal';
import { DailyIncidentTrends } from './components/DailyIncidentTrends';
import {
  MapPin,
  ListFilter,
  AlertTriangle,
  Flame,
  Activity,
  Shield,
  Radio,
  RefreshCw,
  Plus,
  Info,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  Clock,
  MessageSquare
} from 'lucide-react';
import { BELIZE_DISTRICTS } from './data/belizeGeo';
import { BelizeDistrict } from './types';

function MainEmergencyApp() {
  const { user, profile, isAdmin, setShowAuthGreetingModal, setShowRegisterModal } = useAuth();
  const {
    incidents,
    selectedIncident,
    setSelectedIncident,
    filteredIncidents,
    pendingIncidents,
    myPendingIncidents,
    approvedIncidents,
    approveIncident,
    rejectIncident,
  } = useIncidents();
  const { setIsChatOpen, unreadCount } = useChat();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportInitialCoords, setReportInitialCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reportInitialDistrict, setReportInitialDistrict] = useState<BelizeDistrict | undefined>(undefined);
  const [isCurrentLocationReport, setIsCurrentLocationReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');

  // Active public emergency count MUST strictly count approved incidents
  const activeCount = approvedIncidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'false_alarm'
  ).length;

  return (
    <div className="min-h-screen bg-[#130206] flex flex-col font-sans text-white selection:bg-[#d4af37] selection:text-black">
      {/* Main Navbar - Contains the Single Official Report Incident Button and Live Dispatch Logo */}
      <Navbar
        onOpenReportModal={() => setIsReportModalOpen(true)}
        hasPinnedLocation={Boolean(reportInitialCoords && reportInitialCoords.lat !== 0)}
      />

      {/* Broadcast Alert Banner if critical emergencies are active (strictly approved incidents only) */}
      {approvedIncidents.some((i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'false_alarm') && (
        <div className="bg-red-700 text-white px-3 py-1.5 text-xs font-black flex items-center justify-between shadow-md border-b border-red-500/50">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-300 animate-pulse shrink-0" />
            <span>
              <strong>CRITICAL BELIZE EMERGENCY ALERT:</strong> Active life-threat incidents reported. Emergency services responding. Please yield roadway right-of-way.
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area - Packed tightly to remove white space */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-2.5 space-y-2.5">
        {/* Administrator Pending Approvals Section (Accessible when logged in as Zain Dueheney) */}
        {isAdmin && (
          <div id="admin-approvals-desk">
            <AdminPendingApprovals
              pendingIncidents={pendingIncidents}
              onApproveIncident={approveIncident}
              onRejectIncident={rejectIncident}
              adminEmail={user?.email || 'zaindueheney@gmail.com'}
            />
          </div>
        )}

        {/* Citizen Reporter Status Banner (Only visible to the user who filed a pending report, never public) */}
        {!isAdmin && myPendingIncidents.length > 0 && (
          <div className="bg-[#240a12] border-2 border-amber-500/70 p-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-yellow-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Your Report is Awaiting Administrator Verification ({myPendingIncidents.length})
                </h4>
                <p className="text-[11px] text-amber-300/80">
                  Your submitted emergency report has been received and is being verified by central dispatch. It will appear on the public map once approved.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-yellow-300 border border-amber-500/40 shrink-0">
              Pending Review
            </span>
          </div>
        )}

        {/* Official National Advisory Desk (Top Section with PDF and Image Upload / Display) */}
        <TopAdvisoryBanner />

        {/* Daily Incident Trends Chart (Frequency of reported emergencies over the last 7 days) */}
        <DailyIncidentTrends incidents={incidents} />

        {/* Header Ribbon with Live Counts and Quick Map/List Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>Live Emergency Operations</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${
                  activeCount > 0
                    ? 'bg-red-600 text-white border-red-400 animate-pulse'
                    : 'bg-emerald-900/90 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {activeCount > 0 ? `${activeCount} Active` : '0 Active (All Clear)'}
              </span>
            </h2>
          </div>

          {/* View Mode Switcher (Burgundy & Gold) */}
          <div className="flex items-center gap-1 bg-[#24050e] p-1 rounded-xl border border-[#d4af37]/60 shadow-md self-stretch sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-slate-950 font-black shadow-md'
                  : 'text-amber-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Interactive Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f59e0b] text-slate-950 font-black shadow-md'
                  : 'text-amber-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Incident Feed ({filteredIncidents.length})</span>
            </button>
          </div>
        </div>

        {/* Compact Filter Toolbar (Search Removed, Burgundy & Gold) */}
        <IncidentFilterBar />

        {/* TAB 1: INTERACTIVE MAP VIEW */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            {/* Map Container (Takes 8 cols on desktop, expanded height to maximize screen) */}
            <div className="lg:col-span-8 space-y-2">
              <BelizeGoogleIncidentMap
                incidents={filteredIncidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                selectedIncidentId={selectedIncident?.id}
                className="h-[520px] sm:h-[620px] w-full"
                onReportAtCoordinates={(coords, district, isAtCurrentLocation) => {
                  if (coords.lat === 0 && coords.lng === 0) {
                    setReportInitialCoords(null);
                    setReportInitialDistrict(undefined);
                    setIsCurrentLocationReport(false);
                  } else {
                    setReportInitialCoords(coords);
                    setReportInitialDistrict(district);
                    setIsCurrentLocationReport(Boolean(isAtCurrentLocation));
                  }
                }}
              />

              {/* Map Legend Bar (Burgundy & Gold) */}
              <div className="bg-[#20030a] p-2.5 rounded-xl border border-[#d4af37]/40 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200">
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-[#f3c853]">Legend:</span>
                  <div className="flex items-center gap-2.5 flex-wrap text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shadow-sm"></span>
                      Critical
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white shadow-sm"></span>
                      High
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] border border-white shadow-sm"></span>
                      Medium
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-sm"></span>
                      Resolved
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {reportInitialCoords && reportInitialCoords.lat !== 0 ? (
                    <span className="text-[11px] font-black text-red-300 bg-red-950/80 border border-red-500 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                      Pin Locked: {reportInitialDistrict}
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-200/70 font-semibold hidden sm:inline">
                      Tap map or click My Location to pin incident spot
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Live Feed (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <div className="bg-[#22040c] p-3 rounded-xl border border-[#d4af37]/50 shadow-md flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Live Incident Stream
                  </h3>
                  <p className="text-[10px] text-amber-200/70">Verified by Belize Central Dispatch</p>
                </div>
                <span className="text-[11px] font-mono text-[#f3c853] font-bold">
                  {filteredIncidents.length} Records
                </span>
              </div>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredIncidents.length === 0 ? (
                  <div className="bg-[#22040c] p-6 rounded-2xl border border-[#841c34] text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-950/90 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/50">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        No Active Emergencies
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                        No emergency incidents currently reported in Belize. Live incidents submitted by citizens and verified by central dispatch will appear here.
                      </p>
                      <p className="text-[11px] text-amber-300 font-bold pt-2">
                        To report an emergency, use the <strong className="text-red-400">Report Incident</strong> button at the top.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredIncidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      isSelected={selectedIncident?.id === incident.id}
                      onClick={() => setSelectedIncident(incident)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCIDENT DIRECTORY & GRID */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredIncidents.length === 0 ? (
                <div className="col-span-full bg-[#22040c] p-8 rounded-2xl border border-[#841c34] text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/90 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/50">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-sm text-white">No Emergency Incidents Reported</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    All districts are currently operating under normal conditions. To broadcast a genuine emergency or public hazard, use the Report Incident button in the top navigation bar.
                  </p>
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    isSelected={selectedIncident?.id === incident.id}
                    onClick={() => setSelectedIncident(incident)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ReportEmergencyModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportInitialCoords(null);
          setReportInitialDistrict(undefined);
          setIsCurrentLocationReport(false);
        }}
        initialCoordinates={reportInitialCoords}
        initialDistrict={reportInitialDistrict}
        isAtCurrentLocation={isCurrentLocationReport}
        onSuccess={(id) => {
          const created = incidents.find((i) => i.id === id);
          if (created && (created.status !== 'reported' || isAdmin)) {
            setSelectedIncident(created);
          }
        }}
      />

      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />

      <SelfRegistrationModal />
      <WelcomeAuthModal />
      <DispatchChatModal />

      {/* Floating Dispatch Chat Launcher Widget (Bottom-Right) */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            if (!user) {
              setShowAuthGreetingModal(true);
            } else if (!profile) {
              setShowRegisterModal(true);
            } else {
              setIsChatOpen(true);
            }
          }}
          className="group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#b8860b] hover:from-[#f3c853] hover:to-[#d4af37] text-slate-950 font-black text-xs shadow-2xl shadow-black/80 border-2 border-white/80 transition-all duration-300 hover:scale-105 active:scale-95"
          title="Open Live Dispatch Chat"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
          </div>
          <span className="tracking-tight font-black uppercase text-[11px]">
            {isAdmin ? 'Dispatch Chat Desk' : 'Chat with Dispatch'}
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black text-[10px] animate-pulse shadow">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Footer (Burgundy & Gold, tight spacing) */}
      <footer className="bg-[#1b0309] border-t border-[#841c34] py-3 px-4 text-center text-xs text-amber-200/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts Logo"
              className="w-8 h-8 rounded-lg object-cover border border-[#d4af37]/60 shadow"
            />
            <div className="text-left">
              <span className="font-black text-white">Belize Alerts</span>
              <span className="text-[11px] text-[#f3c853]"> by Zain Dueheney</span>
              <span className="hidden sm:inline text-amber-200/60"> • Live Dispatch & Geolocation Operations</span>
              <p className="text-[10px] text-amber-200/60">Sendai Framework for Disaster Risk Reduction 2015–2030</p>
            </div>
          </div>
          <div className="text-[11px] text-amber-200/80 font-medium">
            Serving Citizens, First Responders, and Central Emergency Dispatch across Belize.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <IncidentProvider>
        <AdvisoryProvider>
          <ChatProvider>
            <MainEmergencyApp />
          </ChatProvider>
        </AdvisoryProvider>
      </IncidentProvider>
    </AuthProvider>
  );
}
