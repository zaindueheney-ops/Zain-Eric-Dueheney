import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, isAuthorizedAdminEmail } from './AuthContext';
import {
  CommandViewTab,
  NationalEmergencyStatus,
  EvacuationCentre,
  ResponseTeam,
  SchoolSafetyProfile,
  ParticipatingCommunity,
  RegisteredOrganization,
  AuditLogEntry,
  AdminRole,
  AdminPermissions,
  BelizeDistrict,
  UserProfile,
  EOCAlertPhase
} from '../types';
import {
  INITIAL_NATIONAL_EMERGENCY_STATUS,
  INITIAL_EVACUATION_CENTRES,
  INITIAL_RESPONSE_TEAMS,
  INITIAL_SCHOOL_PROFILES,
  INITIAL_COMMUNITIES,
  INITIAL_ORGANIZATIONS
} from '../data/belizeInfrastructure';
import { logAuditEvent } from '../services/auditService';

interface CommandContextType {
  activeTab: CommandViewTab;
  setActiveTab: (tab: CommandViewTab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  nationalStatus: NationalEmergencyStatus;
  updateNationalStatus: (status: Partial<NationalEmergencyStatus>) => Promise<void>;
  evacuationCentres: EvacuationCentre[];
  updateEvacuationCentre: (centreId: string, updates: Partial<EvacuationCentre>) => Promise<void>;
  responseTeams: ResponseTeam[];
  updateResponseTeam: (teamId: string, updates: Partial<ResponseTeam>) => Promise<void>;
  addResponseTeam: (team: Omit<ResponseTeam, 'id' | 'updatedAt'>) => Promise<string>;
  schools: SchoolSafetyProfile[];
  updateSchoolStatus: (schoolId: string, status: SchoolSafetyProfile['status'], notes?: string) => Promise<void>;
  communities: ParticipatingCommunity[];
  organizations: RegisteredOrganization[];
  addOrganization: (org: Omit<RegisteredOrganization, 'id' | 'registeredAt'>) => Promise<string>;
  auditLogs: AuditLogEntry[];
  appointAdministrator: (
    targetUser: UserProfile,
    role: AdminRole,
    districts: BelizeDistrict[] | 'all',
    permissions: AdminPermissions
  ) => Promise<void>;
  revokeAdministrator: (targetUser: UserProfile) => Promise<void>;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<CommandViewTab>('command_dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. National Emergency Status
  const [nationalStatus, setNationalStatus] = useState<NationalEmergencyStatus>(() => {
    try {
      const cached = localStorage.getItem('belize_alerts_national_status');
      return cached ? JSON.parse(cached) : INITIAL_NATIONAL_EMERGENCY_STATUS;
    } catch {
      return INITIAL_NATIONAL_EMERGENCY_STATUS;
    }
  });

  // 2. Evacuation Centres
  const [evacuationCentres, setEvacuationCentres] = useState<EvacuationCentre[]>(() => {
    try {
      const cached = localStorage.getItem('belize_alerts_evac_centres');
      return cached ? JSON.parse(cached) : INITIAL_EVACUATION_CENTRES;
    } catch {
      return INITIAL_EVACUATION_CENTRES;
    }
  });

  // 3. Response Teams
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>(() => {
    try {
      const cached = localStorage.getItem('belize_alerts_response_teams');
      return cached ? JSON.parse(cached) : INITIAL_RESPONSE_TEAMS;
    } catch {
      return INITIAL_RESPONSE_TEAMS;
    }
  });

  // 4. Schools
  const [schools, setSchools] = useState<SchoolSafetyProfile[]>(() => {
    try {
      const cached = localStorage.getItem('belize_alerts_schools');
      return cached ? JSON.parse(cached) : INITIAL_SCHOOL_PROFILES;
    } catch {
      return INITIAL_SCHOOL_PROFILES;
    }
  });

  // 5. Communities
  const [communities] = useState<ParticipatingCommunity[]>(INITIAL_COMMUNITIES);

  // 6. Organizations
  const [organizations, setOrganizations] = useState<RegisteredOrganization[]>(() => {
    try {
      const cached = localStorage.getItem('belize_alerts_organizations');
      return cached ? JSON.parse(cached) : INITIAL_ORGANIZATIONS;
    } catch {
      return INITIAL_ORGANIZATIONS;
    }
  });

  // 7. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const cached = localStorage.getItem('belize_alerts_audit_log_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Listen to Firestore for system settings / status
  useEffect(() => {
    if (!user) return;
    try {
      const statusDocRef = doc(db, 'system_settings', 'national_status');
      const unsub = onSnapshot(statusDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as NationalEmergencyStatus;
          setNationalStatus(data);
          localStorage.setItem('belize_alerts_national_status', JSON.stringify(data));
        }
      }, (e) => console.warn('System status sync notice:', e));
      return () => unsub();
    } catch (e) {
      console.warn('Status listener attachment notice:', e);
    }
  }, [user]);

  // Listen to Firestore for response_teams updates
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'response_teams'), orderBy('updatedAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: ResponseTeam[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as ResponseTeam));
          setResponseTeams(list);
          localStorage.setItem('belize_alerts_response_teams', JSON.stringify(list));
        }
      }, (e) => console.warn('Response teams listener notice:', e));
      return () => unsub();
    } catch (e) {
      console.warn('Teams listener attachment notice:', e);
    }
  }, [user]);

  // Listen to Firestore for audit_logs updates
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: AuditLogEntry[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as AuditLogEntry));
        if (list.length > 0) {
          setAuditLogs(list);
          localStorage.setItem('belize_alerts_audit_log_cache', JSON.stringify(list.slice(0, 200)));
        }
      }, (e) => console.warn('Audit logs listener notice:', e));
      return () => unsub();
    } catch (e) {
      console.warn('Audit logs listener attachment notice:', e);
    }
  }, [user]);

  // Update National Emergency Status
  const updateNationalStatus = async (status: Partial<NationalEmergencyStatus>) => {
    const updated: NationalEmergencyStatus = {
      ...nationalStatus,
      ...status,
      declaredAt: new Date().toISOString(),
      declaredBy: profile?.displayName || user?.email || 'NEMO National Command',
    };
    setNationalStatus(updated);
    localStorage.setItem('belize_alerts_national_status', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'system_settings', 'national_status'), updated);
      await logAuditEvent({
        action: `National EOC Status updated to ${updated.phaseLabel}`,
        actionCategory: 'system',
        actorId: user?.uid || 'system',
        actorName: profile?.displayName || 'Administrator',
        actorEmail: user?.email || '',
        actorRole: profile?.role || 'admin',
        details: `Phase changed: ${updated.phase}. Summary: ${updated.bulletinSummary}`,
      });
    } catch (e) {
      console.warn('Could not sync status to Firestore:', e);
    }
  };

  // Update Evacuation Centre status/occupancy
  const updateEvacuationCentre = async (centreId: string, updates: Partial<EvacuationCentre>) => {
    const next = evacuationCentres.map((c) => (c.id === centreId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    setEvacuationCentres(next);
    localStorage.setItem('belize_alerts_evac_centres', JSON.stringify(next));

    try {
      await setDoc(doc(db, 'evacuation_centres', centreId), updates, { merge: true });
      await logAuditEvent({
        action: `Evacuation Centre Updated: ${centreId}`,
        actionCategory: 'admin',
        actorId: user?.uid || 'system',
        actorName: profile?.displayName || 'Administrator',
        actorEmail: user?.email || '',
        actorRole: profile?.role || 'admin',
        targetId: centreId,
        targetType: 'evacuation_centre',
        details: `Centre updates: ${JSON.stringify(updates)}`,
      });
    } catch (e) {
      console.warn('Could not write evacuation centre to Firestore:', e);
    }
  };

  // Update Response Team
  const updateResponseTeam = async (teamId: string, updates: Partial<ResponseTeam>) => {
    const now = new Date().toISOString();
    const next = responseTeams.map((t) => (t.id === teamId ? { ...t, ...updates, updatedAt: now } : t));
    setResponseTeams(next);
    localStorage.setItem('belize_alerts_response_teams', JSON.stringify(next));

    try {
      await setDoc(doc(db, 'response_teams', teamId), { ...updates, updatedAt: now }, { merge: true });
      await logAuditEvent({
        action: `Response Team Status Updated: ${teamId}`,
        actionCategory: 'dispatch',
        actorId: user?.uid || 'system',
        actorName: profile?.displayName || 'Dispatcher',
        actorEmail: user?.email || '',
        actorRole: profile?.role || 'dispatcher',
        targetId: teamId,
        targetType: 'response_team',
        details: `Team status changed to: ${updates.status || 'updated'}. Incident: ${updates.activeIncidentTitle || 'none'}`,
      });
    } catch (e) {
      console.warn('Could not write team status to Firestore:', e);
    }
  };

  // Add new response team
  const addResponseTeam = async (team: Omit<ResponseTeam, 'id' | 'updatedAt'>): Promise<string> => {
    const id = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newTeam: ResponseTeam = { ...team, id, updatedAt: now };
    const next = [newTeam, ...responseTeams];
    setResponseTeams(next);
    localStorage.setItem('belize_alerts_response_teams', JSON.stringify(next));

    try {
      await setDoc(doc(db, 'response_teams', id), newTeam);
      await logAuditEvent({
        action: `New Response Team Registered: ${newTeam.name}`,
        actionCategory: 'dispatch',
        actorId: user?.uid || 'system',
        actorName: profile?.displayName || 'Administrator',
        actorEmail: user?.email || '',
        actorRole: profile?.role || 'admin',
        targetId: id,
        targetType: 'response_team',
        details: `Unit registered: ${newTeam.name} (${newTeam.district}). Lead: ${newTeam.leadOfficer}`,
      });
    } catch (e) {
      console.warn('Could not persist response team to Firestore:', e);
    }
    return id;
  };

  // Update School Status
  const updateSchoolStatus = async (schoolId: string, status: SchoolSafetyProfile['status'], notes?: string) => {
    const now = new Date().toISOString();
    const next = schools.map((s) => (s.id === schoolId ? { ...s, status, safetyNotes: notes ?? s.safetyNotes, lastReportedAt: now } : s));
    setSchools(next);
    localStorage.setItem('belize_alerts_schools', JSON.stringify(next));

    try {
      await setDoc(doc(db, 'schools', schoolId), { status, safetyNotes: notes, lastReportedAt: now }, { merge: true });
      await logAuditEvent({
        action: `School Safety Status Updated: ${schoolId}`,
        actionCategory: 'admin',
        actorId: user?.uid || 'system',
        actorName: profile?.displayName || 'Administrator',
        actorEmail: user?.email || '',
        actorRole: profile?.role || 'admin',
        targetId: schoolId,
        targetType: 'school',
        details: `Status set to ${status}. Notes: ${notes || 'none'}`,
      });
    } catch (e) {
      console.warn('Could not persist school status to Firestore:', e);
    }
  };

  // Add Organization
  const addOrganization = async (org: Omit<RegisteredOrganization, 'id' | 'registeredAt'>): Promise<string> => {
    const id = `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newOrg: RegisteredOrganization = { ...org, id, registeredAt: now };
    const next = [newOrg, ...organizations];
    setOrganizations(next);
    localStorage.setItem('belize_alerts_organizations', JSON.stringify(next));

    try {
      await setDoc(doc(db, 'organizations', id), newOrg);
      await logAuditEvent({
        action: `Organization Registered: ${newOrg.name}`,
        actionCategory: 'admin',
        actorId: user?.uid || 'system',
        actorName: profile?.displayName || 'Super Administrator',
        actorEmail: user?.email || '',
        actorRole: profile?.role || 'admin',
        targetId: id,
        targetType: 'organization',
        details: `Registered ${newOrg.name} (${newOrg.code}). Official: ${newOrg.leadOfficial}`,
      });
    } catch (e) {
      console.warn('Could not write organization to Firestore:', e);
    }
    return id;
  };

  // Appoint Administrator Workflow
  const appointAdministrator = async (
    targetUser: UserProfile,
    role: AdminRole,
    districts: BelizeDistrict[] | 'all',
    permissions: AdminPermissions
  ) => {
    if (!targetUser.id) throw new Error('Target user has no valid UID');

    const now = new Date().toISOString();
    const adminUpdates: Partial<UserProfile> = {
      role: 'admin',
      adminRole: role,
      assignedDistricts: districts,
      permissions,
      appointedBy: user?.email || 'zaindueheney@gmail.com',
      appointedAt: now,
      updatedAt: now,
    };

    // 1. Update user profile
    await setDoc(doc(db, 'users', targetUser.id), adminUpdates, { merge: true });

    // 2. Add entry to admins collection for security rules
    await setDoc(doc(db, 'admins', targetUser.id), {
      email: targetUser.email,
      role,
      districts,
      appointedAt: now,
      appointedBy: user?.email || 'zaindueheney@gmail.com',
    });

    // 3. Log Audit Event
    await logAuditEvent({
      action: `Appointed Administrator: ${targetUser.displayName || targetUser.email}`,
      actionCategory: 'admin',
      actorId: user?.uid || 'super_admin',
      actorName: profile?.displayName || 'Zain Dueheney',
      actorEmail: user?.email || 'zaindueheney@gmail.com',
      actorRole: 'super_admin',
      targetId: targetUser.id,
      targetType: 'user_account',
      details: `Appointed role "${role}" with districts "${districts === 'all' ? 'All Nationwide' : districts.join(', ')}". Permissions: ${Object.keys(permissions).filter((k) => (permissions as any)[k]).join(', ')}`,
      district: districts === 'all' ? 'all' : districts[0],
    });
  };

  // Revoke Administrator Workflow
  const revokeAdministrator = async (targetUser: UserProfile) => {
    if (!targetUser.id) return;
    const now = new Date().toISOString();

    await setDoc(doc(db, 'users', targetUser.id), {
      role: 'citizen',
      adminRole: null,
      assignedDistricts: null,
      permissions: null,
      updatedAt: now,
    }, { merge: true });

    try {
      await setDoc(doc(db, 'admins', targetUser.id), { active: false, revokedAt: now }, { merge: true });
    } catch {}

    await logAuditEvent({
      action: `Revoked Administrator Credentials: ${targetUser.displayName || targetUser.email}`,
      actionCategory: 'admin',
      actorId: user?.uid || 'super_admin',
      actorName: profile?.displayName || 'Zain Dueheney',
      actorEmail: user?.email || 'zaindueheney@gmail.com',
      actorRole: 'super_admin',
      targetId: targetUser.id,
      targetType: 'user_account',
      details: `Revoked administrative privileges for ${targetUser.email}. User reverted to citizen role.`,
    });
  };

  return (
    <CommandContext.Provider
      value={{
        activeTab,
        setActiveTab,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        nationalStatus,
        updateNationalStatus,
        evacuationCentres,
        updateEvacuationCentre,
        responseTeams,
        updateResponseTeam,
        addResponseTeam,
        schools,
        updateSchoolStatus,
        communities,
        organizations,
        addOrganization,
        auditLogs,
        appointAdministrator,
        revokeAdministrator,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}

export function useCommand() {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }
  return context;
}
