import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Building,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  PhoneCall,
  UserCheck,
  Filter,
  Trash2,
  AlertTriangle,
  X,
  ArrowUpDown,
  MessageSquare
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth, isAuthorizedAdminEmail } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { UserProfile, BelizeDistrict, UserRole, EmergencyIncident } from '../types';
import { BELIZE_DISTRICTS } from '../data/belizeGeo';
import { createWhatsAppUrl, WhatsAppTemplates } from '../utils/whatsapp';

export type UserSortOption =
  | 'first_name_asc'
  | 'last_name_asc'
  | 'first_name_desc'
  | 'last_name_desc'
  | 'newest'
  | 'oldest';

interface AdminUserDirectoryProps {
  initialSearch?: string;
  incidents?: EmergencyIncident[];
  onSelectUserToVerify?: (user: UserProfile) => void;
  className?: string;
}

export const AdminUserDirectory: React.FC<AdminUserDirectoryProps> = ({
  initialSearch = '',
  incidents = [],
  onSelectUserToVerify,
  className = '',
}) => {
  const { user } = useAuth();
  const { openChatWithCitizen } = useChat();
  const isAdmin = isAuthorizedAdminEmail(user?.email);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedDistrict, setSelectedDistrict] = useState<BelizeDistrict | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<UserSortOption>('first_name_asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Verification Calling Assistant Drawer
  const [verifyingUser, setVerifyingUser] = useState<UserProfile | null>(null);

  // User Account Deletion State (Admin Only)
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (!targetUser.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', targetUser.id));
      setDeleteSuccessMessage(`✓ User account "${targetUser.displayName || targetUser.email}" permanently removed from Belize Alerts.`);
      setDeletingUser(null);
      setTimeout(() => setDeleteSuccessMessage(null), 4500);
    } catch (err: any) {
      alert(`Could not delete user account: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Sync initialSearch if prop changes
  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  // Load registered users from Firestore (Admin only)
  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const path = 'users';
    try {
      const q = query(collection(db, path));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: UserProfile[] = [];
          snapshot.forEach((d) => {
            list.push({ ...d.data(), id: d.id } as UserProfile);
          });
          // Sort by registration date descending
          list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          setUsers(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Admin users directory listener error:', err);
          setError('Could not load user records. Please verify administrator credentials.');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach users listener:', err);
      setError(err?.message || 'Failed to query users collection.');
      setLoading(false);
    }
  }, [isAdmin]);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered and sorted users list
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      // District filter
      if (selectedDistrict !== 'all' && u.district !== selectedDistrict) {
        return false;
      }
      // Role filter
      if (selectedRole !== 'all' && u.role !== selectedRole) {
        return false;
      }
      // Search term (name, email, phone, organization)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const nameMatch = (u.displayName || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase().includes(term);
        const emailMatch = (u.email || '').toLowerCase().includes(term);
        const phoneMatch = (u.fullPhone || u.phone || '').toLowerCase().includes(term);
        const orgMatch = (u.organization || '').toLowerCase().includes(term);
        const natMatch = (u.nationality || '').toLowerCase().includes(term);
        if (!nameMatch && !emailMatch && !phoneMatch && !orgMatch && !natMatch) {
          return false;
        }
      }
      return true;
    });

    // Alphabetical and date sorting
    list.sort((a, b) => {
      const firstA = (a.firstName || a.displayName?.split(' ')[0] || '').toLowerCase().trim();
      const firstB = (b.firstName || b.displayName?.split(' ')[0] || '').toLowerCase().trim();
      const lastA = (a.lastName || a.displayName?.split(' ').slice(1).join(' ') || '').toLowerCase().trim();
      const lastB = (b.lastName || b.displayName?.split(' ').slice(1).join(' ') || '').toLowerCase().trim();

      switch (sortBy) {
        case 'first_name_asc': {
          const cmp = firstA.localeCompare(firstB);
          if (cmp !== 0) return cmp;
          return lastA.localeCompare(lastB);
        }
        case 'first_name_desc': {
          const cmp = firstB.localeCompare(firstA);
          if (cmp !== 0) return cmp;
          return lastB.localeCompare(lastA);
        }
        case 'last_name_asc': {
          const cmp = lastA.localeCompare(lastB);
          if (cmp !== 0) return cmp;
          return firstA.localeCompare(firstB);
        }
        case 'last_name_desc': {
          const cmp = lastB.localeCompare(lastA);
          if (cmp !== 0) return cmp;
          return firstB.localeCompare(firstA);
        }
        case 'oldest': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        }
        case 'newest':
        default: {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        }
      }
    });

    return list;
  }, [users, selectedDistrict, selectedRole, searchTerm, sortBy]);

  // Calculate incident count per user
  const getUserIncidentCount = (userId?: string, userEmail?: string): number => {
    if (!userId && !userEmail) return 0;
    return incidents.filter(
      (inc) => inc.reporterId === userId || (userEmail && inc.reporterPhone?.includes(userEmail))
    ).length;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Account Deletion Success Notification */}
      {deleteSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{deleteSuccessMessage}</span>
        </div>
      )}

      {/* Control Ribbon: Search, Filter, and Live Stats */}
      <div className="bg-[#180308] p-3 sm:p-4 rounded-xl border border-[#d4af37]/40 shadow-inner flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-300/70" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search citizen by name, phone (+501), email, or district..."
            className="w-full bg-[#28050e] border border-[#841c34] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:border-[#d4af37]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* District Filter Dropdown */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as BelizeDistrict | 'all')}
            className="bg-[#28050e] border border-[#841c34] rounded-xl px-2.5 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">📍 All Districts ({users.length})</option>
            {BELIZE_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Role Filter Dropdown */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
            className="bg-[#28050e] border border-[#841c34] rounded-xl px-2.5 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">👥 All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="responder">First Responders</option>
            <option value="dispatcher">Dispatchers</option>
            <option value="admin">Administrators</option>
          </select>

          {/* Alphabetical Order & Date Sorting Dropdown */}
          <div className="flex items-center gap-1 bg-[#28050e] border border-[#841c34] rounded-xl px-2 py-0.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as UserSortOption)}
              className="bg-transparent py-1.5 text-xs text-amber-200 font-bold focus:outline-none cursor-pointer"
              title="Sort Citizens Directory"
            >
              <option value="first_name_asc" className="bg-[#1c040a] text-white">🔤 Alphabetical: First Name (A → Z)</option>
              <option value="last_name_asc" className="bg-[#1c040a] text-white">🔤 Alphabetical: Last Name (A → Z)</option>
              <option value="first_name_desc" className="bg-[#1c040a] text-white">🔤 Alphabetical: First Name (Z → A)</option>
              <option value="last_name_desc" className="bg-[#1c040a] text-white">🔤 Alphabetical: Last Name (Z → A)</option>
              <option value="newest" className="bg-[#1c040a] text-white">⏱️ Registration: Newest First</option>
              <option value="oldest" className="bg-[#1c040a] text-white">⏱️ Registration: Oldest First</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedDistrict !== 'all' || selectedRole !== 'all' || sortBy !== 'first_name_asc') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDistrict('all');
                setSelectedRole('all');
                setSortBy('first_name_asc');
              }}
              className="text-xs text-red-400 hover:text-red-300 font-bold underline px-1"
            >
              Reset
            </button>
          )}

          <div className="text-[11px] font-mono text-[#f3c853] font-bold bg-[#28050e] px-2.5 py-1.5 rounded-lg border border-[#841c34]">
            {filteredUsers.length} Users Listed
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="bg-[#180308] p-8 rounded-xl border border-[#841c34] text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-300">Querying registered Belize citizen & responder directory...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-950/80 p-4 rounded-xl border border-red-500/60 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Grid */}
      {!loading && !error && filteredUsers.length === 0 && (
        <div className="bg-[#1a040a] p-8 rounded-xl border border-[#841c34] text-center space-y-2">
          <Users className="w-10 h-10 text-amber-400/40 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Registered Users Matching Filter</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm
              ? `No user found matching "${searchTerm}". Try searching by phone digits or district.`
              : 'As citizens and emergency personnel sign up via Belize Alerts, their verified contact details will be cataloged here for official dispatch call-backs.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUsers.map((item) => {
            const rawPhone = item.fullPhone || item.phone || '';
            const phoneForCall = rawPhone.replace(/\s+/g, '');
            const incidentCount = getUserIncidentCount(item.id, item.email);
            const fullName = item.displayName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Citizen User';

            return (
              <div
                key={item.id || item.email}
                className="bg-[#1e040b] rounded-xl border border-[#841c34] hover:border-[#d4af37]/80 shadow-lg p-3.5 flex flex-col justify-between space-y-3 transition group"
              >
                {/* Header: Name, Role Badge, District */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4d0718] to-[#1e030b] border border-[#d4af37] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white leading-tight group-hover:text-[#f3c853] transition">
                          {fullName}
                        </h4>
                        <span className="text-[10px] text-amber-200/80 flex items-center gap-1 mt-0.5 font-semibold">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          <span>{item.district || 'Belize'} District</span>
                        </span>
                      </div>
                    </div>

                    {/* Role Pill */}
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm ${
                        item.role === 'admin'
                          ? 'bg-amber-400 text-slate-950 border-yellow-200 font-extrabold'
                          : item.role === 'responder'
                          ? 'bg-blue-600 text-white border-blue-400'
                          : item.role === 'dispatcher'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                      }`}
                    >
                      {item.role || 'Citizen'}
                    </span>
                  </div>

                  {/* Organization if specified */}
                  {item.organization && (
                    <div className="mt-2 text-[10px] text-amber-300 flex items-center gap-1 bg-[#28050e] px-2 py-1 rounded-md border border-[#841c34]">
                      <Building className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{item.organization}</span>
                    </div>
                  )}
                </div>

                {/* Contact Card Box */}
                <div className="bg-[#120206] p-2.5 rounded-lg border border-[#841c34] space-y-1.5 text-xs">
                  {/* Phone Number with Click-to-Call & Copy */}
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-amber-200 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {rawPhone ? (
                        <a
                          href={`tel:${phoneForCall}`}
                          className="hover:underline font-bold text-white hover:text-emerald-300 transition"
                          title="Click to place phone call"
                        >
                          {rawPhone}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">No phone logged</span>
                      )}
                    </div>

                    {rawPhone && (
                      <button
                        onClick={() => handleCopy(rawPhone, `phone_${item.id}`)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                        title="Copy phone number"
                      >
                        {copiedId === `phone_${item.id}` ? (
                          <span className="text-[10px] text-emerald-400 font-bold">✓ Copied</span>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Email with Click-to-Mail & Copy */}
                  <div className="flex items-center justify-between gap-1 text-[11px] pt-1 border-t border-[#841c34]/60">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <a
                        href={`mailto:${item.email}`}
                        className="hover:underline truncate text-amber-100 hover:text-cyan-300 transition text-[11px]"
                        title="Click to compose email"
                      >
                        {item.email}
                      </a>
                    </div>

                    <button
                      onClick={() => handleCopy(item.email, `email_${item.id}`)}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
                      title="Copy email address"
                    >
                      {copiedId === `email_${item.id}` ? (
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Copied</span>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Nationality & DOB if provided */}
                  {(item.nationality || item.dateOfBirth) && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#841c34]/60 text-[10px] text-slate-400">
                      {item.nationality && (
                        <span className="flex items-center gap-1 truncate">
                          <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{item.nationality}</span>
                        </span>
                      )}
                      {item.dateOfBirth && (
                        <span className="flex items-center gap-1 shrink-0 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>DOB: {item.dateOfBirth}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Registered Timestamp */}
                  {item.createdAt && (
                    <div className="text-[9px] text-amber-200/50 pt-0.5">
                      Joined: {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Administrator Action Bar: WhatsApp, Call, Live Chat, Email, Checklist, Delete */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-[#841c34]/60">
                  {rawPhone ? (
                    <>
                      <a
                        href={createWhatsAppUrl(item.phoneCountryCode || '+501', rawPhone, WhatsAppTemplates.citizenVerification(fullName, item.district))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-emerald-950 transition hover:scale-105 active:scale-95"
                        title={`Send WhatsApp dispatch message to ${fullName} (${rawPhone})`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`tel:${phoneForCall}`}
                        className="py-1 px-2.5 rounded-lg bg-[#28050e] hover:bg-[#3d0817] text-emerald-300 font-bold text-[11px] border border-emerald-500/40 flex items-center gap-1 transition"
                        title="Call citizen directly on mobile/telephone"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </>
                  ) : (
                    <span className="py-1 px-2 rounded-lg bg-slate-900 text-slate-500 text-[10px] italic">
                      No Phone
                    </span>
                  )}

                  <button
                    onClick={() => openChatWithCitizen({ id: item.id || '', displayName: fullName, email: item.email, phone: rawPhone })}
                    className="py-1 px-2.5 rounded-lg bg-[#28050e] hover:bg-[#3d0817] text-amber-300 font-bold text-[11px] border border-[#d4af37]/60 flex items-center gap-1 transition hover:scale-105 active:scale-95"
                    title={`Open in-app live dispatch chat with ${fullName}`}
                  >
                    <MessageSquare className="w-3 h-3 text-[#d4af37]" />
                    <span>In-App Chat</span>
                  </button>

                  <a
                    href={`mailto:${item.email}?subject=${encodeURIComponent('Belize Alerts Verification Query - Central Emergency Dispatch')}`}
                    className="py-1 px-2 rounded-lg bg-[#28050e] hover:bg-[#3d0817] text-cyan-300 font-bold text-[11px] border border-[#841c34] flex items-center gap-1 transition"
                    title="Send verification inquiry email"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </a>

                  <button
                    onClick={() => setVerifyingUser(item)}
                    className="p-1 rounded-lg bg-[#28050e] hover:bg-[#3d0817] text-[#f3c853] hover:text-white border border-[#841c34] transition ml-auto"
                    title="Open Verification Checklist"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingUser(item)}
                    className="p-1 rounded-lg bg-red-950/60 hover:bg-red-800 text-red-300 hover:text-white border border-red-700/60 transition"
                    title={`Permanently delete user account for ${fullName}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Assistant Modal / Drawer */}
      {verifyingUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#1c040a] rounded-2xl border-2 border-[#d4af37] text-white max-w-lg w-full p-5 space-y-4 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#841c34]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Citizen Verification Assistant
                  </h3>
                  <p className="text-[11px] text-[#f3c853]">
                    Official dispatch protocol for authenticating reporter details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVerifyingUser(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Target Card */}
            <div className="bg-[#120206] p-3.5 rounded-xl border border-[#841c34] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-white">
                  {verifyingUser.displayName || `${verifyingUser.firstName || ''} ${verifyingUser.lastName || ''}`}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3d0817] text-amber-200 border border-[#841c34]">
                  {verifyingUser.district} District
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{verifyingUser.fullPhone || verifyingUser.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-300 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{verifyingUser.email}</span>
                </div>
              </div>
            </div>

            {/* Standard Verification Checklist */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                Telephone Verification Protocol:
              </h4>
              <ul className="space-y-1.5 text-slate-300 text-[11px] bg-[#120206] p-3 rounded-xl border border-[#841c34]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">1.</span>
                  <span>Confirm citizen's physical location matches coordinates on Belize map.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">2.</span>
                  <span>Ask for visual eyewitness details confirming attached incident photo authenticity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">3.</span>
                  <span>Remind submitter of legal declarations against false emergency calls under Belize law.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">4.</span>
                  <span>Confirm if first response units (Police, Fire, EMS) are needed immediately on scene.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#841c34] flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setVerifyingUser(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#28050e] transition"
              >
                Close Checklist
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {verifyingUser.phone && (
                  <a
                    href={createWhatsAppUrl(verifyingUser.phoneCountryCode || '+501', verifyingUser.phone, WhatsAppTemplates.citizenVerification(verifyingUser.displayName || 'Citizen', verifyingUser.district))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition hover:scale-105 active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Citizen</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const target = verifyingUser;
                    setVerifyingUser(null);
                    openChatWithCitizen({ id: target.id || '', displayName: target.displayName, email: target.email, phone: target.phone });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#28050e] hover:bg-[#3d0817] text-amber-300 font-bold text-xs border border-[#d4af37]/60 flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>In-App Dispatch Chat</span>
                </button>

                {verifyingUser.phone && (
                  <a
                    href={`tel:${(verifyingUser.fullPhone || verifyingUser.phone).replace(/\s+/g, '')}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/40 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Dial Phone</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Account Confirmation Dialog */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c040a] rounded-2xl border-2 border-red-500 text-white max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/40">
                <Trash2 className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-white">
                  Remove User Account
                </h4>
                <p className="text-xs text-red-300">
                  Permanently delete this user from Belize Alerts?
                </p>
              </div>
            </div>

            <div className="bg-[#120206] p-3 rounded-xl border border-red-500/30 text-xs space-y-1">
              <p className="font-bold text-white text-sm">
                {deletingUser.displayName || `${deletingUser.firstName || ''} ${deletingUser.lastName || ''}`}
              </p>
              <p className="text-slate-300 text-[11px] font-mono">{deletingUser.email}</p>
              {deletingUser.phone && (
                <p className="text-emerald-300 text-[11px] font-mono">{deletingUser.phone}</p>
              )}
              <div className="text-amber-400 text-[10px] pt-1 flex items-center gap-2">
                <span>District: <strong>{deletingUser.district}</strong></span>
                <span>•</span>
                <span>Role: <strong className="uppercase">{deletingUser.role}</strong></span>
              </div>
            </div>

            <div className="bg-red-950/60 p-2.5 rounded-lg border border-red-800 text-[11px] text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                This will delete the citizen's account profile and credentials. If they wish to report emergencies again, they must register as a new citizen.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#841c34]">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#28050e] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deletingUser)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Removing...' : 'Confirm Remove Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
