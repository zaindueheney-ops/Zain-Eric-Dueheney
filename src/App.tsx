import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IncidentProvider, useIncidents } from './context/IncidentContext';
import { AdvisoryProvider } from './context/AdvisoryContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { CommandProvider, useCommand } from './context/CommandContext';

import { CommandSidebar } from './components/CommandSidebar';
import { CommandTopBar } from './components/CommandTopBar';

// Views
import { CommandDashboardView } from './components/views/CommandDashboardView';
import { OurInitiativeView } from './components/views/OurInitiativeView';
import { NationalIncidentMapView } from './components/views/NationalIncidentMapView';
import { IncidentManagementView } from './components/views/IncidentManagementView';
import { EmergencyAlertsView } from './components/views/EmergencyAlertsView';
import { ResponseOperationsView } from './components/views/ResponseOperationsView';
import { CommunitySafetyView } from './components/views/CommunitySafetyView';
import { SchoolSafetyView } from './components/views/SchoolSafetyView';
import { EvacuationCentresView } from './components/views/EvacuationCentresView';
import { AnalyticsReportsView } from './components/views/AnalyticsReportsView';
import { NotificationsView } from './components/views/NotificationsView';
import { UserManagementView } from './components/views/UserManagementView';
import { AdministratorManagementView } from './components/views/AdministratorManagementView';
import { OrganizationManagementView } from './components/views/OrganizationManagementView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SystemSettingsView } from './components/views/SystemSettingsView';

// Modals
import { ReportEmergencyModal } from './components/ReportEmergencyModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { SelfRegistrationModal } from './components/SelfRegistrationModal';
import { WelcomeAuthModal } from './components/WelcomeAuthModal';
import { DispatchChatModal } from './components/DispatchChatModal';

import { MessageSquare, AlertTriangle, Shield } from 'lucide-react';
import { BelizeDistrict } from './types';

function MainEmergencyCommandApp() {
  const { user, profile, isAdmin, setShowAuthGreetingModal, setShowRegisterModal } = useAuth();
  const { incidents, selectedIncident, setSelectedIncident } = useIncidents();
  const { activeTab, sidebarCollapsed } = useCommand();
  const { setIsChatOpen, unreadCount } = useChat();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportInitialCoords, setReportInitialCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reportInitialDistrict, setReportInitialDistrict] = useState<BelizeDistrict | undefined>(undefined);
  const [isCurrentLocationReport, setIsCurrentLocationReport] = useState(false);

  // Active view renderer
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'command_dashboard':
        return <CommandDashboardView />;
      case 'our_initiative':
        return <OurInitiativeView />;
      case 'national_map':
        return (
          <NationalIncidentMapView
            onSetPinnedLocation={(coords, district, isCurrentLoc) => {
              setReportInitialCoords(coords);
              setReportInitialDistrict(district);
              setIsCurrentLocationReport(isCurrentLoc);
            }}
          />
        );
      case 'incident_management':
        return <IncidentManagementView />;
      case 'emergency_alerts':
        return <EmergencyAlertsView />;
      case 'response_operations':
        return <ResponseOperationsView />;
      case 'community_safety':
        return <CommunitySafetyView />;
      case 'school_safety':
        return <SchoolSafetyView />;
      case 'evacuation_centres':
        return <EvacuationCentresView />;
      case 'analytics_reports':
        return <AnalyticsReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'user_management':
        return <UserManagementView />;
      case 'administrator_management':
        return <AdministratorManagementView />;
      case 'organization_management':
        return <OrganizationManagementView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'system_settings':
        return <SystemSettingsView />;
      default:
        return <CommandDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-white flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
      {/* 15-Item Navigation Sidebar */}
      <CommandSidebar />

      {/* Main Wrapper with responsive sidebar padding */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Command Top Bar with Belize Local Clock & Status Indicator */}
        <CommandTopBar
          onOpenReportModal={() => setIsReportModalOpen(true)}
          hasPinnedLocation={Boolean(reportInitialCoords && reportInitialCoords.lat !== 0)}
        />

        {/* Content Container */}
        <main className="flex-1 p-2.5 sm:p-4 max-w-[1720px] w-full mx-auto">
          {renderCurrentView()}
        </main>

        {/* Command Centre Footer */}
        <footer className="bg-[#04070d] border-t border-[#152033] py-3 px-4 text-xs text-slate-400">
          <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/image_ff7e619e.png"
                alt="Belize Alerts Logo"
                className="w-7 h-7 rounded-lg object-cover border border-[#d4af37]/60 shadow"
              />
              <div className="text-left leading-tight">
                <span className="font-black text-white">Belize Alerts Command Centre</span>
                <span className="text-[11px] text-[#f3c853]"> by Zain Dueheney</span>
                <span className="hidden sm:inline text-slate-500"> • Multi-Agency Emergency Platform</span>
                <p className="text-[10px] text-slate-500">Sendai Framework for Disaster Risk Reduction 2015–2030</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium text-center sm:text-right">
              Emergency Operations Centre & Civil Defense Network • 24/7 Dispatch Coordination
            </div>
          </div>
        </footer>
      </div>

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

      {/* Floating Central Dispatch Chat Launcher Widget */}
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
          title="Open Live Central Dispatch Chat"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <IncidentProvider>
        <AdvisoryProvider>
          <CommandProvider>
            <ChatProvider>
              <MainEmergencyCommandApp />
            </ChatProvider>
          </CommandProvider>
        </AdvisoryProvider>
      </IncidentProvider>
    </AuthProvider>
  );
}
