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
  try {
    const deletedIds = getDeletedAdvisoryIds();
    const raw = localStorage.getItem(LOCAL_STORAGE_ADVISORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((a: OfficialAdvisory) => a && a.id && !deletedIds.has(a.id));
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached advisories:', e);
  }
  const deletedIds = getDeletedAdvisoryIds();
  return deletedIds.has(DEFAULT_SAMPLE_ADVISORY.id) ? [] : [DEFAULT_SAMPLE_ADVISORY];
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
