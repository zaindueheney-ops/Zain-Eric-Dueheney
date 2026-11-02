import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Shield,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useAuth } from '../../context/AuthContext';
import { BELIZE_DISTRICTS } from '../../data/belizeGeo';
import { RegisteredOrganization, BelizeDistrict } from '../../types';

export const OrganizationManagementView: React.FC = () => {
  const { organizations, addOrganization } = useCommand();
  const { user } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<RegisteredOrganization['type']>('government_agency');
  const [district, setDistrict] = useState<BelizeDistrict | 'National'>('National');
  const [leadOfficial, setLeadOfficial] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+501 ');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      await addOrganization({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        district,
        leadOfficial: leadOfficial.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        memberCount: 1,
        status: 'active',
        notes: notes.trim() || undefined,
      });

      setIsAddModalOpen(false);
      setName('');
      setCode('');
      setLeadOfficial('');
      setContactEmail('');
    } catch (err: any) {
      alert(`Error registering organization: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b1220] p-4 rounded-2xl border border-[#1e2e4a] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm sm:text-base text-white">
              Multi-Organization & Tenant Management
            </h2>
            <p className="text-[11px] text-slate-400">
              Institutional partition architecture for statutory agencies, emergency services, municipalities, and enterprise clients
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 text-white font-black text-xs border border-purple-400/60 shadow-lg flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Organization</span>
        </button>
      </div>

      {/* Commercialization Notice */}
      <div className="bg-[#0f172a] p-3 rounded-xl border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
        <Globe className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Multi-Tenant Commercialization Architecture:</strong> Each organization operates with secure data boundaries, allowing nationwide statutory responders, municipal emergency teams, and private institutions to coordinate under isolated roles.
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-[#0b1220] rounded-xl border border-[#1e2e4a] hover:border-[#2e4370] p-4 shadow-lg flex flex-col justify-between space-y-3 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                      {org.code}
                    </span>
                    <h4 className="font-bold text-white text-sm truncate max-w-[200px]">{org.name}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                    {org.type.replace('_', ' ')} • {org.district}
                  </p>
                </div>

                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {org.status}
                </span>
              </div>

              {/* Specs Box */}
              <div className="mt-2.5 bg-[#070c17] p-2.5 rounded-lg border border-[#182338] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Lead Official:</span>
                  <span className="text-white font-bold">{org.leadOfficial}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <a href={`tel:${org.contactPhone}`} className="text-emerald-300 font-mono hover:underline">
                    {org.contactPhone}
                  </a>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Official Email:</span>
                  <span className="text-slate-200 truncate max-w-[170px]">{org.contactEmail}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Active Roster:</span>
                  <span className="text-slate-200 font-mono">{org.memberCount} Personnel</span>
                </div>

                {org.notes && (
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-[#182338] italic">
                    "{org.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e2e4a] text-[10px] text-slate-500 font-mono">
              Registered: {new Date(org.registeredAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Add Organization Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1220] rounded-2xl border-2 border-[#d4af37] text-white max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2e4a] pb-3">
              <h3 className="font-bold text-sm sm:text-base">Register Agency or Organization</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Organization Name:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. San Pedro Municipal EOC"
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Code / Prefix:</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SP-EOC"
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Type:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="government_agency">Government Agency</option>
                    <option value="first_responder">First Responder</option>
                    <option value="municipality">Municipality / Town Council</option>
                    <option value="educational">Educational / Schools</option>
                    <option value="ngo">NGO / Relief Organization</option>
                    <option value="commercial">Commercial / Private Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">District:</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value as any)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="National">National Coverage</option>
                    {BELIZE_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Lead Official:</label>
                  <input
                    type="text"
                    required
                    value={leadOfficial}
                    onChange={(e) => setLeadOfficial(e.target.value)}
                    placeholder="e.g. Director or Coordinator"
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Contact Email:</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. dispatch@org.bz"
                  className="w-full bg-[#121c2e] border border-[#233555] rounded-xl p-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-[#1e2e4a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
