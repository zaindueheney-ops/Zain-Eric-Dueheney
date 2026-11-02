import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Shield,
  Phone,
  Building,
  MapPin,
  Calendar,
  Globe,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { BelizeDistrict, UserRole } from '../types';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';
import { COUNTRIES } from '../data/countries';
import { useAuth } from '../context/AuthContext';

export const SelfRegistrationModal: React.FC = () => {
  const {
    user,
    profile,
    showRegisterModal,
    setShowRegisterModal,
    registerProfile,
    signOut,
  } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+501');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState<string>('Belize');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('Belizean');
  const [role, setRole] = useState<UserRole>('citizen');
  const [organization, setOrganization] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || profile.displayName?.split(' ')[0] || '');
      setLastName(profile.lastName || profile.displayName?.split(' ').slice(1).join(' ') || '');
      setPhoneCountryCode(profile.phoneCountryCode || '+501');
      setPhone(profile.phone || '');
      setDistrict(profile.district || 'Belize');
      setDateOfBirth(profile.dateOfBirth || '');
      setNationality(profile.nationality || 'Belizean');
      setRole(profile.role || 'citizen');
      setOrganization(profile.organization || '');
    } else if (user) {
      const parts = (user.displayName || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setDistrict('Belize');
      setRole(user.email === 'zaindueheney@gmail.com' ? 'admin' : 'citizen');
    }
  }, [profile, user]);

  if (!showRegisterModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Please provide your First Name.');
      return;
    }
    if (!lastName.trim()) {
      setError('Please provide your Last Name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide a contact phone number.');
      return;
    }
    if (!dateOfBirth) {
      setError('Please provide your Date of Birth.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await registerProfile({
        firstName,
        lastName,
        phoneCountryCode,
        phone,
        district,
        dateOfBirth,
        nationality,
        role: user?.email === 'zaindueheney@gmail.com' ? 'admin' : role,
        organization,
      });
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Could not complete profile update.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#1e030a] rounded-2xl shadow-2xl border-2 border-[#d4af37] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#4d0718] via-[#6b0f24] to-[#380714] text-white flex items-center justify-between border-b border-[#d4af37]/60">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_ff7e619e.png"
              alt="Belize Alerts Logo"
              className="w-10 h-10 object-cover rounded-xl border border-[#d4af37]/60 shrink-0 shadow"
            />
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                {profile ? 'Update Belize Emergency Profile' : 'User Registration Required'}
              </h3>
              <p className="text-[11px] text-amber-200/80">
                {profile ? 'Official Citizen & Responder Details' : 'Registration required to access Belize Alerts'}
              </p>
            </div>
          </div>
          {profile ? (
            <button
              onClick={() => setShowRegisterModal(false)}
              className="p-1 rounded-full text-amber-300 hover:text-white hover:bg-[#380714] transition"
              title="Close Profile Editor"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signOut()}
              className="text-[11px] text-amber-300 hover:text-white px-2.5 py-1 rounded-lg bg-[#380714] border border-[#d4af37]/40 flex items-center gap-1 font-bold transition hover:bg-red-950"
              title="Cancel and Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-3.5">
          {!profile && (
            <div className="p-3 bg-[#2b0510] border border-[#d4af37]/50 rounded-xl text-xs text-amber-100 flex items-start gap-2.5 shadow">
              <Shield className="w-4 h-4 text-[#f3c853] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Complete Your Registration to Use Belize Alerts</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Application access is granted only after registration. Please provide your emergency contact details below.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                First Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                Last Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </div>

          {/* Date of Birth & Nationality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                Nationality (All Countries) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3" />
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.name} value={c.nationality}>
                      {c.flag} {c.nationality} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* District & Phone with Country Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                District / Region <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-red-500 absolute left-3 top-3" />
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400"
                >
                  {BELIZE_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} District
                    </option>
                  ))}
                  <option value="International / Other">
                    🌐 International / Non-Resident
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                Phone Number (All Countries) <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-1.5">
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className="w-28 px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400 shrink-0"
                >
                  {COUNTRIES.map((c) => (
                    <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                      {c.flag} {c.dialCode}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 610-1234"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-[11px] font-bold text-amber-200 mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              Role in Belize Emergency Network
            </label>
            <select
              value={role}
              disabled={user?.email === 'zaindueheney@gmail.com'}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-yellow-400 disabled:opacity-60"
            >
              <option value="citizen">Citizen Reporter (Public Safety)</option>
              <option value="responder">First Responder / Field Volunteer</option>
              <option value="dispatcher">District Dispatcher / EOC Officer</option>
              {user?.email === 'zaindueheney@gmail.com' && <option value="admin">System Administrator</option>}
            </select>
            {user?.email === 'zaindueheney@gmail.com' && (
              <p className="text-[10px] text-amber-300 font-semibold mt-1">
                ✓ Administrator account confirmed.
              </p>
            )}
          </div>

          {/* Organization */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              Affiliation / Agency / Brigade (Optional)
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. NEMO, Belize Police Dept, Fire Service, BERT Ambulance, Community"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            {profile && (
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Belize Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
