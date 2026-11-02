import React from 'react';
import { UserCheck, Users, Shield } from 'lucide-react';
import { AdminUserDirectory } from '../AdminUserDirectory';
import { useIncidents } from '../../context/IncidentContext';

export const UserManagementView: React.FC = () => {
  const { incidents } = useIncidents();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              User Management & Verification Directory
            </h2>
            <p className="text-[11px] text-slate-400">
              Verified Belize citizens, first responders, and dispatchers cataloged across six districts
            </p>
          </div>
        </div>
      </div>

      {/* Directory Component */}
      <AdminUserDirectory incidents={incidents} />
    </div>
  );
};
