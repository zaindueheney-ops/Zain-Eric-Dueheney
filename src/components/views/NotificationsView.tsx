import React, { useState } from 'react';
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
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { triggerAdminPushNotification } from '../../services/notificationService';

export const NotificationsView: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [testTitle, setTestTitle] = useState('EOC Drill Notification');
  const [testBody, setTestBody] = useState('This is a test broadcast of the Belize Alerts Emergency Operations Centre.');
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleSendTestNotification = () => {
    try {
      triggerAdminPushNotification({
        id: `test_${Date.now()}`,
        title: testTitle,
        category: 'other',
        severity: 'medium',
        district: 'Belize',
        locationName: 'Belmopan National EOC',
        hasPicture: false,
      });
      setSentMessage('✓ Test notification chime triggered successfully on this device.');
      setTimeout(() => setSentMessage(null), 4000);
    } catch (err: any) {
      alert(`Notification error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-yellow-300 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Emergency Notification Centre & Distribution Channels
            </h2>
            <p className="text-[11px] text-slate-400">
              Multi-channel alerting status, audiotone testing, and civil dispatch broadcast logs
            </p>
          </div>
        </div>
      </div>

      {sentMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{sentMessage}</span>
        </div>
      )}

      {/* Distribution Channels Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e2e4a] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>In-App Banner Stream</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Online
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Real-time WebSocket alerts triggered directly on all active responder and citizen screens.
          </p>
        </div>

        <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e2e4a] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Email Gateway</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Online
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Dispatches automated incident reports and alert bulletins to registered EOC officials.
          </p>
        </div>

        <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e2e4a] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Audio Chime System</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Online
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Synthesized emergency siren chime alerting central dispatch when new incidents are filed.
          </p>
        </div>

        <div className="bg-[#0b1220] p-4 rounded-xl border border-[#1e2e4a] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <span>SMS Gateway</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
              Standby
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Carrier-grade SMS distribution configured for national hurricane evacuation alerts.
          </p>
        </div>
      </div>

      {/* Test / Drill Broadcast Tool (Admins Only) */}
      {isAdmin && (
        <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] space-y-3 shadow-lg">
          <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#d4af37]" />
            <span>Simulate EOC Chime & Browser Notification</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Drill Title:</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Drill Message:</label>
              <input
                type="text"
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendTestNotification}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4 text-slate-950" />
            <span>Test Sound & Notification Chime</span>
          </button>
        </div>
      )}
    </div>
  );
};
