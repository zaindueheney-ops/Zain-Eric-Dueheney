import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import {
  DisabilityRegistration,
  DisabilityType,
  AssistancePriority,
  DisabilityVerificationStatus,
  BelizeDistrict,
} from '../types';
import { logAuditEvent } from '../services/auditService';

export const DISABILITY_TYPE_OPTIONS: {
  id: DisabilityType;
  label: string;
  shortLabel: string;
  pinColor: string;
  badgeBg: string;
  description: string;
}[] = [
  {
    id: 'mobility',
    label: 'Mobility / Wheelchair',
    shortLabel: 'Mobility',
    pinColor: '#0284c7',
    badgeBg: 'bg-sky-950 text-sky-300 border-sky-500/40',
    description: 'Wheelchair user, walker, paralysis, or limited walking mobility',
  },
  {
    id: 'medical_dependent',
    label: 'Medical / Oxygen Dependent',
    shortLabel: 'Medical',
    pinColor: '#dc2626',
    badgeBg: 'bg-red-950 text-red-300 border-red-500/50',
    description: 'Requires home oxygen, dialysis, ventilator, or continuous medical power',
  },
  {
    id: 'visual',
    label: 'Visual Impairment / Blind',
    shortLabel: 'Visual',
    pinColor: '#d97706',
    badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/40',
    description: 'Blind or low vision; requires guided evacuation assistance',
  },
  {
    id: 'hearing',
    label: 'Hearing Impairment / Deaf',
    shortLabel: 'Hearing',
    pinColor: '#7c3aed',
    badgeBg: 'bg-violet-950 text-violet-300 border-violet-500/40',
    description: 'Deaf or hard of hearing; requires visual/SMS/in-person alert',
  },
  {
    id: 'cognitive',
    label: 'Cognitive / Developmental',
    shortLabel: 'Cognitive',
    pinColor: '#9333ea',
    badgeBg: 'bg-purple-950 text-purple-300 border-purple-500/40',
    description: 'Autism, Down syndrome, dementia, or intellectual disability',
  },
  {
    id: 'elderly_frail',
    label: 'Elderly / Bedridden',
    shortLabel: 'Elderly',
    pinColor: '#ea580c',
    badgeBg: 'bg-orange-950 text-orange-300 border-orange-500/40',
    description: 'Bedridden or frail senior citizen needing physical extraction',
  },
  {
    id: 'speech',
    label: 'Speech / Non-Verbal',
    shortLabel: 'Speech',
    pinColor: '#0d9488',
    badgeBg: 'bg-teal-950 text-teal-300 border-teal-500/40',
    description: 'Non-verbal or speech impairment requiring specialized communication',
  },
  {
    id: 'multiple',
    label: 'Multiple Disabilities',
    shortLabel: 'Multiple',
    pinColor: '#be123c',
    badgeBg: 'bg-rose-950 text-rose-300 border-rose-500/50',
    description: 'Combination of mobility, sensory, cognitive, or medical needs',
  },
  {
    id: 'other',
    label: 'Other Disability / Need',
    shortLabel: 'Other',
    pinColor: '#475569',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
    description: 'Other documented disability or vulnerability support requirement',
  },
];

export const ASSISTANCE_PRIORITY_OPTIONS: {
  id: AssistancePriority;
  label: string;
  desc: string;
  badgeClass: string;
}[] = [
  {
    id: 'critical_life_support',
    label: 'Critical Life Support',
    desc: 'Immediate rescue & medical power/ambulance priority',
    badgeClass: 'bg-red-600 text-white',
  },
  {
    id: 'high_mobility_assist',
    label: 'High Mobility Assist',
    desc: 'Requires wheelchair lift, stretcher, or physical evacuation team',
    badgeClass: 'bg-orange-600 text-white',
  },
  {
    id: 'moderate_support',
    label: 'Moderate Support',
    desc: 'Guided assistance or caregiver check-in during emergencies',
    badgeClass: 'bg-[#d4af37] text-slate-950',
  },
  {
    id: 'standard',
    label: 'Standard Registry',
    desc: 'Registered for priority wellness checks and alerts',
    badgeClass: 'bg-emerald-600 text-white',
  },
];

export interface DisabilityRegistrationInput {
  fullName: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  disabilityType: DisabilityType;
  disabilityDetails: string;
  assistancePriority: AssistancePriority;
  requiresAccessibleTransport: boolean;
  requiresMedicalPower: boolean;
  householdSize?: number;
  district: BelizeDistrict;
  addressDescription: string;
  latitude: number;
  longitude: number;
  houseImageUrl?: string;
}

interface DisabilityContextType {
  registrations: DisabilityRegistration[];
  loading: boolean;
  selectedRegistration: DisabilityRegistration | null;
  setSelectedRegistration: (reg: DisabilityRegistration | null) => void;
  addRegistration: (data: DisabilityRegistrationInput) => Promise<string>;
  updateRegistration: (id: string, data: Partial<DisabilityRegistrationInput>) => Promise<void>;
  verifyRegistration: (
    id: string,
    status: DisabilityVerificationStatus,
    adminNotes?: string
  ) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
}

const DisabilityContext = createContext<DisabilityContextType | undefined>(undefined);

export function DisabilityProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, isResponder } = useAuth();
  const [registrations, setRegistrations] = useState<DisabilityRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<DisabilityRegistration | null>(null);

  useEffect(() => {
    if (!user) {
      setRegistrations([]);
      setSelectedRegistration(null);
      setLoading(false);
      return;
    }

    const path = 'disability_registrations';
    setLoading(true);

    try {
      // Admins and Responders view all Belize registrations for map visibility & rescue;
      // Standard citizens query strictly their own records to protect household/medical PII.
      const colRef = collection(db, path);
      const q = isAdmin || isResponder ? query(colRef) : query(colRef, where('userId', '==', user.uid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: DisabilityRegistration[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as DisabilityRegistration;
            list.push({ ...data, id: d.id });
          });

          // Client-side sort by newest first (avoids requiring composite index for where+orderBy)
          list.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          setRegistrations(list);
          setSelectedRegistration((prev) => {
            if (!prev) return null;
            return list.find((r) => r.id === prev.id) || null;
          });
          setLoading(false);
        },
        (error) => {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn('Disability registry listener notice:', msg);
          if (
            !msg.includes('offline') &&
            !msg.includes('auth token') &&
            !msg.includes('token-service') &&
            !msg.includes('securetoken.googleapis.com')
          ) {
            try {
              handleFirestoreError(error, OperationType.LIST, path);
            } catch (e) {
              console.warn('Disability registry error wrapper:', e);
            }
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to disability_registrations:', err);
      setLoading(false);
    }
  }, [user, isAdmin, isResponder]);

  const addRegistration = async (data: DisabilityRegistrationInput): Promise<string> => {
    if (!user) {
      throw new Error('You must be signed in to submit a disability registration.');
    }

    const id = `dis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const payload: DisabilityRegistration = {
      id,
      userId: user.uid,
      fullName: data.fullName.trim().slice(0, 120),
      phone: data.phone.trim().slice(0, 40),
      disabilityType: data.disabilityType,
      disabilityDetails: data.disabilityDetails.trim().slice(0, 1500),
      assistancePriority: data.assistancePriority,
      requiresAccessibleTransport: Boolean(data.requiresAccessibleTransport),
      requiresMedicalPower: Boolean(data.requiresMedicalPower),
      district: data.district,
      addressDescription: data.addressDescription.trim().slice(0, 300),
      latitude: Number(data.latitude.toFixed(6)),
      longitude: Number(data.longitude.toFixed(6)),
      verificationStatus: isAdmin ? 'verified' : 'pending',
      registeredByEmail: (user.email || profile?.email || 'citizen@belizealerts.bz').slice(0, 120),
      createdAt: now,
      updatedAt: now,
    };

    if (data.emergencyContactName?.trim()) {
      payload.emergencyContactName = data.emergencyContactName.trim().slice(0, 120);
    }
    if (data.emergencyContactPhone?.trim()) {
      payload.emergencyContactPhone = data.emergencyContactPhone.trim().slice(0, 40);
    }
    if (typeof data.householdSize === 'number' && data.householdSize >= 1 && data.householdSize <= 50) {
      payload.householdSize = Math.round(data.householdSize);
    }
    if (data.houseImageUrl && data.houseImageUrl.length <= 500000) {
      payload.houseImageUrl = data.houseImageUrl;
    }

    const path = `disability_registrations/${id}`;
    try {
      await setDoc(doc(db, 'disability_registrations', id), payload);
      await logAuditEvent({
        action: `Disability Registration Submitted: ${payload.fullName}`,
        actionCategory: 'admin',
        actorId: user.uid,
        actorName: profile?.displayName || user.displayName || 'Citizen',
        actorEmail: user.email || '',
        actorRole: profile?.role || 'citizen',
        targetId: id,
        targetType: 'disability_registration',
        details: `Registered ${payload.fullName} (${payload.disabilityType}, ${payload.assistancePriority}) in ${payload.district} District at ${payload.latitude}, ${payload.longitude}`,
        district: payload.district,
      });
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateRegistration = async (
    id: string,
    data: Partial<DisabilityRegistrationInput>
  ): Promise<void> => {
    if (!user) throw new Error('Authentication required');

    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      updatedAt: now,
    };

    if (data.fullName !== undefined) updates.fullName = data.fullName.trim().slice(0, 120);
    if (data.phone !== undefined) updates.phone = data.phone.trim().slice(0, 40);
    if (data.emergencyContactName !== undefined) {
      updates.emergencyContactName = data.emergencyContactName.trim().slice(0, 120);
    }
    if (data.emergencyContactPhone !== undefined) {
      updates.emergencyContactPhone = data.emergencyContactPhone.trim().slice(0, 40);
    }
    if (data.disabilityType !== undefined) updates.disabilityType = data.disabilityType;
    if (data.disabilityDetails !== undefined) {
      updates.disabilityDetails = data.disabilityDetails.trim().slice(0, 1500);
    }
    if (data.assistancePriority !== undefined) {
      updates.assistancePriority = data.assistancePriority;
    }
    if (data.requiresAccessibleTransport !== undefined) {
      updates.requiresAccessibleTransport = Boolean(data.requiresAccessibleTransport);
    }
    if (data.requiresMedicalPower !== undefined) {
      updates.requiresMedicalPower = Boolean(data.requiresMedicalPower);
    }
    if (typeof data.householdSize === 'number' && data.householdSize >= 1 && data.householdSize <= 50) {
      updates.householdSize = Math.round(data.householdSize);
    }
    if (data.district !== undefined) updates.district = data.district;
    if (data.addressDescription !== undefined) {
      updates.addressDescription = data.addressDescription.trim().slice(0, 300);
    }
    if (typeof data.latitude === 'number') updates.latitude = Number(data.latitude.toFixed(6));
    if (typeof data.longitude === 'number') updates.longitude = Number(data.longitude.toFixed(6));
    if (data.houseImageUrl !== undefined) {
      if (data.houseImageUrl && data.houseImageUrl.length <= 500000) {
        updates.houseImageUrl = data.houseImageUrl;
      }
    }

    const path = `disability_registrations/${id}`;
    try {
      await updateDoc(doc(db, 'disability_registrations', id), updates);
      await logAuditEvent({
        action: `Disability Registration Updated: ${id}`,
        actionCategory: 'admin',
        actorId: user.uid,
        actorName: profile?.displayName || user.displayName || 'User',
        actorEmail: user.email || '',
        actorRole: profile?.role || 'citizen',
        targetId: id,
        targetType: 'disability_registration',
        details: `Updated registration fields: ${Object.keys(updates).join(', ')}`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const verifyRegistration = async (
    id: string,
    status: DisabilityVerificationStatus,
    adminNotes?: string
  ): Promise<void> => {
    if (!user || !isAdmin) {
      throw new Error('Only administrators can verify disability registrations.');
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      verificationStatus: status,
      updatedAt: now,
    };
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes.trim().slice(0, 1000);
    }

    const path = `disability_registrations/${id}`;
    try {
      await updateDoc(doc(db, 'disability_registrations', id), updates);
      await logAuditEvent({
        action: `Disability Registration Status Set to ${status.toUpperCase()}`,
        actionCategory: 'admin',
        actorId: user.uid,
        actorName: profile?.displayName || user.displayName || 'Administrator',
        actorEmail: user.email || '',
        actorRole: 'admin',
        targetId: id,
        targetType: 'disability_registration',
        details: `Verification status: ${status}. Notes: ${adminNotes?.trim() || 'none'}`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteRegistration = async (id: string): Promise<void> => {
    if (!user) throw new Error('Authentication required');

    const path = `disability_registrations/${id}`;
    try {
      await deleteDoc(doc(db, 'disability_registrations', id));
      if (selectedRegistration?.id === id) {
        setSelectedRegistration(null);
      }
      await logAuditEvent({
        action: `Disability Registration Removed: ${id}`,
        actionCategory: 'admin',
        actorId: user.uid,
        actorName: profile?.displayName || user.displayName || 'User',
        actorEmail: user.email || '',
        actorRole: profile?.role || 'citizen',
        targetId: id,
        targetType: 'disability_registration',
        details: `Removed disability registration record ${id}`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <DisabilityContext.Provider
      value={{
        registrations,
        loading,
        selectedRegistration,
        setSelectedRegistration,
        addRegistration,
        updateRegistration,
        verifyRegistration,
        deleteRegistration,
      }}
    >
      {children}
    </DisabilityContext.Provider>
  );
}

export function useDisabilityRegistry() {
  const context = useContext(DisabilityContext);
  if (!context) {
    throw new Error('useDisabilityRegistry must be used within a DisabilityProvider');
  }
  return context;
}
