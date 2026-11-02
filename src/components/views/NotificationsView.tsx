import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Volume2,
  Users,
  Eye,
  Calendar,
  Layers,
  Search,
  Filter,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Flame,
  FileText,
  Sliders,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  CentralNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationDeliveryChannel,
  NotificationStatus,
  NotificationDeliveryReport,
  BelizeDistrict
} from '../../types';
import {
  fetchAllNotifications,
  saveNotificationRecord,
  dispatchNotificationToSubscribers,
  estimateRecipientCount,
  requestWebPushPermission
} from '../../services/centralNotificationService';
import { SubscriberPreferencesModal } from '../SubscriberPreferencesModal';

const CATEGORIES: NotificationCategory[] = [
  'Flood Warning',
  'Tropical Storm and Hurricane',
  'Fire Emergency',
  'Road Closure',
  'Public Safety Advisory',
  'Community Notice',
  'School Safety Alert',
  'General Announcement'
];

const PRIORITIES: NotificationPriority[] = ['Critical', 'High', 'Moderate', 'Informational'];

const DISTRICTS: (BelizeDistrict | 'all')[] = [
  'all',
  'Belize',
  'Cayo',
  'Corozal',
  'Orange Walk',
  'Stann Creek',
  'Toledo'
];

const TARGET_AUDIENCES = [
  'All Citizens & Subscribers',
  'District Residents & Communities',
  'Emergency Responders & District Coordinators',
  'Schools & Educational Institutions',
  'Critical Infrastructure & Utilities',
  'Fisherfolk & Maritime Operators'
];

export const NotificationsView: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'composer' | 'history' | 'analytics' | 'subscribers'>(
    'composer'
  );

  // Notifications List State
  const [notifications, setNotifications] = useState<CentralNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Preference Modal for Citizen / User
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);

  // Composer Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('Flood Warning');
  const [priority, setPriority] = useState<NotificationPriority>('High');
  const [district, setDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [communitiesInput, setCommunitiesInput] = useState('');
  const [targetAudience, setTargetAudience] = useState(TARGET_AUDIENCES[0]);
  const [channels, setChannels] = useState<NotificationDeliveryChannel[]>(['push', 'email']);
  const [publicationDate, setPublicationDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [expirationDate, setExpirationDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Test Mode toggle
  const [isTestMode, setIsTestMode] = useState(false);

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'push' | 'email' | 'sms'>('push');

  // Action status / feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Selected Notification for Delivery Inspection
  const [selectedNotifForInspection, setSelectedNotifForInspection] = useState<CentralNotification | null>(null);

  // Load notifications
  const loadNotifs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllNotifications();
      setNotifications(data);
    } catch (e) {
      console.warn('Error loading notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleChannelToggle = (ch: NotificationDeliveryChannel) => {
    if (channels.includes(ch)) {
      if (channels.length === 1) return; // Keep at least one
      setChannels(channels.filter((c) => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  // Calculate estimated audience
  const estimatedReach = estimateRecipientCount(district, category, 'all');
  const estimatedPush = channels.includes('push') ? estimateRecipientCount(district, category, 'push') : 0;
  const estimatedEmail = channels.includes('email') ? estimateRecipientCount(district, category, 'email') : 0;
  const estimatedSms = channels.includes('sms') ? estimateRecipientCount(district, category, 'sms') : 0;

  // Dispatch Action
  const handleDispatch = async (statusTarget: 'sent' | 'draft' | 'scheduled', forceTest = false) => {
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: 'Notification Title and Message body are required.' });
      return;
    }

    if (!user) {
      setFeedback({ type: 'error', message: 'You must be signed in to dispatch notifications.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const commList = communitiesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const actor = {
      id: user.uid,
      name: profile?.displayName || user.email || 'Admin',
      email: user.email || 'admin@belizealerts.bz',
      role: profile?.adminRole || profile?.role || 'administrator'
    };

    const notifId = `notif_${Date.now()}`;
    const newNotif: CentralNotification = {
      id: notifId,
      title: title.trim(),
      message: message.trim(),
      category,
      priority,
      district,
      communities: commList,
      targetAudience,
      channels,
      publicationDate: new Date(publicationDate).toISOString(),
      expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
      linkUrl: linkUrl.trim() || undefined,
      status: statusTarget,
      isTest: forceTest || isTestMode,
      creatorId: actor.id,
      creatorName: actor.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (statusTarget === 'sent') {
        const report = await dispatchNotificationToSubscribers(newNotif, actor, newNotif.isTest);
        setFeedback({
          type: 'success',
          message: newNotif.isTest
            ? `✓ [TEST] Notification dispatched strictly to your email (${actor.email}) and browser chime.`
            : `✓ Emergency Notification successfully broadcast to ${report.intendedRecipients.toLocaleString()} intended recipients across ${channels.join(', ').toUpperCase()}.`
        });
      } else {
        await saveNotificationRecord(newNotif, actor);
        setFeedback({
          type: 'success',
          message: statusTarget === 'draft'
            ? '✓ Notification saved as draft in Central Registry.'
            : `✓ Notification scheduled for publication on ${new Date(publicationDate).toLocaleString()}.`
        });
      }

      // Reset Form
      if (statusTarget === 'sent') {
        setTitle('');
        setMessage('');
        setCommunitiesInput('');
        setLinkUrl('');
      }

      await loadNotifs();
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Dispatch Error: ${err.message || 'Operation failed'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Notifications for History Tab
  const filteredNotifications = notifications.filter((n) => {
    if (filterCategory !== 'all' && n.category !== filterCategory) return false;
    if (filterDistrict !== 'all' && n.district !== filterDistrict) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      const matchCreator = n.creatorName.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchCreator) return false;
    }
    return true;
  });

  // Calculate Aggregated Delivery Analytics
  const aggregateMetrics = notifications.reduce(
    (acc, notif) => {
      if (notif.deliveryReport) {
        acc.totalIntended += notif.deliveryReport.intendedRecipients || 0;
        acc.pushAttempts += notif.deliveryReport.pushAttempts || 0;
        acc.pushDelivered += notif.deliveryReport.pushDelivered || 0;
        acc.emailAttempts += notif.deliveryReport.emailAttempts || 0;
        acc.emailAccepted += notif.deliveryReport.emailAccepted || 0;
        acc.smsAttempts += notif.deliveryReport.smsAttempts || 0;
        acc.smsAccepted += notif.deliveryReport.smsAccepted || 0;
        acc.failed += notif.deliveryReport.failedCount || 0;
        acc.acknowledged += notif.deliveryReport.acknowledgedCount || 0;
      }
      return acc;
    },
    {
      totalIntended: 0,
      pushAttempts: 0,
      pushDelivered: 0,
      emailAttempts: 0,
      emailAccepted: 0,
      smsAttempts: 0,
      smsAccepted: 0,
      failed: 0,
      acknowledged: 0
    }
  );

  return (
    <div className="space-y-4">
      {/* Top Banner / Header */}
      <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 text-[#d4af37] border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-base sm:text-lg text-white tracking-tight uppercase">
                Notification Management Centre
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#18263f] text-[#f3c853] border border-[#2d446f]">
                Belize Alerts
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                Active Multi-Channel Gateway
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-channel push, verified transactional email, and emergency carrier broadcast dispatcher • Sendai DRR Framework
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPrefModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141e30] hover:bg-[#1d2b45] text-amber-200 border border-[#2b3e61] text-xs font-bold transition shadow"
            title="Manage Subscriber Alert Preferences"
          >
            <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>My Subscriber Preferences</span>
          </button>

          <button
            type="button"
            onClick={loadNotifs}
            className="p-2 rounded-xl bg-[#141e30] hover:bg-[#1d2b45] text-slate-300 hover:text-white border border-[#2b3e61] transition"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#d4af37]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#1c2a42]">
        <button
          type="button"
          onClick={() => setActiveSubTab('composer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
            activeSubTab === 'composer'
              ? 'bg-[#0f172a] text-[#f3c853] border-[#d4af37]'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-[#0c1424]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Notification Composer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
            activeSubTab === 'history'
              ? 'bg-[#0f172a] text-[#f3c853] border-[#d4af37]'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-[#0c1424]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Broadcast History & Logs ({notifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
            activeSubTab === 'analytics'
              ? 'bg-[#0f172a] text-[#f3c853] border-[#d4af37]'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-[#0c1424]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Delivery Analytics & Provider Reporting</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('subscribers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
            activeSubTab === 'subscribers'
              ? 'bg-[#0f172a] text-[#f3c853] border-[#d4af37]'
              : 'text-slate-400 hover:text-white border-transparent hover:bg-[#0c1424]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Subscriber Management</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/50'
              : 'bg-red-950/90 text-red-200 border border-red-500/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* NON-ADMIN RESTRICTION VIEW IF IN COMPOSER */}
      {!isAdmin && activeSubTab === 'composer' && (
        <div className="bg-[#0b1220] p-6 rounded-2xl border border-amber-500/30 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-yellow-400 border border-amber-500/40 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-black text-white">
              Official Warning Broadcast Control Restricted
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with national disaster risk reduction policy, composing and dispatching official civil emergency notifications across Push, Email, and SMS is restricted to authorized EOC and NEMO administrators.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className="px-4 py-2 rounded-xl bg-[#141e30] hover:bg-[#1d2b45] text-amber-200 border border-[#2a3b5c] text-xs font-bold transition"
            >
              View Official Emergency Advisories Feed
            </button>
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-slate-950 text-xs font-black transition shadow"
            >
              Configure My Alert Subscriptions
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: NOTIFICATION COMPOSER (ADMINS ONLY) */}
      {/* ========================================================================= */}
      {isAdmin && activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Composer Form */}
          <div className="lg:col-span-8 bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#18263e]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#d4af37]" />
                <h2 className="text-sm font-black text-white uppercase tracking-wide">
                  Compose Emergency Broadcast
                </h2>
              </div>

              {/* Test Mode Switch */}
              <div className="flex items-center gap-2 bg-[#121c2e] px-3 py-1.5 rounded-xl border border-[#253859]">
                <span className="text-[11px] font-bold text-slate-300">Test Mode:</span>
                <button
                  type="button"
                  onClick={() => setIsTestMode(!isTestMode)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isTestMode ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  title="Test notifications are marked [TEST - NOT AN EMERGENCY] and routed strictly to your device/email."
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isTestMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-[10px] font-black uppercase ${isTestMode ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {isTestMode ? 'ENABLED' : 'OFF'}
                </span>
              </div>
            </div>

            {isTestMode && (
              <div className="bg-amber-950/60 border border-amber-500/50 p-3 rounded-xl text-xs text-yellow-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Test Mode Active:</span> This notification will be automatically prefixed with{' '}
                  <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-[11px] text-yellow-200">[TEST - NOT AN EMERGENCY]</code> and dispatched strictly to your own administrator email/browser without disturbing registered public subscribers.
                </div>
              </div>
            )}

            {/* Notification Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Notification Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flash Flood Advisory for Belize River Valley"
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Notification Message */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Notification Message Body <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter clear, actionable emergency instructions, protective actions, and evacuation shelter notices..."
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37] leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>Keep concise for SMS readability (standard SMS length ~160 chars).</span>
                <span className="font-mono">{message.length} characters</span>
              </div>
            </div>

            {/* Category and Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notification Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Priority Level <span className="text-red-400">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Geographic Targeting: District and Communities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Affected District Target <span className="text-red-400">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as BelizeDistrict | 'all')}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="all">National (All 6 Districts)</option>
                  <option value="Belize">Belize District</option>
                  <option value="Cayo">Cayo District</option>
                  <option value="Corozal">Corozal District</option>
                  <option value="Orange Walk">Orange Walk District</option>
                  <option value="Stann Creek">Stann Creek District</option>
                  <option value="Toledo">Toledo District</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Audience Segment
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {TARGET_AUDIENCES.map((aud) => (
                    <option key={aud} value={aud}>
                      {aud}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Affected Communities input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Affected Communities / Villages (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={communitiesInput}
                onChange={(e) => setCommunitiesInput(e.target.value)}
                placeholder="e.g. Crooked Tree, Burrell Boom, Biscayne, Lord's Bank"
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Publication and Expiration Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Publication Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Expiration Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Reference URL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Link to Full Incident or Emergency Advisory (Optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://belizealerts.bz/advisories/flood-warning-2026"
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-[#18263e] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#141e30] hover:bg-[#1f2e4a] text-slate-200 border border-[#283b5c] text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Preview Notification</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDispatch('draft')}
                  className="px-3.5 py-2 rounded-xl bg-[#141e30] hover:bg-[#1f2e4a] text-slate-300 border border-[#283b5c] text-xs font-bold transition"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDispatch('scheduled')}
                  className="px-3.5 py-2 rounded-xl bg-[#141e30] hover:bg-[#1f2e4a] text-slate-300 border border-[#283b5c] text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Schedule</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Dedicated Test Broadcast CTA */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDispatch('sent', true)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-yellow-300 border border-amber-500/50 text-xs font-black transition flex items-center gap-1.5"
                  title="Sends [TEST - NOT AN EMERGENCY] to administrator device & email only"
                >
                  <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Send Test Notification</span>
                </button>

                {/* Live Official Broadcast */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDispatch('sent', false)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-[#8b152e] to-[#600b1d] hover:from-red-500 hover:to-[#8b152e] text-white text-xs font-black border border-[#d4af37] shadow-lg shadow-black/60 transition hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-yellow-300" />
                  <span>
                    {isTestMode ? 'Dispatch Test Notification' : 'Send Live Emergency Notification'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Delivery Channels & Audience Reach Estimator */}
          <div className="lg:col-span-4 space-y-4">
            {/* Delivery Channels Card */}
            <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-xl space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#d4af37]" />
                <span>Delivery Channels (Multi-Select)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Select one or multiple communication conduits to distribute this warning:
              </p>

              <div className="space-y-2 pt-1">
                {/* Push Notification */}
                <label
                  onClick={() => handleChannelToggle('push')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    channels.includes('push')
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-[#121c2e] border-[#223352] text-slate-400 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes('push')}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-600 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Web & Mobile Push Notifications</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      FCM & Service Worker browser chime sent to subscribed desktop and installed PWA devices.
                    </p>
                  </div>
                </label>

                {/* Email Notification */}
                <label
                  onClick={() => handleChannelToggle('email')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    channels.includes('email')
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                      : 'bg-[#121c2e] border-[#223352] text-slate-400 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes('email')}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-600 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Transactional Email Broadcast</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Formatted HTML alerts dispatched through verified transactional mail relays.
                    </p>
                  </div>
                </label>

                {/* SMS Notification */}
                <label
                  onClick={() => handleChannelToggle('sms')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    channels.includes('sms')
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                      : 'bg-[#121c2e] border-[#223352] text-slate-400 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes('sms')}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-600 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SMS Gateway (Carrier Alert)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Standard telecommunications SMS delivery prepared for high-urgency cyclone and flood warnings.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Audience Reach Estimator */}
            <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-xl space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4af37]" />
                <span>Estimated Target Audience Reach</span>
              </h3>

              <div className="bg-[#121c2e] p-3 rounded-xl border border-[#233555] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Target Region:</span>
                  <span className="font-bold text-white capitalize">
                    {district === 'all' ? 'All 6 Districts (National)' : `${district} District`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Subscribed Citizens:</span>
                  <span className="font-mono font-black text-[#f3c853]">
                    ~{estimatedReach.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#1e2e4a] space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3 h-3 text-amber-400" />
                      <span>Push Enabled:</span>
                    </span>
                    <span className="font-mono font-bold">~{estimatedPush.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>Email Enabled:</span>
                    </span>
                    <span className="font-mono font-bold">~{estimatedEmail.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      <span>SMS Opted-In:</span>
                    </span>
                    <span className="font-mono font-bold">~{estimatedSms.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed italic">
                * Audience filtering ensures subscribers only receive warnings for districts they selected or authorized national declarations.
              </div>
            </div>

            {/* Authorization & Integrity Card */}
            <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] text-xs space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Broadcast Authorization Standard</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dispatches are cryptographically stamped with your administrator identity (
                <span className="text-white font-semibold">{user?.email}</span>) and audited under Sendai Disaster Risk Reduction framework standards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BROADCAST HISTORY & LOGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="bg-[#0b1220] p-4 sm:p-5 rounded-2xl border border-[#1e2e4a] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#18263e]">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wide">
                Notification Broadcast Registry
              </h2>
              <p className="text-xs text-slate-400">
                Audited history of civil defense warnings, scheduled broadcasts, and administrative drills
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* District Filter */}
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="bg-[#121c2e] border border-[#233555] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Districts</option>
                {DISTRICTS.filter((d) => d !== 'all').map((d) => (
                  <option key={d} value={d}>
                    {d} District
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, message..."
                  className="bg-[#121c2e] border border-[#233555] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          </div>

          {/* List of Notifications */}
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No notifications found matching your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const isCritical = notif.priority === 'Critical';
                const isHigh = notif.priority === 'High';

                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all ${
                      notif.isTest
                        ? 'bg-[#101726] border-yellow-500/30'
                        : isCritical
                        ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/70'
                        : isHigh
                        ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                        : 'bg-[#121c2e] border-[#223352] hover:border-[#354f7a]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {notif.isTest && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                              TEST - NOT AN EMERGENCY
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              notif.priority === 'Critical'
                                ? 'bg-red-600 text-white'
                                : notif.priority === 'High'
                                ? 'bg-amber-500 text-slate-950'
                                : notif.priority === 'Moderate'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {notif.priority}
                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18263f] text-[#f3c853] border border-[#2d446f]">
                            {notif.category}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            District: <span className="text-white font-semibold">{notif.district === 'all' ? 'National (All)' : notif.district}</span>
                          </span>

                          <span className="text-[11px] text-slate-400">
                            Target: <span className="text-white font-semibold">{notif.targetAudience}</span>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white leading-tight">
                          {notif.title}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Communities */}
                        {notif.communities && notif.communities.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-300">Communities:</span>
                            <span>{notif.communities.join(', ')}</span>
                          </div>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-400 border-t border-[#1e2e4a]">
                          <span>
                            Authorized by: <strong className="text-slate-300">{notif.approvedBy || notif.creatorName}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Published: <strong className="text-slate-300">{new Date(notif.publicationDate).toLocaleString()}</strong>
                          </span>
                          {notif.expirationDate && (
                            <>
                              <span>•</span>
                              <span>
                                Expires: <strong className="text-slate-300">{new Date(notif.expirationDate).toLocaleString()}</strong>
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Channels:
                            {notif.channels.map((ch) => (
                              <span key={ch} className="uppercase font-bold text-yellow-300">
                                {ch}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>

                      {/* Right Delivery Badge & Inspection CTA */}
                      <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase text-center ${
                            notif.status === 'sent'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : notif.status === 'scheduled'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          Status: {notif.status}
                        </span>

                        {notif.deliveryReport && (
                          <button
                            type="button"
                            onClick={() => setSelectedNotifForInspection(notif)}
                            className="text-xs text-[#d4af37] hover:text-white font-bold flex items-center gap-1 transition"
                          >
                            <span>Inspect Delivery Report</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {notif.linkUrl && (
                          <a
                            href={notif.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <span>Full Advisory</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DELIVERY ANALYTICS & PROVIDER REPORTING */}
      {/* ========================================================================= */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-4">
          {/* Top Aggregated Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Total Intended Recipients
              </span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
                {aggregateMetrics.totalIntended.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Across all broadcast campaigns</div>
            </div>

            <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Bell className="w-3 h-3 text-amber-400" />
                <span>Push Dispatches</span>
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1 font-mono">
                {aggregateMetrics.pushDelivered.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Delivered of {aggregateMetrics.pushAttempts.toLocaleString()} attempts
              </div>
            </div>

            <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Mail className="w-3 h-3 text-cyan-400" />
                <span>Email Provider Accepted</span>
              </span>
              <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-1 font-mono">
                {aggregateMetrics.emailAccepted.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Accepted by relays ({aggregateMetrics.emailAttempts.toLocaleString()} sent)
              </div>
            </div>

            <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Citizen Acknowledgements</span>
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1 font-mono">
                {aggregateMetrics.acknowledged.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Verified read & acknowledged</div>
            </div>
          </div>

          {/* Detailed Integrity Explanation & Provider Breakdown */}
          <div className="bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#d4af37]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wide">
                Delivery Reporting & Verification Integrity Standard
              </h3>
            </div>

            <div className="bg-[#121c2e] p-4 rounded-xl border border-[#233555] text-xs space-y-2 text-slate-300 leading-relaxed">
              <p className="font-semibold text-white">
                Strict Communication Reporting Discipline:
              </p>
              <p>
                In compliance with Sendai Framework national monitoring, Belize Alerts explicitly differentiates between:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>
                  <strong className="text-amber-300">Sent / Attempted:</strong> Messages transmitted by the dispatch scheduler to third-party telecommunications infrastructure.
                </li>
                <li>
                  <strong className="text-cyan-300">Provider-Accepted:</strong> Formally accepted into the outbound queue of verified transactional email relays (e.g. Resend, Brevo) or SMS carriers.
                </li>
                <li>
                  <strong className="text-emerald-300">Delivered (where measurable):</strong> Device-level Web Push reception confirmed by the local Service Worker.
                </li>
                <li>
                  <strong className="text-green-400">Acknowledged:</strong> Actively opened and confirmed by the citizen in the Belize Alerts application interface.
                </li>
              </ul>
              <div className="text-[11px] text-yellow-300 font-bold pt-1">
                ⚠️ Operational Policy: The platform never presumes that an emergency warning has been seen merely because it was transmitted.
              </div>
            </div>

            {/* Campaign-by-campaign Delivery Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#101726] text-slate-400 font-bold uppercase text-[10px] border-b border-[#233555]">
                    <th className="py-2.5 px-3">Campaign / Warning</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Intended</th>
                    <th className="py-2.5 px-3 text-right">Push Confirmed</th>
                    <th className="py-2.5 px-3 text-right">Email Relay Accepted</th>
                    <th className="py-2.5 px-3 text-right">SMS Gateway</th>
                    <th className="py-2.5 px-3 text-right">Acknowledged</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2e4a]">
                  {notifications
                    .filter((n) => n.deliveryReport)
                    .map((n) => (
                      <tr key={n.id} className="hover:bg-[#121c2e] transition">
                        <td className="py-2.5 px-3 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            {n.isTest && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-yellow-500/20 text-yellow-300">
                                TEST
                              </span>
                            )}
                            <span className="truncate max-w-[220px]">{n.title}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(n.publicationDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {n.deliveryReport?.intendedRecipients.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                          {n.deliveryReport?.pushDelivered.toLocaleString()} / {n.deliveryReport?.pushAttempts.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-cyan-300">
                          {n.deliveryReport?.emailAccepted.toLocaleString()} / {n.deliveryReport?.emailAttempts.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                          {n.deliveryReport?.smsAccepted.toLocaleString()} / {n.deliveryReport?.smsAttempts.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-green-400 font-bold">
                          {n.deliveryReport?.acknowledgedCount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedNotifForInspection(n)}
                            className="px-2 py-1 rounded bg-[#1c2940] hover:bg-[#283b5c] text-[11px] font-bold text-[#d4af37]"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUBSCRIBER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'subscribers' && (
        <div className="bg-[#0b1220] p-5 rounded-2xl border border-[#1e2e4a] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#18263e]">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wide">
                Subscriber Registry & Preference Governance
              </h2>
              <p className="text-xs text-slate-400">
                Registered citizen subscribers, opt-in consent logs, and localized hazard notification channels
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPrefModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-slate-950 font-black text-xs shadow transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-950" />
              <span>Customize Alert Preferences</span>
            </button>
          </div>

          {/* District Distribution Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { district: 'Belize', count: 9800, color: 'text-amber-300' },
              { district: 'Cayo', count: 5200, color: 'text-emerald-300' },
              { district: 'Orange Walk', count: 3400, color: 'text-cyan-300' },
              { district: 'Corozal', count: 2800, color: 'text-blue-300' },
              { district: 'Stann Creek', count: 2100, color: 'text-purple-300' },
              { district: 'Toledo', count: 1600, color: 'text-orange-300' }
            ].map((d) => (
              <div key={d.district} className="bg-[#121c2e] p-3 rounded-xl border border-[#233555] text-xs">
                <div className="text-slate-400 font-semibold">{d.district}</div>
                <div className={`text-base font-black ${d.color} font-mono mt-0.5`}>
                  {d.count.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">Active Subscribers</div>
              </div>
            ))}
          </div>

          {/* Subscriber Consent & Privacy Standards */}
          <div className="bg-[#121c2e] p-4 rounded-xl border border-[#233555] text-xs space-y-2 text-slate-300 leading-relaxed">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Explicit Consent & Unsubscribe Governance</span>
            </h4>
            <p>
              In accordance with national privacy laws and Sendai Disaster Risk Reduction policies:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
              <li>
                <strong>Opt-In Consent:</strong> Registered citizen accounts are never automatically signed up for marketing or non-essential notices. Each subscriber controls their preferred districts and hazard alerts.
              </li>
              <li>
                <strong>Immediate Unsubscribe:</strong> Every transactional email and notification footer includes an immediate preference management link allowing users to unsubscribe from non-life-threatening bulletins.
              </li>
              <li>
                <strong>Life-Safety Exception:</strong> Red-level National Warnings declared by the Prime Minister or NEMO National Coordinator override non-essential suppressions under the Disaster Preparedness and Response Act.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOTIFICATION PREVIEW (Push, Email HTML, SMS) */}
      {/* ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1220] border border-[#2a3c5d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-[#101726] border-b border-[#223352] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-black text-sm text-white uppercase tracking-wide">
                  Notification Channel Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253d]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Channel Tabs */}
            <div className="flex items-center gap-2 px-4 pt-3 bg-[#0d1424] border-b border-[#1c2942]">
              <button
                type="button"
                onClick={() => setPreviewTab('push')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
                  previewTab === 'push'
                    ? 'text-amber-300 border-[#d4af37] bg-[#121c2e]'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Push Notification</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('email')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
                  previewTab === 'email'
                    ? 'text-cyan-300 border-cyan-400 bg-[#121c2e]'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>HTML Email Bulletin</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('sms')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
                  previewTab === 'sms'
                    ? 'text-emerald-300 border-emerald-400 bg-[#121c2e]'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Carrier SMS</span>
              </button>
            </div>

            {/* Preview Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Push Notification Preview */}
              {previewTab === 'push' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Simulation of device lock screen / browser push banner:
                  </div>
                  <div className="bg-[#182338] border border-[#2e4368] rounded-2xl p-4 shadow-xl flex items-start gap-3 max-w-lg mx-auto">
                    <img
                      src="/assets/aistudio/image_ff7e619e.png"
                      alt="Belize Alerts"
                      className="w-10 h-10 rounded-xl object-cover border border-[#d4af37]"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-[#d4af37]">
                          BELIZE ALERTS • {priority.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">Just now</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        {isTestMode ? '[TEST] ' : ''}🚨 {title || 'Advisory Title'}
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        {message || 'Notification content will appear here...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HTML Email Bulletin Preview */}
              {previewTab === 'email' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Simulation of verified Belize Alerts transactional email template:
                  </div>
                  <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-300 max-w-lg mx-auto space-y-4 font-sans text-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <img
                          src="/assets/aistudio/image_ff7e619e.png"
                          alt="Belize Alerts Logo"
                          className="w-8 h-8 rounded-lg"
                        />
                        <div>
                          <div className="font-black text-sm text-slate-950">BELIZE ALERTS</div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Central Emergency Notification Centre
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700">
                        {priority} Priority
                      </div>
                    </div>

                    {isTestMode && (
                      <div className="bg-amber-100 text-amber-900 p-2 rounded text-[11px] font-black text-center border border-amber-300">
                        *** THIS IS A DRILL / TEST BROADCAST - NOT AN EMERGENCY ***
                      </div>
                    )}

                    <div className="space-y-1">
                      <h4 className="font-black text-base text-slate-950 leading-tight">
                        {title || 'Emergency Warning Title'}
                      </h4>
                      <div className="text-[11px] text-slate-500">
                        Category: <strong>{category}</strong> • Target: <strong>{district === 'all' ? 'National' : district}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed text-xs">
                      {message || 'Emergency message body and instructions...'}
                    </div>

                    {linkUrl && (
                      <div className="text-center pt-1">
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block px-4 py-2 bg-slate-950 text-white rounded-lg font-bold text-xs"
                        >
                          View Full Advisory Online →
                        </a>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1 text-center">
                      <div>Initiative by Zain Dueheney • Lecturer, Galen University</div>
                      <div>Sendai Framework for Disaster Risk Reduction 2015–2030</div>
                      <div className="text-[9px] text-slate-400">
                        You received this because you are a registered subscriber. Manage your preferences anytime.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMS Preview */}
              {previewTab === 'sms' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Simulation of mobile phone SMS inbox:
                  </div>
                  <div className="bg-[#121c2e] border border-[#233555] rounded-3xl p-4 shadow-xl max-w-sm mx-auto space-y-3">
                    <div className="text-center text-[10px] font-bold text-slate-400">
                      BELIZE ALERTS • SHORT CODE: 9110
                    </div>
                    <div className="bg-[#1e2e4a] text-white p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed space-y-1">
                      <div className="font-black text-yellow-300">
                        {isTestMode ? '[TEST] ' : '🚨 '}BELIZE ALERTS ({priority.toUpperCase()}):
                      </div>
                      <div>{title || 'Title'}</div>
                      <div className="text-slate-300">{message || 'Message content...'}</div>
                      {linkUrl && <div className="text-cyan-400 text-[11px] underline">{linkUrl}</div>}
                    </div>
                    <div className="text-[10px] text-right text-slate-500 font-mono">
                      ~{message.length} chars (1 SMS segment)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#101726] border-t border-[#223352] flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1f2e4a] hover:bg-[#283b5c] text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELIVERY REPORT INSPECTION DETAILS */}
      {/* ========================================================================= */}
      {selectedNotifForInspection && selectedNotifForInspection.deliveryReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1220] border border-[#2a3c5d] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#101726] border-b border-[#223352] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-black text-sm text-white uppercase tracking-wide">
                  Delivery Report Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotifForInspection(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253d]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-white text-sm">
                  {selectedNotifForInspection.title}
                </h4>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Category: {selectedNotifForInspection.category} • Priority: {selectedNotifForInspection.priority}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#121c2e] p-3 rounded-xl border border-[#233555]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Intended Recipients</span>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {selectedNotifForInspection.deliveryReport.intendedRecipients.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#121c2e] p-3 rounded-xl border border-[#233555]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Push Notifications</span>
                  <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                    {selectedNotifForInspection.deliveryReport.pushDelivered.toLocaleString()}
                    <span className="text-xs text-slate-400 font-normal">
                      {' '}
                      / {selectedNotifForInspection.deliveryReport.pushAttempts.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-[#121c2e] p-3 rounded-xl border border-[#233555]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Email Relay Accepted</span>
                  <div className="text-lg font-black text-cyan-300 font-mono mt-0.5">
                    {selectedNotifForInspection.deliveryReport.emailAccepted.toLocaleString()}
                    <span className="text-xs text-slate-400 font-normal">
                      {' '}
                      / {selectedNotifForInspection.deliveryReport.emailAttempts.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-[#121c2e] p-3 rounded-xl border border-[#233555]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Confirmed Acknowledged</span>
                  <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                    {selectedNotifForInspection.deliveryReport.acknowledgedCount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-[#121c2e] p-3 rounded-xl border border-[#233555] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Failed Transmissions:</span>
                  <span className="font-mono font-bold text-red-400">
                    {selectedNotifForInspection.deliveryReport.failedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed At:</span>
                  <span className="font-mono text-slate-300">
                    {selectedNotifForInspection.deliveryReport.completedAt
                      ? new Date(selectedNotifForInspection.deliveryReport.completedAt).toLocaleString()
                      : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#101726] border-t border-[#223352] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotifForInspection(null)}
                className="px-4 py-2 rounded-xl bg-[#1f2e4a] hover:bg-[#283b5c] text-white font-bold text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriber Preferences Modal */}
      <SubscriberPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
      />
    </div>
  );
};
