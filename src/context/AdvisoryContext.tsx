import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { OfficialAdvisory, AdvisoryUrgency, BelizeDistrict } from '../types';
import { useAuth } from './AuthContext';
import { logAuditEvent } from '../services/auditService';

interface AdvisoryContextType {
  advisories: OfficialAdvisory[];
  loading: boolean;
  addAdvisory: (advisory: {
    title: string;
    urgencyLevel: AdvisoryUrgency;
    district: BelizeDistrict | 'all';
    affectedCommunities?: string[];
    summary: string;
    safetyInstructions?: string;
    issuingAuthority?: string;
    expiresAt?: string;
    publicationUrl?: string;
    fileUrl?: string;
    fileType?: 'image' | 'pdf';
    fileName?: string;
    channels?: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
      community: boolean;
      schools: boolean;
    };
  }) => Promise<string>;
  updateAdvisory: (
    id: string,
    updates: {
      title?: string;
      urgencyLevel?: AdvisoryUrgency;
      district?: BelizeDistrict | 'all';
      affectedCommunities?: string[];
      summary?: string;
      safetyInstructions?: string;
      issuingAuthority?: string;
      expiresAt?: string;
      publicationUrl?: string;
      fileUrl?: string | null;
      fileType?: 'image' | 'pdf' | null;
      fileName?: string | null;
      channels?: {
        inApp: boolean;
        email: boolean;
        sms: boolean;
        push: boolean;
        community: boolean;
        schools: boolean;
      };
      active?: boolean;
    }
  ) => Promise<OfficialAdvisory>;
  deleteAdvisory: (id: string) => Promise<void>;
}

const LOCAL_STORAGE_ADVISORIES_KEY = 'belize_alerts_official_advisories';

const DEFAULT_SAMPLE_ADVISORY: OfficialAdvisory = {
  id: 'official_belize_advisory_initial',
  title: 'National Meteorological Service of Belize: General Weather Forecast & Outlook',
  urgencyLevel: 'advisory',
  district: 'all',
  summary:
    'A gentle and relatively moist airflow prevails across Belize. Sunny with cloudy spells today and cloudy at times tonight. A few showers and isolated thunderstorms mainly coastal and offshore this morning, central and southern inland this afternoon. Outlook: Cloudy spells with a few morning showers decreasing by afternoon. Official Source: National Meteorological Service of Belize (https://nms.gov.bz/).',
  safetyInstructions:
    'Small crafts should exercise caution in offshore waters. Motorists are advised to maintain safe following distance on slick highways.',
  issuingAuthority: 'National Meteorological Service of Belize (NMS) • Chief Meteorologist Ronald Gordon',
  publicationUrl: 'https://nms.gov.bz/',
  publishedBy: 'Mr. Ronald Gordon, Chief Meteorologist (NMS • https://nms.gov.bz/)',
  publisherEmail: 'chief@nms.gov.bz',
  publishedAt: new Date().toISOString(),
  active: true,
  channels: {
    inApp: true,
    email: true,
    sms: false,
    push: true,
    community: true,
    schools: true,
  },
};

export const OFFICIAL_SOE_ADVISORY: OfficialAdvisory = {
  id: 'adv_1793751515155_u8s4i',
  title: 'State of Emergency Proclamation (SOE)',
  urgencyLevel: 'warning',
  district: 'all',
  summary:
    'Official Declaration of a State of Emergency (SOE) proclaimed for Belize to strengthen national security, preserve public order, and ensure citizen safety through coordinated inter-agency emergency operations.',
  safetyInstructions:
    'All citizens are urged to cooperate fully with law enforcement, civil defense personnel, and NEMO authorities. Exercise caution, heed official security directives, and report any emergency incidents promptly.',
  issuingAuthority: 'Government of Belize & National Emergency Operations Centre (NEMO)',
  publicationUrl: 'https://www.facebook.com/photo/?fbid=1541825884638642&set=pcb.1541827211305176',
  fileName: 'SOE Belize.pdf',
  fileType: 'pdf',
  publishedBy: 'Mr. Zain Dueheney (Super Administrator)',
  publisherEmail: 'zaindueheney@gmail.com',
  publishedAt: '2026-11-04T00:18:38.041Z',
  active: true,
  channels: {
    inApp: true,
    email: true,
    sms: false,
    push: true,
    community: true,
    schools: true,
  },
};

const AdvisoryContext = createContext<AdvisoryContextType | undefined>(undefined);

const LOCAL_STORAGE_DELETED_KEY = 'belize_alerts_deleted_advisories';

function getDeletedAdvisoryIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.warn('Failed to parse deleted advisory IDs:', e);
  }
  return new Set();
}

function saveDeletedAdvisoryId(id: string) {
  try {
    const set = getDeletedAdvisoryIds();
    set.add(id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to persist deleted advisory ID:', e);
  }
}

function removeDeletedAdvisoryId(id: string) {
  try {
    const set = getDeletedAdvisoryIds();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (e) {}
}

function getCachedAdvisories(): OfficialAdvisory[] {
  const deletedIds = getDeletedAdvisoryIds();
  const map = new Map<string, OfficialAdvisory>();

  // Baseline system bulletins
  if (!deletedIds.has(OFFICIAL_SOE_ADVISORY.id)) {
    map.set(OFFICIAL_SOE_ADVISORY.id, OFFICIAL_SOE_ADVISORY);
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ADVISORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((a: OfficialAdvisory) => {
          if (a && a.id && !deletedIds.has(a.id)) {
            map.set(a.id, a);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached advisories:', e);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function saveCachedAdvisories(list: OfficialAdvisory[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ADVISORIES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to persist advisories to localStorage:', e);
  }
}

export const AdvisoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [advisories, setAdvisories] = useState<OfficialAdvisory[]>(() => getCachedAdvisories());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attach real-time snapshot listener on the 'advisories' collection
    const path = 'advisories';
    try {
      const q = query(collection(db, path), orderBy('publishedAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const deletedIds = getDeletedAdvisoryIds();
          const remoteList: OfficialAdvisory[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as OfficialAdvisory;
            if (!deletedIds.has(d.id)) {
              remoteList.push({ ...data, id: d.id });
            }
          });

          // MERGE remote list with local cached advisories using Map so no previously posted advisory is dropped
          const mergedMap = new Map<string, OfficialAdvisory>();
          const currentCache = getCachedAdvisories();
          currentCache.forEach((adv) => {
            if (!deletedIds.has(adv.id)) {
              mergedMap.set(adv.id, adv);
            }
          });
          remoteList.forEach((adv) => {
            if (!deletedIds.has(adv.id)) {
              mergedMap.set(adv.id, adv);
            }
          });

          if (!deletedIds.has(DEFAULT_SAMPLE_ADVISORY.id) && mergedMap.size === 0) {
            mergedMap.set(DEFAULT_SAMPLE_ADVISORY.id, DEFAULT_SAMPLE_ADVISORY);
          }

          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          );

          setAdvisories(merged);
          saveCachedAdvisories(merged);
          setLoading(false);
        },
        (error) => {
          console.warn('Advisories listener fallback to cache:', error);
          const cached = getCachedAdvisories();
          setAdvisories(cached);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to attach advisories listener:', err);
      const cached = getCachedAdvisories();
      setAdvisories(cached);
      setLoading(false);
    }
  }, []);

  const addAdvisory = async (advisoryData: {
    title: string;
    urgencyLevel: AdvisoryUrgency;
    district: BelizeDistrict | 'all';
    affectedCommunities?: string[];
    summary: string;
    safetyInstructions?: string;
    issuingAuthority?: string;
    expiresAt?: string;
    publicationUrl?: string;
    fileUrl?: string;
    fileType?: 'image' | 'pdf';
    fileName?: string;
    channels?: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
      community: boolean;
      schools: boolean;
    };
  }): Promise<string> => {
    const id = `adv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const publisherName =
      profile?.displayName || user?.displayName || user?.email || 'Zain Dueheney (Administrator)';
    const publisherEmail = user?.email || 'zaindueheney@gmail.com';

    // Construct clean advisory document without undefined keys
    const newDoc: OfficialAdvisory = {
      id,
      title: advisoryData.title.trim(),
      urgencyLevel: advisoryData.urgencyLevel,
      district: advisoryData.district,
      summary: advisoryData.summary.trim(),
      publishedBy: publisherName,
      publisherEmail: publisherEmail,
      publishedAt: new Date().toISOString(),
      active: true,
    };

    if (advisoryData.affectedCommunities && advisoryData.affectedCommunities.length > 0) {
      newDoc.affectedCommunities = advisoryData.affectedCommunities;
    }
    if (advisoryData.safetyInstructions && advisoryData.safetyInstructions.trim()) {
      newDoc.safetyInstructions = advisoryData.safetyInstructions.trim();
    }
    if (advisoryData.issuingAuthority && advisoryData.issuingAuthority.trim()) {
      newDoc.issuingAuthority = advisoryData.issuingAuthority.trim();
    } else {
      newDoc.issuingAuthority = 'Belize Emergency Operations Centre (EOC)';
    }
    if (advisoryData.expiresAt) {
      newDoc.expiresAt = advisoryData.expiresAt;
    }
    if (advisoryData.publicationUrl && advisoryData.publicationUrl.trim()) {
      newDoc.publicationUrl = advisoryData.publicationUrl.trim();
    }
    if (advisoryData.fileUrl) {
      newDoc.fileUrl = advisoryData.fileUrl;
      newDoc.fileType = advisoryData.fileType || 'pdf';
      newDoc.fileName = advisoryData.fileName || 'Official_Advisory_Bulletin.pdf';
    }
    if (advisoryData.channels) {
      newDoc.channels = advisoryData.channels;
    }

    // 1. Immediately persist to state & localStorage so it NEVER disappears
    removeDeletedAdvisoryId(id);
    setAdvisories((prev) => {
      const updated = [newDoc, ...prev.filter((a) => a.id !== id)];
      saveCachedAdvisories(updated);
      return updated;
    });

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'advisories', id), newDoc);
    } catch (err: any) {
      console.warn('Firestore write notice (cached locally):', err);
    }

    // 3. Audit Log
    try {
      await logAuditEvent({
        action: `Issued Public Emergency Advisory: ${newDoc.title}`,
        actionCategory: 'alert',
        actorId: user?.uid || 'sys_admin',
        actorName: publisherName,
        actorEmail: publisherEmail,
        actorRole: profile?.adminRole || profile?.role || 'admin',
        targetId: id,
        targetType: 'advisory',
        details: `Level: ${newDoc.urgencyLevel} • District: ${newDoc.district} • Attachment: ${newDoc.fileName || 'None'} • Link: ${newDoc.publicationUrl || 'None'}`,
        district: newDoc.district === 'all' ? 'National' : newDoc.district,
      });
    } catch (e) {
      console.warn('Audit log notice:', e);
    }

    return id;
  };

  const updateAdvisory = async (
    id: string,
    updates: {
      title?: string;
      urgencyLevel?: AdvisoryUrgency;
      district?: BelizeDistrict | 'all';
      affectedCommunities?: string[];
      summary?: string;
      safetyInstructions?: string;
      issuingAuthority?: string;
      expiresAt?: string;
      publicationUrl?: string;
      fileUrl?: string | null;
      fileType?: 'image' | 'pdf' | null;
      fileName?: string | null;
      channels?: {
        inApp: boolean;
        email: boolean;
        sms: boolean;
        push: boolean;
        community: boolean;
        schools: boolean;
      };
      active?: boolean;
    }
  ): Promise<OfficialAdvisory> => {
    const existing =
      advisories.find((a) => a.id === id) ||
      getCachedAdvisories().find((a) => a.id === id);

    if (!existing) {
      throw new Error(`Advisory with id ${id} not found.`);
    }

    const editorName =
      profile?.displayName || user?.displayName || user?.email || 'Zain Dueheney (Administrator)';
    const editorEmail = user?.email || 'zaindueheney@gmail.com';
    const nowIso = new Date().toISOString();

    const merged: OfficialAdvisory = {
      ...existing,
      updatedAt: nowIso,
      updatedBy: editorName,
      updatedByEmail: editorEmail,
    };

    if (updates.title !== undefined) merged.title = updates.title.trim();
    if (updates.urgencyLevel !== undefined) merged.urgencyLevel = updates.urgencyLevel;
    if (updates.district !== undefined) merged.district = updates.district;
    if (updates.summary !== undefined) merged.summary = updates.summary.trim();

    if (updates.safetyInstructions !== undefined) {
      if (updates.safetyInstructions && updates.safetyInstructions.trim()) {
        merged.safetyInstructions = updates.safetyInstructions.trim();
      } else {
        delete (merged as any).safetyInstructions;
      }
    }

    if (updates.issuingAuthority !== undefined) {
      merged.issuingAuthority =
        updates.issuingAuthority.trim() || 'Belize Emergency Operations Centre (EOC)';
    }

    if (updates.affectedCommunities !== undefined) {
      if (updates.affectedCommunities && updates.affectedCommunities.length > 0) {
        merged.affectedCommunities = updates.affectedCommunities;
      } else {
        delete (merged as any).affectedCommunities;
      }
    }

    if (updates.expiresAt !== undefined) {
      if (updates.expiresAt) {
        merged.expiresAt = updates.expiresAt;
      } else {
        delete (merged as any).expiresAt;
      }
    }

    if (updates.publicationUrl !== undefined) {
      if (updates.publicationUrl && updates.publicationUrl.trim()) {
        merged.publicationUrl = updates.publicationUrl.trim();
      } else {
        delete (merged as any).publicationUrl;
      }
    }

    // Handle file changes: explicit null means removed, non-null means updated/retained
    if (updates.fileUrl !== undefined) {
      if (updates.fileUrl) {
        merged.fileUrl = updates.fileUrl;
        merged.fileType = updates.fileType || 'pdf';
        merged.fileName = updates.fileName || 'Official_Advisory_Bulletin.pdf';
      } else {
        delete (merged as any).fileUrl;
        delete (merged as any).fileType;
        delete (merged as any).fileName;
      }
    }

    if (updates.channels !== undefined) {
      merged.channels = updates.channels;
    }

    if (updates.active !== undefined) {
      merged.active = updates.active;
    }

    // Strip any lingering undefined values to guarantee clean Firestore payload
    const cleanedDoc: any = {};
    Object.keys(merged).forEach((k) => {
      const val = (merged as any)[k];
      if (val !== undefined) {
        cleanedDoc[k] = val;
      }
    });

    // 1. Immediately record in local state and localStorage cache
    setAdvisories((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      const next =
        idx >= 0
          ? [...prev.slice(0, idx), cleanedDoc, ...prev.slice(idx + 1)]
          : [cleanedDoc, ...prev];
      saveCachedAdvisories(next);
      return next;
    });

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'advisories', id), cleanedDoc);
    } catch (err: any) {
      console.warn('Firestore advisory update notice (cached locally):', err);
    }

    // 3. Log Audit Trail
    try {
      await logAuditEvent({
        action: `Updated Emergency Advisory / Notification: ${cleanedDoc.title}`,
        actionCategory: 'alert',
        actorId: user?.uid || 'sys_admin',
        actorName: editorName,
        actorEmail: editorEmail,
        actorRole: profile?.adminRole || profile?.role || 'admin',
        targetId: id,
        targetType: 'advisory',
        details: `Level: ${cleanedDoc.urgencyLevel} • District: ${cleanedDoc.district} • Modified by ${editorName}`,
        district: cleanedDoc.district === 'all' ? 'National' : cleanedDoc.district,
      });
    } catch (e) {
      console.warn('Audit log notice:', e);
    }

    return cleanedDoc as OfficialAdvisory;
  };

  const deleteAdvisory = async (id: string): Promise<void> => {
    // 1. Immediately record deletion and update local state and cache
    saveDeletedAdvisoryId(id);
    setAdvisories((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveCachedAdvisories(updated);
      return updated;
    });

    // 2. Remove from Firestore
    try {
      await deleteDoc(doc(db, 'advisories', id));
    } catch (err) {
      console.warn('Failed to delete advisory from Firestore (removed locally):', err);
    }

    if (user) {
      try {
        await logAuditEvent({
          action: `Deleted Emergency Advisory (${id})`,
          actionCategory: 'alert',
          actorId: user.uid,
          actorName: profile?.displayName || user.email || 'Admin',
          actorEmail: user.email || '',
          actorRole: profile?.adminRole || profile?.role || 'admin',
          targetId: id,
          targetType: 'advisory',
          details: 'Advisory removed from active circulation',
        });
      } catch {}
    }
  };

  return (
    <AdvisoryContext.Provider
      value={{
        advisories,
        loading,
        addAdvisory,
        updateAdvisory,
        deleteAdvisory,
      }}
    >
      {children}
    </AdvisoryContext.Provider>
  );
};

export const useAdvisories = () => {
  const context = useContext(AdvisoryContext);
  if (!context) {
    throw new Error('useAdvisories must be used within an AdvisoryProvider');
  }
  return context;
};
