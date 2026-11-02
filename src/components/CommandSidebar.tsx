import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  FileText,
  AlertTriangle,
  Radio,
  Users,
  GraduationCap,
  Home,
  BarChart3,
  Bell,
  UserCheck,
  ShieldAlert,
  Building2,
  FileCheck2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useCommand } from '../context/CommandContext';
import { useAuth, isAuthorizedAdminEmail } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { useAdvisories } from '../context/AdvisoryContext';
import { CommandViewTab } from '../types';

interface MenuItem {
  id: CommandViewTab;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  rolesAllowed: ('super_admin' | 'national_admin' | 'district_admin' | 'dispatcher' | 'school_admin' | 'citizen')[];
}

export const CommandSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    responseTeams,
  } = useCommand();

  const { user, profile, isAdmin } = useAuth();
  const { pendingIncidents, approvedIncidents } = useIncidents();
  const { advisories } = useAdvisories();

  const isSuperAdmin = Boolean(
    isAuthorizedAdminEmail(user?.email) || profile?.adminRole === 'super_admin'
  );

  // Derive active user role category
  const currentRoleCategory: 'super_admin' | 'national_admin' | 'district_admin' | 'dispatcher' | 'school_admin' | 'citizen' = (() => {
    if (isSuperAdmin) return 'super_admin';
    if (profile?.adminRole === 'national_admin') return 'national_admin';
    if (profile?.adminRole === 'district_admin') return 'district_admin';
    if (profile?.adminRole === 'school_admin') return 'school_admin';
    if (profile?.role === 'dispatcher' || profile?.role === 'responder' || profile?.adminRole === 'dispatcher') return 'dispatcher';
    if (profile?.role === 'admin') return 'national_admin';
    return 'citizen';
  })();

  const activeIncidentsCount = approvedIncidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'false_alarm'
  ).length;

  const deployedTeamsCount = responseTeams.filter((t) => t.status === 'deployed').length;
  const activeAlertsCount = advisories.filter((a) => a.active).length;

  const menuItems: MenuItem[] = [
    {
      id: 'command_dashboard',
      label: 'Command Dashboard',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher', 'school_admin', 'citizen'],
    },
    {
      id: 'national_map',
      label: 'National Incident Map',
      shortLabel: 'Map',
      icon: MapPin,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeColor: 'bg-red-600 text-white',
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher', 'school_admin', 'citizen'],
    },
    {
      id: 'incident_management',
      label: 'Incident Management',
      shortLabel: 'Incidents',
      icon: FileText,
      badge: pendingIncidents.length > 0 ? `${pendingIncidents.length} Pending` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher'],
    },
    {
      id: 'emergency_alerts',
      label: 'Emergency Alerts',
      shortLabel: 'Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher', 'school_admin', 'citizen'],
    },
    {
      id: 'response_operations',
      label: 'Response Operations',
      shortLabel: 'Response',
      icon: Radio,
      badge: deployedTeamsCount > 0 ? `${deployedTeamsCount} Active` : undefined,
      badgeColor: 'bg-blue-600 text-white',
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher'],
    },
    {
      id: 'community_safety',
      label: 'Community Safety',
      shortLabel: 'Communities',
      icon: Users,
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher', 'school_admin', 'citizen'],
    },
    {
      id: 'school_safety',
      label: 'School Safety',
      shortLabel: 'Schools',
      icon: GraduationCap,
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'school_admin'],
    },
    {
      id: 'evacuation_centres',
      label: 'Evacuation Centres',
      shortLabel: 'Shelters',
      icon: Home,
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher', 'school_admin', 'citizen'],
    },
    {
      id: 'analytics_reports',
      label: 'Analytics and Reports',
      shortLabel: 'Analytics',
      icon: BarChart3,
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin'],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      shortLabel: 'Notices',
      icon: Bell,
      rolesAllowed: ['super_admin', 'national_admin', 'district_admin', 'dispatcher', 'school_admin', 'citizen'],
    },
    {
      id: 'user_management',
      label: 'User Management',
      shortLabel: 'Users',
      icon: UserCheck,
      rolesAllowed: ['super_admin', 'national_admin'],
    },
    {
      id: 'administrator_management',
      label: 'Administrator Management',
      shortLabel: 'Admins',
      icon: ShieldAlert,
      rolesAllowed: ['super_admin'],
    },
    {
      id: 'organization_management',
      label: 'Organization Management',
      shortLabel: 'Orgs',
      icon: Building2,
      rolesAllowed: ['super_admin'],
    },
    {
      id: 'audit_logs',
      label: 'Audit Logs',
      shortLabel: 'Audit',
      icon: FileCheck2,
      rolesAllowed: ['super_admin', 'national_admin'],
    },
    {
      id: 'system_settings',
      label: 'System Settings',
      shortLabel: 'Settings',
      icon: Sliders,
      rolesAllowed: ['super_admin', 'national_admin'],
    },
  ];

  // Filter based on roles
  const visibleMenuItems = menuItems.filter((item) =>
    item.rolesAllowed.includes(currentRoleCategory)
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b111e] border-r border-[#1e293b] text-slate-200 transition-all duration-300 shadow-2xl ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#1e293b] bg-[#070b14]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts EOC"
              className="w-9 h-9 rounded-xl object-cover border border-[#d4af37]/80 shadow shrink-0"
            />
            {!sidebarCollapsed && (
              <div className="leading-tight truncate">
                <span className="font-black text-sm tracking-wide text-white block">
                  BELIZE <span className="text-[#f3c853]">EOC</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block truncate">
                  Command Centre
                </span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-[#141d2e] hover:bg-[#1e2c45] text-slate-300 hover:text-white border border-[#2a3b5c] transition"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#d4af37]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#d4af37]" />
            )}
          </button>
        </div>

        {/* Operational EOC Status Indicator Banner */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 bg-[#0d1627] border-b border-[#1e293b] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-slate-300">Operations:</span>
            </div>
            <span className="font-black text-emerald-400 uppercase tracking-wider text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Active EOC
            </span>
          </div>
        )}

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-2.5 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#b8860b] text-slate-950 shadow-lg shadow-black/40 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-[#141e30]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-slate-950' : 'text-[#d4af37] group-hover:scale-110'
                  }`}
                />

                {!sidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!sidebarCollapsed && item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${
                      item.badgeColor || 'bg-slate-700 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Badge Dot Indicator */}
                {sidebarCollapsed && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-black animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Role & System Identity Footer */}
        <div className="p-2.5 border-t border-[#1e293b] bg-[#070b14]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1b263b] to-[#0d1b2a] border border-[#d4af37]/60 text-white flex items-center justify-center font-black text-xs shrink-0 shadow">
              {profile?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {profile?.displayName || user?.email || 'Belize EOC Operator'}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-[#f3c853] border border-amber-500/30 truncate">
                    {isSuperAdmin ? 'SUPER ADMIN' : profile?.adminRole || profile?.role || 'Citizen'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
