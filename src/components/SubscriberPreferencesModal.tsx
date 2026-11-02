import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  X,
  MapPin,
  Shield,
  Layers,
  AlertTriangle,
  Lock,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';
import {
  SubscriberPreferences,
  NotificationCategory,
  BelizeDistrict
} from '../types';
import {
  fetchUserSubscriberPreferences,
  saveUserSubscriberPreferences,
  requestWebPushPermission
} from '../services/centralNotificationService';

const ALL_CATEGORIES: NotificationCategory[] = [
  'Flood Warning',
  'Tropical Storm and Hurricane',
  'Fire Emergency',
  'Road Closure',
  'Public Safety Advisory',
  'Community Notice',
  'School Safety Alert',
  'General Announcement'
];

interface SubscriberPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriberPreferencesModal: React.FC<SubscriberPreferencesModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [prefs, setPrefs] = useState<SubscriberPreferences | null>(null);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    fetchUserSubscriberPreferences(user.uid, user.email || '')
      .then((data) => {
        setPrefs(data);
        setLoading(false);
      })
      .catch((e) => {
        console.warn('Failed to load user preferences:', e);
        setLoading(false);
      });
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleToggleCategory = (cat: NotificationCategory) => {
    if (!prefs) return;
    const exists = prefs.subscribedCategories.includes(cat);
    const updated = exists
      ? prefs.subscribedCategories.filter((c) => c !== cat)
      : [...prefs.subscribedCategories, cat];
    setPrefs({ ...prefs, subscribedCategories: updated });
  };

  const handleRequestPush = async () => {
    const granted = await requestWebPushPermission();
    setPushPermissionStatus(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    if (prefs) {
      setPrefs({ ...prefs, pushEnabled: granted });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefs) return;
    setSaving(true);
    try {
      await saveUserSubscriberPreferences(prefs);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Save preferences notice:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0c1424] border-2 border-[#1e2e4a] rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e2e4a] flex items-center justify-between bg-[#080e1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-[#f3c853] border border-amber-500/40 flex items-center justify-center shadow">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Emergency Alert Preferences
              </h3>
              <p className="text-[11px] text-slate-400">
                Manage your notification channels, district jurisdiction, and hazard categories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#152033] text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading || !prefs ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading your notification subscriptions...
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
            {savedSuccess && (
              <div className="bg-emerald-600 text-white p-3 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Preferences saved successfully! Your alert profile is updated.</span>
              </div>
            )}

            {/* Delivery Channels Opt-In */}
            <div className="space-y-2">
              <label className="text-white font-bold block text-xs uppercase tracking-wide">
                1. Delivery Channels Consent
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Push Notifications */}
                <div
                  className={`p-3 rounded-2xl border transition ${
                    prefs.pushEnabled
                      ? 'bg-amber-950/40 border-amber-500/60'
                      : 'bg-[#070c17] border-[#182338]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#f3c853]" />
                      <span>Web Push</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs.pushEnabled}
                      onChange={(e) => {
                        const next = e.target.checked;
                        if (next && pushPermissionStatus !== 'granted') {
                          handleRequestPush();
                        } else {
                          setPrefs({ ...prefs, pushEnabled: next });
                        }
                      }}
                      className="w-4 h-4 rounded text-[#d4af37] focus:ring-0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Browser & PWA lockscreen alerts with sound.
                  </p>
                  {pushPermissionStatus !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPush}
                      className="mt-2 text-[10px] text-[#f3c853] underline font-bold"
                    >
                      Grant Permission
                    </button>
                  )}
                </div>

                {/* Email Notifications */}
                <div
                  className={`p-3 rounded-2xl border transition ${
                    prefs.emailEnabled
                      ? 'bg-cyan-950/40 border-cyan-500/60'
                      : 'bg-[#070c17] border-[#182338]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span>Email Alerts</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs.emailEnabled}
                      onChange={(e) => setPrefs({ ...prefs, emailEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Official bulletins to {user?.email || 'your email'}.
                  </p>
                </div>

                {/* SMS Notifications */}
                <div
                  className={`p-3 rounded-2xl border transition ${
                    prefs.smsEnabled
                      ? 'bg-emerald-950/40 border-emerald-500/60'
                      : 'bg-[#070c17] border-[#182338]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>SMS (Prep)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs.smsEnabled}
                      onChange={(e) => setPrefs({ ...prefs, smsEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Direct cellular carrier dispatch integration.
                  </p>
                </div>
              </div>
            </div>

            {/* Geographic District Scope */}
            <div className="space-y-1.5">
              <label className="text-white font-bold block text-xs uppercase tracking-wide">
                2. Geographic District Scope
              </label>
              <select
                value={prefs.district}
                onChange={(e) => setPrefs({ ...prefs, district: e.target.value as any })}
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#d4af37]"
              >
                <option value="all">National (All Six Belize Districts)</option>
                {BELIZE_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} District
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                You will only receive local alerts designated for this district, plus nationwide critical warnings.
              </p>
            </div>

            {/* Subscribed Hazard Categories */}
            <div className="space-y-2">
              <label className="text-white font-bold block text-xs uppercase tracking-wide">
                3. Subscribed Hazard Categories
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const isChecked = prefs.subscribedCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                        isChecked
                          ? 'bg-[#142036] border-[#d4af37]/60 text-white'
                          : 'bg-[#070c17] border-[#182338] text-slate-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCategory(cat)}
                        className="w-4 h-4 rounded text-[#d4af37] focus:ring-0"
                      />
                      <span className="font-semibold text-[11px]">{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Consent Policy & Privacy */}
            <div className="p-3 rounded-2xl bg-[#080e1a] border border-[#182338] text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Belize Disaster Risk Reduction Communication Policy</span>
              </div>
              <p>
                Consent recorded under Sendai Framework DRR principles. You may adjust or revoke subscriptions at any time. Critical life-safety public declarations issued by NEMO override non-essential opt-outs.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#1e2e4a] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#141e30] hover:bg-[#1e2a42] text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#b8860b] hover:from-[#f3c853] hover:to-[#d4af37] text-slate-950 font-black text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving Preferences...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
