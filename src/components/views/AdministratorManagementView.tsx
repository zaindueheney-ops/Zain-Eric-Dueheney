import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  ShieldCheck,
  UserCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  MapPin,
  Building,
  Key,
  Trash2,
  Shield
} from 'lucide-react';
import { collection, onSnapshot, query, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth, isAuthorizedAdminEmail } from '../../context/AuthContext';
import { useCommand } from '../../context/CommandContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { UserProfile, AdminRole, AdminPermissions, BelizeDistrict } from '../../types';

export const AdministratorManagementView: React.FC = () => {
  const { user } = useAuth();
  const { appointAdministrator, revokeAdministrator } = useCommand();

  const isSuperAdmin = isAuthorizedAdminEmail(user?.email);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adminRole, setAdminRole] = useState<AdminRole>('district_admin');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [permissions, setPermissions] = useState<AdminPermissions>({
    canVerifyIncidents: true,
    canIssueAlerts: true,
    canDispatchTeams: true,
    canManageSchools: false,
    canManageUsers: false,
    canViewAuditLogs: true,
    canManageSystemSettings: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load all users from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'users'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as UserProfile));
        setAllUsers(list);

        const admins = list.filter(
          (u) =>
            u.role === 'admin' ||
            u.adminRole !== undefined ||
            isAuthorizedAdminEmail(u.email)
        );
        setAdminUsers(admins);
        setLoading(false);
      }, (err) => {
        console.warn('Admins listener notice:', err);
        setLoading(false);
      });
      return () => unsub();
    } catch {
      setLoading(false);
    }
  }, []);

  // Update default permissions when role changes
  const handleRoleChange = (newRole: AdminRole) => {
    setAdminRole(newRole);
    if (newRole === 'super_admin') {
      setPermissions({
        canVerifyIncidents: true,
        canIssueAlerts: true,
        canDispatchTeams: true,
        canManageSchools: true,
        canManageUsers: true,
        canViewAuditLogs: true,
        canManageSystemSettings: true,
      });
    } else if (newRole === 'national_admin') {
      setPermissions({
        canVerifyIncidents: true,
        canIssueAlerts: true,
        canDispatchTeams: true,
        canManageSchools: true,
        canManageUsers: true,
        canViewAuditLogs: true,
        canManageSystemSettings: false,
      });
    } else if (newRole === 'district_admin') {
      setPermissions({
        canVerifyIncidents: true,
        canIssueAlerts: true,
        canDispatchTeams: true,
        canManageSchools: false,
        canManageUsers: false,
        canViewAuditLogs: true,
        canManageSystemSettings: false,
      });
    } else if (newRole === 'dispatcher') {
      setPermissions({
        canVerifyIncidents: false,
        canIssueAlerts: false,
        canDispatchTeams: true,
        canManageSchools: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canManageSystemSettings: false,
      });
    } else if (newRole === 'school_admin') {
      setPermissions({
        canVerifyIncidents: false,
        canIssueAlerts: false,
        canDispatchTeams: false,
        canManageSchools: true,
        canManageUsers: false,
        canViewAuditLogs: false,
        canManageSystemSettings: false,
      });
    }
  };

  const handleAppointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const targetUser = allUsers.find((u) => u.id === selectedUserId);
    if (!targetUser) return;

    setIsSubmitting(true);
    try {
      const districtsValue = selectedDistrict === 'all' ? 'all' : [selectedDistrict as BelizeDistrict];
      await appointAdministrator(targetUser, adminRole, districtsValue, permissions);

      setSuccessMessage(`✓ Successfully appointed ${targetUser.displayName || targetUser.email} as ${adminRole.replace('_', ' ').toUpperCase()}`);
      setIsAppointModalOpen(false);
      setSelectedUserId('');
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch (err: any) {
      alert(`Could not appoint administrator: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (targetUser: UserProfile) => {
    if (isAuthorizedAdminEmail(targetUser.email)) {
      alert('Root Super Administrator privileges cannot be revoked.');
      return;
    }

    if (!confirm(`Revoke administrative access for ${targetUser.displayName || targetUser.email}? User will revert to standard citizen status.`)) {
      return;
    }

    try {
      await revokeAdministrator(targetUser);
      setSuccessMessage(`✓ Administrative credentials revoked for ${targetUser.email}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Could not revoke credentials: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-yellow-300 border border-amber-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Administrator Roster & Permission Matrix
            </h2>
            <p className="text-[11px] text-slate-400">
              Granular Role-Based Access Control (RBAC), district jurisdictions, and administrative appointments
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsAppointModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#b8860b] hover:from-[#f3c853] text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ APPOINT ADMINISTRATOR</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Root Super Administrator Card */}
      <div className="bg-gradient-to-r from-[#141b2b] via-[#1b253b] to-[#141b2b] p-4 rounded-2xl border-2 border-[#d4af37] shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37] text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">Zain Dueheney</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#d4af37] text-slate-950">
                  ROOT SUPER ADMINISTRATOR
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-mono mt-0.5">zaindueheney@gmail.com</p>
            </div>
          </div>

          <span className="text-[10px] text-[#f3c853] font-bold px-2 py-1 rounded bg-[#0b1220] border border-[#d4af37]/40 hidden sm:inline-block">
            Full System Authority (Nationwide)
          </span>
        </div>

        <div className="text-xs text-slate-300 bg-[#0b1220] p-3 rounded-xl border border-[#233555] space-y-1">
          <p className="text-[11px] leading-relaxed">
            Immutable root authority. Manages national dispatching, incident approval policies, public alert broadcasting, organization isolation, and administrator appointments under the Sendai Disaster Risk Reduction Framework.
          </p>
        </div>
      </div>

      {/* Active Administrators Table */}
      <div className="bg-[#0b1220] rounded-2xl border border-[#1e2e4a] shadow-xl overflow-hidden space-y-2">
        <div className="p-3 border-b border-[#1e2e4a] flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#d4af37]" />
            <span>Appointed Administrators Roster ({adminUsers.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070c17] text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-[#1e2e4a]">
              <tr>
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Role Level</th>
                <th className="py-2.5 px-3">Assigned Jurisdiction</th>
                <th className="py-2.5 px-3">Permissions Matrix</th>
                <th className="py-2.5 px-3">Appointed By</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182338]">
              {adminUsers.map((admin) => {
                const isRoot = isAuthorizedAdminEmail(admin.email);
                const roleLabel = isRoot
                  ? 'Super Administrator'
                  : admin.adminRole
                  ? admin.adminRole.replace('_', ' ').toUpperCase()
                  : 'Administrator';

                return (
                  <tr key={admin.id || admin.email} className="hover:bg-[#121b2d] transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-xs">{admin.displayName || admin.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{admin.email}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isRoot
                            ? 'bg-[#d4af37] text-slate-950 border-yellow-200'
                            : 'bg-amber-950 text-yellow-300 border-yellow-500/50'
                        }`}
                      >
                        {roleLabel}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-200 text-[11px]">
                        {admin.assignedDistricts === 'all'
                          ? 'Nationwide (All 6 Districts)'
                          : Array.isArray(admin.assignedDistricts)
                          ? admin.assignedDistricts.join(', ')
                          : admin.district || 'Belize'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap text-[10px]">
                        {isRoot ? (
                          <span className="text-emerald-400 font-bold">✓ All Privileges Granted</span>
                        ) : admin.permissions ? (
                          <>
                            {admin.permissions.canVerifyIncidents && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                                Verify
                              </span>
                            )}
                            {admin.permissions.canIssueAlerts && (
                              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40">
                                Alerts
                              </span>
                            )}
                            {admin.permissions.canDispatchTeams && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-yellow-300 border border-yellow-500/40">
                                Dispatch
                              </span>
                            )}
                            {admin.permissions.canManageUsers && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                                Users
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500 italic">Standard</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-[10px] text-slate-400 font-mono">
                      {admin.appointedBy || 'System Root'}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {isSuperAdmin && !isRoot && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(admin)}
                          className="px-2 py-1 rounded bg-red-950 hover:bg-red-800 text-red-300 text-[10px] font-bold border border-red-700/60 transition"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* + APPOINT ADMINISTRATOR MODAL */}
      {isAppointModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-[#d4af37] text-white max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Appoint New Administrator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAppointSubmit} className="space-y-3.5 text-xs">
              {/* Select User */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Select Registered Citizen / Officer to Promote:
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="">-- Choose User Profile --</option>
                  {allUsers
                    .filter((u) => !isAuthorizedAdminEmail(u.email))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email} ({u.email}) [{u.district} District]
                      </option>
                    ))}
                </select>
              </div>

              {/* Role Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Administrative Role Level:
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="national_admin">National Administrator</option>
                    <option value="district_admin">District Administrator</option>
                    <option value="dispatcher">Response Team Lead / Dispatcher</option>
                    <option value="school_admin">School Safety Administrator</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Jurisdiction / District Assignment:
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="all">📍 Nationwide (All 6 Districts)</option>
                    {BELIZE_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-2 uppercase tracking-wider">
                  Granular Permissions Matrix:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#070c17] p-3 rounded-xl border border-[#1e2e4a]">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canVerifyIncidents}
                      onChange={(e) => setPermissions({ ...permissions, canVerifyIncidents: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span>Verify Citizen Reports</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canIssueAlerts}
                      onChange={(e) => setPermissions({ ...permissions, canIssueAlerts: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span>Issue Public Alerts</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDispatchTeams}
                      onChange={(e) => setPermissions({ ...permissions, canDispatchTeams: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span>Dispatch Response Units</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageSchools}
                      onChange={(e) => setPermissions({ ...permissions, canManageSchools: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span>Manage School Safety</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageUsers}
                      onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span>Manage Users / Appoint</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewAuditLogs}
                      onChange={(e) => setPermissions({ ...permissions, canViewAuditLogs: e.target.checked })}
                      className="accent-[#d4af37]"
                    />
                    <span>View Audit Logs</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAppointModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedUserId}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-slate-950 font-black shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Appointing...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
