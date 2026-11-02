import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLogEntry, BelizeDistrict } from '../types';

export const logAuditEvent = async (event: {
  action: string;
  actionCategory: 'auth' | 'incident' | 'alert' | 'dispatch' | 'admin' | 'system';
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  targetId?: string;
  targetType?: string;
  details: string;
  district?: BelizeDistrict | 'National' | 'all';
}): Promise<void> => {
  const timestamp = new Date().toISOString();
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...event,
    timestamp,
  };

  // Local storage emergency backup so audit logs are never lost
  try {
    const existingRaw = localStorage.getItem('belize_alerts_audit_log_cache');
    const existing: AuditLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(entry);
    // Keep max 200 items in cache
    localStorage.setItem('belize_alerts_audit_log_cache', JSON.stringify(existing.slice(0, 200)));
  } catch (e) {
    console.warn('Audit cache write error:', e);
  }

  // Persist to Firestore
  try {
    await addDoc(collection(db, 'audit_logs'), entry);
  } catch (err) {
    console.warn('Could not write audit log entry to Firestore (cached locally):', err);
  }
};
