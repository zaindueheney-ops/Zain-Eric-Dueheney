import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import {
  EmergencyIncident,
  IncidentLog,
  EmergencyStatus,
  EmergencySeverity,
  EmergencyCategory,
  BelizeDistrict
} from '../types';
import { useAuth, isAuthorizedAdminEmail } from './AuthContext';
import { INITIAL_BELIZE_INCIDENTS } from '../data/seedData';
import { triggerAdminPushNotification } from '../services/notificationService';
import { sendAdminEmergencyEmail, DEFAULT_ADMIN_EMAIL } from '../services/emailService';

interface IncidentFilter {
  district: BelizeDistrict | 'all';
  category: EmergencyCategory | 'all';
  severity: EmergencySeverity | 'all';
  status: 'all' | 'active' | 'resolved';
  search: string;
}

interface IncidentContextType {
  incidents: EmergencyIncident[];
  loading: boolean;
  selectedIncident: EmergencyIncident | null;
  setSelectedIncident: (inc: EmergencyIncident | null) => void;
  filters: IncidentFilter;
  setFilters: React.Dispatch<React.SetStateAction<IncidentFilter>>;
  reportIncident: (incidentData: {
    title: string;
    category: EmergencyCategory;
    severity: EmergencySeverity;
    description: string;
    district: BelizeDistrict;
    locationName: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
  }) => Promise<string>;
  updateIncidentStatus: (
    incidentId: string,
    newStatus: EmergencyStatus,
    notes?: string,
    assignedUnit?: string
  ) => Promise<void>;
  fetchIncidentLogs: (incidentId: string) => Promise<IncidentLog[]>;
  pendingIncidents: EmergencyIncident[];
  myPendingIncidents: EmergencyIncident[];
  approvedIncidents: EmergencyIncident[];
  approveIncident: (incidentId: string) => Promise<void>;
  rejectIncident: (incidentId: string, reason?: string) => Promise<void>;
  deleteIncident: (incidentId: string) => Promise<void>;
  filteredIncidents: EmergencyIncident[];
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isResponder } = useAuth();
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);

  const [filters, setFilters] = useState<IncidentFilter>({
    district: 'all',
    category: 'all',
    severity: 'all',
    status: 'all',
    search: '',
  });

  // Listen to emergencies collection
  useEffect(() => {
    // When unauthenticated, no notional/mock emergencies are displayed
    if (!user) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    const path = 'emergencies';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: EmergencyIncident[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as EmergencyIncident;
            // Exclude any legacy mock/seed items so only genuine emergencies appear
            if (
              d.id.startsWith('seed_') ||
              d.id.startsWith('belize_inc_') ||
              data.reporterId?.startsWith('system_seed_')
            ) {
              return;
            }
            list.push({ ...data, id: d.id });
          });
          // Do not auto-seed notional incidents; keep real reports only
          setIncidents(list);
          setLoading(false);
        },
        (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn('Emergencies onSnapshot status:', msg);
          if (
            !msg.includes('offline') &&
            !msg.includes('auth token') &&
            !msg.includes('token-service') &&
            !msg.includes('securetoken.googleapis.com')
          ) {
            try {
              handleFirestoreError(error, OperationType.GET, path);
            } catch (e) {
              console.warn('Firestore subscription status notice:', e);
            }
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to attach emergencies listener:', err);
      setLoading(false);
    }
  }, [user]);

  // Deprecated dummy method retained for interface stability with zero seeding
  const seedDemoIncidents = async () => {};

  const reportIncident = async (incidentData: {
    title: string;
    category: EmergencyCategory;
    severity: EmergencySeverity;
    description: string;
    district: BelizeDistrict;
    locationName: string;
    latitude: number;
    longitude: number;
    imageUrl?: string;
  }): Promise<string> => {
    if (!user) {
      throw new Error('You must be signed in to report an emergency incident.');
    }

    const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const payload: EmergencyIncident = {
      id: incidentId,
      title: incidentData.title.trim(),
      category: incidentData.category,
      severity: incidentData.severity,
      status: 'reported',
      description: incidentData.description.trim(),
      district: incidentData.district,
      locationName: incidentData.locationName.trim(),
      latitude: Number(incidentData.latitude.toFixed(6)),
      longitude: Number(incidentData.longitude.toFixed(6)),
      reporterId: user.uid,
      reporterName: profile?.displayName || user.displayName || 'Citizen Reporter',
      reporterPhone: profile?.phone || '',
      createdAt: now,
      updatedAt: now,
    };

    if (incidentData.imageUrl) {
      payload.imageUrl = incidentData.imageUrl;
    }

    const path = `emergencies/${incidentId}`;
    try {
      await setDoc(doc(db, 'emergencies', incidentId), payload);

      // Create initial log in subcollection
      const logPath = `emergencies/${incidentId}/logs`;
      await addDoc(collection(db, logPath), {
        emergencyId: incidentId,
        authorId: user.uid,
        authorName: payload.reporterName,
        authorRole: profile?.role || 'citizen',
        previousStatus: 'none',
        newStatus: 'reported',
        note: 'Incident reported via Belize Alerts. Declared and verified as an ACTUAL EMERGENCY under penalty of Belize law.',
        createdAt: now,
      });

      // Real-time Push Notification to Administrator with Audio Chime
      try {
        triggerAdminPushNotification({
          id: incidentId,
          title: payload.title,
          category: payload.category,
          severity: payload.severity,
          district: payload.district,
          locationName: payload.locationName,
          hasPicture: Boolean(payload.imageUrl),
        });
      } catch (pushErr) {
        console.warn('Push alert trigger encountered:', pushErr);
      }

      // Real-time Email Dispatch to zaindueheney@gmail.com
      try {
        sendAdminEmergencyEmail({
          id: incidentId,
          title: payload.title,
          category: payload.category,
          severity: payload.severity,
          district: payload.district,
          locationName: payload.locationName,
          latitude: payload.latitude,
          longitude: payload.longitude,
          description: payload.description,
          reporterName: payload.reporterName,
          reporterPhone: payload.reporterPhone,
          imageUrl: payload.imageUrl,
          adminEmail: DEFAULT_ADMIN_EMAIL,
        }).catch((emailErr) => console.warn('Background email dispatch error:', emailErr));
      } catch (err) {
        console.warn('Email dispatch attempt logged:', err);
      }

      return incidentId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateIncidentStatus = async (
    incidentId: string,
    newStatus: EmergencyStatus,
    notes?: string,
    assignedUnit?: string
  ) => {
    if (!user) throw new Error('Authentication required');

    const path = `emergencies/${incidentId}`;
    const targetIncident = incidents.find((i) => i.id === incidentId);
    const now = new Date().toISOString();

    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: now,
    };

    if (assignedUnit !== undefined && assignedUnit.trim().length > 0) {
      updateData.assignedUnit = assignedUnit.trim();
    }
    if (notes !== undefined && notes.trim().length > 0) {
      updateData.responderNotes = notes.trim();
    }

    try {
      await updateDoc(doc(db, 'emergencies', incidentId), updateData);

      // Add log entry
      const logPath = `emergencies/${incidentId}/logs`;
      await addDoc(collection(db, logPath), {
        emergencyId: incidentId,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Responder Officer',
        authorRole: profile?.role || 'responder',
        previousStatus: targetIncident?.status || 'reported',
        newStatus,
        note: notes?.trim() || `Status updated to ${newStatus.toUpperCase()}${assignedUnit ? ` | Assigned: ${assignedUnit}` : ''}`,
        createdAt: now,
      });

      // Update selected incident state locally if open
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident({
          ...selectedIncident,
          ...updateData,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const fetchIncidentLogs = async (incidentId: string): Promise<IncidentLog[]> => {
    const path = `emergencies/${incidentId}/logs`;
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const logs: IncidentLog[] = [];
      snapshot.forEach((d) => {
        logs.push({ ...d.data(), id: d.id } as IncidentLog);
      });
      return logs;
    } catch (err) {
      console.warn('Could not fetch logs for incident:', incidentId, err);
      return [];
    }
  };

  // Pending incidents awaiting administrator verification
  const pendingIncidents = incidents.filter((i) => i.status === 'reported');

  // Pending incidents specifically submitted by the currently logged-in user
  const myPendingIncidents = user
    ? incidents.filter((i) => i.status === 'reported' && i.reporterId === user.uid)
    : [];

  // Approved incidents verified by administrator (broadcasted to public map & feed)
  const approvedIncidents = incidents.filter((i) => i.status !== 'reported');

  // Administrator Action: Approve incident and broadcast live (Zain Dueheney)
  const approveIncident = async (incidentId: string) => {
    const isAuthorized = isAuthorizedAdminEmail(user?.email);
    if (!isAuthorized) {
      throw new Error('Access Denied: Only Administrator Zain Dueheney is authorized to approve new incident requests.');
    }
    await updateIncidentStatus(
      incidentId,
      'dispatched',
      'Approved by Administrator Zain Dueheney after format & picture verification. Broadcasted live to Belize emergency network.',
      'Belize Central Dispatch'
    );
  };

  // Administrator Action: Reject incident as false alarm / format invalid (Zain Dueheney)
  const rejectIncident = async (incidentId: string, reason?: string) => {
    const isAuthorized = isAuthorizedAdminEmail(user?.email);
    if (!isAuthorized) {
      throw new Error('Access Denied: Only Administrator Zain Dueheney is authorized to reject new incident requests.');
    }
    await updateIncidentStatus(
      incidentId,
      'false_alarm',
      reason || 'Rejected by Administrator: Picture or format does not meet genuine Belize emergency standards.'
    );
  };

  // Administrator Action: Remove / Delete an incident permanently (Zain Dueheney)
  const deleteIncident = async (incidentId: string) => {
    const isAuthorized = isAuthorizedAdminEmail(user?.email);
    if (!isAuthorized) {
      throw new Error('Access Denied: Only Administrator Zain Dueheney is authorized to remove emergency incidents.');
    }
    const path = `emergencies/${incidentId}`;
    try {
      await deleteDoc(doc(db, 'emergencies', incidentId));
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Filter approved incidents based on active search & dropdowns (strictly approved only on public map & feed)
  const filteredIncidents = approvedIncidents.filter((item) => {
    if (filters.district !== 'all' && item.district !== filters.district) {
      return false;
    }
    if (filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    if (filters.severity !== 'all' && item.severity !== filters.severity) {
      return false;
    }
    if (filters.status === 'active') {
      if (item.status === 'resolved' || item.status === 'false_alarm') return false;
    } else if (filters.status === 'resolved') {
      if (item.status !== 'resolved' && item.status !== 'false_alarm') return false;
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(term);
      const matchLoc = item.locationName.toLowerCase().includes(term);
      const matchDesc = item.description.toLowerCase().includes(term);
      const matchUnit = item.assignedUnit?.toLowerCase().includes(term) ?? false;
      if (!matchTitle && !matchLoc && !matchDesc && !matchUnit) return false;
    }
    return true;
  });

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        loading,
        selectedIncident,
        setSelectedIncident,
        filters,
        setFilters,
        reportIncident,
        updateIncidentStatus,
        fetchIncidentLogs,
        pendingIncidents,
        myPendingIncidents,
        approvedIncidents,
        approveIncident,
        rejectIncident,
        deleteIncident,
        filteredIncidents,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
}
