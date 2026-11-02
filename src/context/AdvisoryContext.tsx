import React, { createContext, useContext, useEffect, useState } from 'react';
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
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { OfficialAdvisory, AdvisoryUrgency, BelizeDistrict } from '../types';
import { useAuth } from './AuthContext';

interface AdvisoryContextType {
  advisories: OfficialAdvisory[];
  loading: boolean;
  addAdvisory: (advisory: {
    title: string;
    urgencyLevel: AdvisoryUrgency;
    district: BelizeDistrict | 'all';
    summary: string;
    fileUrl?: string;
    fileType?: 'image' | 'pdf';
    fileName?: string;
  }) => Promise<string>;
  deleteAdvisory: (id: string) => Promise<void>;
}

const DEFAULT_SAMPLE_ADVISORY: OfficialAdvisory = {
  id: 'official_belize_advisory_initial',
  title: 'National Meteorological Service of Belize: General Weather Forecast & Outlook',
  urgencyLevel: 'advisory',
  district: 'all',
  summary: 'A gentle and relatively moist airflow prevails across Belize. Sunny with cloudy spells today and cloudy at times tonight. A few showers and isolated thunderstorms mainly coastal and offshore this morning, central and southern inland this afternoon. Outlook: Cloudy spells with a few morning showers decreasing by afternoon. Official Source: National Meteorological Service of Belize (https://nms.gov.bz/).',
  publishedBy: 'Mr. Ronald Gordon, Chief Meteorologist (NMS • https://nms.gov.bz/)',
  publisherEmail: 'chief@nms.gov.bz',
  publishedAt: new Date().toISOString(),
  active: true,
};

const AdvisoryContext = createContext<AdvisoryContextType | undefined>(undefined);

export const AdvisoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [advisories, setAdvisories] = useState<OfficialAdvisory[]>([DEFAULT_SAMPLE_ADVISORY]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAdvisories([DEFAULT_SAMPLE_ADVISORY]);
      setLoading(false);
      return;
    }

    const path = 'advisories';
    try {
      const q = query(collection(db, path), orderBy('publishedAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: OfficialAdvisory[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as OfficialAdvisory;
            list.push({ ...data, id: d.id });
          });
          if (list.length > 0) {
            setAdvisories(list);
          } else {
            setAdvisories([DEFAULT_SAMPLE_ADVISORY]);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Advisories listener fallback:', error);
          setAdvisories([DEFAULT_SAMPLE_ADVISORY]);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to attach advisories listener:', err);
      setAdvisories([DEFAULT_SAMPLE_ADVISORY]);
      setLoading(false);
    }
  }, [user]);

  const addAdvisory = async (advisoryData: {
    title: string;
    urgencyLevel: AdvisoryUrgency;
    district: BelizeDistrict | 'all';
    summary: string;
    fileUrl?: string;
    fileType?: 'image' | 'pdf';
    fileName?: string;
  }): Promise<string> => {
    const id = `adv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDoc: OfficialAdvisory = {
      id,
      title: advisoryData.title,
      urgencyLevel: advisoryData.urgencyLevel,
      district: advisoryData.district,
      summary: advisoryData.summary,
      fileUrl: advisoryData.fileUrl,
      fileType: advisoryData.fileType,
      fileName: advisoryData.fileName,
      publishedBy: user?.displayName || 'Zain Dueheney (Administrator)',
      publisherEmail: user?.email || 'zaindueheney@gmail.com',
      publishedAt: new Date().toISOString(),
      active: true,
    };

    try {
      await setDoc(doc(db, 'advisories', id), newDoc);
    } catch (err) {
      console.warn('Failed to write advisory to Firestore, saving to memory fallback:', err);
      setAdvisories((prev) => [newDoc, ...prev]);
    }
    return id;
  };

  const deleteAdvisory = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'advisories', id));
    } catch (err) {
      console.warn('Failed to delete advisory from Firestore, removing locally:', err);
    }
    setAdvisories((prev) => prev.filter((a) => a.id !== id));
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
