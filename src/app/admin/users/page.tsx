'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, CheckCircle, XCircle, Eye, Edit3, Trash2,
  Users, Shield, Building2, Download, ChevronLeft, ChevronRight,
  GraduationCap, Calendar, Phone, Mail, IdCard, AlertTriangle,
  RotateCcw, Sparkles, Check, X, ShieldAlert, CreditCard, Save,
  Loader2, RefreshCw, Trophy, MapPin
} from 'lucide-react';
import { useRequireRole } from '@/context/AuthContext';
import { isValidEmail, isValidStudentName, MAX_STUDENT_NAME_LENGTH } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  college_name: string;
  is_amrita_student: boolean;
  roll_number: string;
  department: string;
  year_of_study: string;
  city: string;
  id_card_url: string;
  verification_status: string;
  verification_note: string;
  platform_fee_paid: boolean;
  pass_type: string;
  qr_token: string;
  email_verified: boolean;
  confirmed_registrations: string;
  created_at: string;
  club_name: string;
}

interface UserStats {
  total: number;
  amrita_count: number;
  external_count: number;
  pending_count: number;
  verified_count: number;
}

export interface StudentRegistrationRecord {
  registration_id: string;
  registration_status: string;
  payment_status: string;
  amount_paid: number;
  team_name: string | null;
  team_members: any;
  registered_at: string;
  confirmed_at: string | null;
  event_id: string;
  event_name: string;
  event_code: string;
  category: string;
  venue: string;
  date_start: string;
  start_time: string;
  end_time: string;
  day_number: number;
  event_fee: number;
  poster_url: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  club_color: string;
  attendance_id: string | null;
  checked_in_at: string | null;
  attendance_status: string | null;
}

export interface StudentPaymentRecord {
  payment_id: string;
  cf_order_id?: string;
  cf_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  notes: any;
  created_at: string;
}

export interface StudentFullProfile {
  user: User & {
    verified_at?: string;
    verified_by_name?: string;
    verified_by_email?: string;
  };
  registrations: StudentRegistrationRecord[];
  payments: StudentPaymentRecord[];
  attendance: any[];
}

const BRANCHES = ['CSE', 'CSE-AIE', 'AIDS', 'CCE', 'ECE', 'QUANTUM'];
const YEARS = ['1', '2', '3', '4'];
const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'student', label: 'Students' },
  { value: 'club_admin', label: 'Club Admins' },
  { value: 'super_admin', label: 'Super Admins' },
];
const STUDENT_TYPES = [
  { value: '', label: 'All Institutions' },
  { value: 'amrita', label: 'Amrita Amaravati' },
  { value: 'other', label: 'External Colleges' },
];
const VER_STATUS = [
  { value: '', label: 'All KYC Status' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'rejected', label: 'Rejected' },
];
const FEE_STATUS = [
  { value: '', label: 'All Pass Status' },
  { value: 'true', label: 'Active Pass (Paid/Free)' },
  { value: 'false', label: 'Unpaid / Inactive' },
];

function formatDateTimeIST(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return dateStr;
  }
}

export default function AdminUsersPage() {
  const { user: me, loading: authLoading } = useRequireRole('super_admin');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    amrita_count: 0,
    external_count: 0,
    pending_count: 0,
    verified_count: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [verFilter, setVerFilter] = useState('');
  const [feeFilter, setFeeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Details
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [fullDetail, setFullDetail] = useState<StudentFullProfile | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [zoomedIdCard, setZoomedIdCard] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    full_name: string;
    email: string;
    phone: string;
    college_name: string;
    is_amrita_student: boolean;
    roll_number: string;
    department: string;
    year_of_study: string;
    city: string;
    verification_status: string;
    platform_fee_paid: boolean;
    role: string;
  }>({
    full_name: '',
    email: '',
    phone: '',
    college_name: '',
    is_amrita_student: true,
    roll_number: '',
    department: '',
    year_of_study: '',
    city: '',
    verification_status: 'pending',
    platform_fee_paid: false,
    role: 'student',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (typeFilter) params.set('student_type', typeFilter);
    if (deptFilter) params.set('department', deptFilter);
    if (yearFilter) params.set('year_of_study', yearFilter);
    if (verFilter) params.set('verification_status', verFilter);
    if (feeFilter) params.set('platform_fee_paid', feeFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data && data.success && data.data) {
        setUsers(Array.isArray(data.data.users) ? data.data.users : []);
        setTotal(data.data.pagination?.total ?? 0);
        setTotalPages(data.data.pagination?.totalPages || 1);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, typeFilter, deptFilter, yearFilter, verFilter, feeFilter, page]);

  useEffect(() => {
    if (me) {
      fetchUsers();
    }
  }, [fetchUsers, me]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setRoleFilter('');
    setTypeFilter('');
    setDeptFilter('');
    setYearFilter('');
    setVerFilter('');
    setFeeFilter('');
    setPage(1);
  };

  const openViewModal = async (u: User) => {
    setViewUser(u);
    setFullDetail(null);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setFullDetail(data.data);
      }
    } catch (err) {
      console.error('Failed to load full student details:', err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleVerify = async (userId: string, status: 'verified' | 'rejected', note?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Account ${status} successfully!`);
        // Immediately sync local state
        setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          verification_status: status,
          platform_fee_paid: status === 'verified' ? true : u.platform_fee_paid
        } : u));
        if (viewUser && viewUser.id === userId) {
          setViewUser(prev => prev ? {
            ...prev,
            verification_status: status,
            platform_fee_paid: status === 'verified' ? true : prev.platform_fee_paid
          } : null);
        }
        if (fullDetail && fullDetail.user.id === userId) {
          setFullDetail(prev => prev ? {
            ...prev,
            user: {
              ...prev.user,
              verification_status: status,
              platform_fee_paid: status === 'verified' ? true : prev.user.platform_fee_paid,
              verified_at: new Date().toISOString(),
              verified_by_name: me?.full_name || 'Super Admin',
            }
          } : null);
        }
      }
    } catch (e) {
      console.error('Verification error:', e);
    } finally {
      setActionLoading(false);
      fetchUsers();
    }
  };

  const openEditModal = (u: User) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      college_name: u.college_name || (u.is_amrita_student ? 'Amrita Vishwa Vidyapeetham, Amaravati' : ''),
      is_amrita_student: Boolean(u.is_amrita_student),
      roll_number: u.roll_number || '',
      department: u.department || '',
      year_of_study: u.year_of_study || '',
      city: u.city || '',
      verification_status: u.verification_status || 'pending',
      platform_fee_paid: Boolean(u.platform_fee_paid),
      role: u.role || 'student',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    const nameCheck = isValidStudentName(editForm.full_name);
    if (!nameCheck.valid) {
      alert(nameCheck.error || 'Student name is invalid');
      return;
    }

    if (!isValidEmail(editForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Student profile updated successfully!');
        setEditUser(null);
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (e) {
      console.error('Update error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const deletedId = deleteConfirmUser.id;
    const isAmrita = deleteConfirmUser.is_amrita_student;
    const vStatus = deleteConfirmUser.verification_status;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deletedId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Student account deleted successfully.');
        setDeleteConfirmUser(null);
        setUsers(prev => prev.filter(u => u.id !== deletedId));
        setTotal(t => Math.max(0, t - 1));
        setStats(s => ({
          ...s,
          total: Math.max(0, s.total - 1),
          amrita_count: isAmrita ? Math.max(0, s.amrita_count - 1) : s.amrita_count,
          external_count: !isAmrita ? Math.max(0, s.external_count - 1) : s.external_count,
          pending_count: vStatus === 'pending' ? Math.max(0, s.pending_count - 1) : s.pending_count,
          verified_count: vStatus === 'verified' ? Math.max(0, s.verified_count - 1) : s.verified_count,
        }));
        fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Role', 'Institution', 'Amrita Student',
      'Roll Number', 'Branch / Department', 'Year of Study', 'City',
      'KYC Verification', 'Pass Status', 'Enrolled Events', 'Registered At'
    ];
    const rows = users.map(u => [
      u.full_name || '',
      u.email || '',
      u.phone || '',
      u.role || '',
      u.college_name || (u.is_amrita_student ? 'Amrita Vishwa Vidyapeetham' : ''),
      u.is_amrita_student ? 'Yes' : 'No',
      u.roll_number || '',
      u.department || '',
      u.year_of_study ? `Year ${u.year_of_study}` : '',
      u.city || '',
      u.verification_status || '',
      u.platform_fee_paid ? 'Active Pass' : 'Unpaid',
      u.confirmed_registrations || '0',
      u.created_at ? new Date(u.created_at).toLocaleString() : '',
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parinaam-students-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05030a] pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!me) return null;

  const hasActiveFilters = Boolean(
    search || roleFilter || typeFilter || deptFilter || yearFilter || verFilter || feeFilter
  );

  return (
    <div className="min-h-screen bg-[#05030a] pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2"
            >
              <CheckCircle size={15} /> {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/superadmin"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 mb-1.5 transition-colors"
            >
              <ChevronLeft size={14} /> Back to Command HQ
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Student Records & Verification HQ
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Review ID cards, filter branch & year-wise, approve passes, and manage profiles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-900/30"
            >
              <Download size={14} /> Export Filtered CSV ({total})
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-xs font-medium">Total Registered</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <p className="text-purple-300 text-xs font-medium">Amrita Students</p>
            <p className="text-2xl font-bold text-purple-200 mt-1">{stats.amrita_count}</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-cyan-300 text-xs font-medium">External Students</p>
            <p className="text-2xl font-bold text-cyan-200 mt-1">{stats.external_count}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-amber-300 text-xs font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-200 mt-1">{stats.pending_count}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-emerald-300 text-xs font-medium">Verified Passes</p>
            <p className="text-2xl font-bold text-emerald-200 mt-1">{stats.verified_count}</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by student name, email, roll number, phone..."
                className="w-full bg-[#0e0b1a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex gap-2 flex-wrap">
              {/* Institution */}
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                className="bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {STUDENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {/* Branch */}
              <select
                value={deptFilter}
                onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                className="bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Branches</option>
                {BRANCHES.map(b => (
                  <option key={b} value={b}>Branch: {b}</option>
                ))}
              </select>

              {/* Year */}
              <select
                value={yearFilter}
                onChange={e => { setYearFilter(e.target.value); setPage(1); }}
                className="bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Years</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>

              {/* KYC Status */}
              <select
                value={verFilter}
                onChange={e => { setVerFilter(e.target.value); setPage(1); }}
                className="bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {VER_STATUS.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>

              {/* Pass Status */}
              <select
                value={feeFilter}
                onChange={e => { setFeeFilter(e.target.value); setPage(1); }}
                className="bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {FEE_STATUS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              {/* Role */}
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-colors"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
            <span>Showing {users.length} of {total} records</span>
            {hasActiveFilters && (
              <span className="text-purple-300 font-medium">Filtered active view</span>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Student / User</th>
                  <th className="px-4 py-3.5">Campus & Roll No</th>
                  <th className="px-4 py-3.5">Academic</th>
                  <th className="px-4 py-3.5">KYC Status</th>
                  <th className="px-4 py-3.5">Pass Status</th>
                  <th className="px-4 py-3.5 text-center">Events</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skel-${i}`}>
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-5 bg-white/5 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400">
                      <Users size={32} className="mx-auto text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-300">No student records found</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting the filters or modifying your search query.</p>
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition-colors group">
                      {/* Name & Contact */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {((u.full_name || u.email || 'S').charAt(0)).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{u.full_name || 'Anonymous Student'}</p>
                            <p className="text-slate-400 text-[11px] truncate">{u.email}</p>
                            {u.phone && <p className="text-slate-500 text-[10px] font-mono">{u.phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Campus & Roll No */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          {u.is_amrita_student ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                              Amrita Amaravati
                            </span>
                          ) : (
                            <p className="text-slate-300 font-medium text-xs truncate max-w-[160px]">
                              {u.college_name || 'External College'}
                            </p>
                          )}
                          {u.roll_number && (
                            <p className="font-mono text-[11px] text-slate-400">{u.roll_number}</p>
                          )}
                        </div>
                      </td>

                      {/* Academic (Branch & Year) */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {u.department ? (
                            <span className="text-[11px] font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-200">
                              {u.department}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600">—</span>
                          )}
                          {u.year_of_study && (
                            <span className="text-[11px] font-medium bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-300">
                              Yr {u.year_of_study}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* KYC Status */}
                      <td className="px-4 py-3.5">
                        {u.verification_status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : u.verification_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <XCircle size={12} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={12} /> Pending Approval
                          </span>
                        )}
                      </td>

                      {/* Pass Status */}
                      <td className="px-4 py-3.5">
                        {u.verification_status !== 'verified' ? (
                          <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            Pending Approval
                          </span>
                        ) : u.is_amrita_student ? (
                          <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                            Free Amrita Pass
                          </span>
                        ) : u.platform_fee_paid ? (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Paid Pass
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Unpaid</span>
                        )}
                      </td>

                      {/* Events Enrolled */}
                      <td className="px-4 py-3.5 text-center font-semibold text-white">
                        {u.confirmed_registrations || '0'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openViewModal(u)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-purple-200 border border-white/10 transition-colors"
                            title="View Full Student Data & Events"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-600/30 text-slate-300 hover:text-blue-200 border border-white/10 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit3 size={13} />
                          </button>

                          {u.verification_status === 'pending' && (
                            <button
                              onClick={() => handleVerify(u.id, 'verified')}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                              title="Approve Account"
                            >
                              <Check size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="px-4 py-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-400">
                Showing <strong className="text-white">{Math.min(total, (page - 1) * 30 + 1)}</strong> to{' '}
                <strong className="text-white">{Math.min(total, page * 30)}</strong> of{' '}
                <strong className="text-white">{total}</strong> students
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 disabled:opacity-30 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:bg-transparent border border-white/10 transition-colors"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-xs text-slate-300 px-2 font-mono">
                  Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 disabled:opacity-30 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:bg-transparent border border-white/10 transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1. COMPREHENSIVE VIEW STUDENT PROFILE & EVENTS MODAL */}
        <AnimatePresence>
          {viewUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-3xl bg-[#0c071a] border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-purple-900/30">
                      {((viewUser.full_name || viewUser.email || 'S').charAt(0)).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-lg leading-tight">
                          {viewUser.full_name || 'Student Profile'}
                        </h3>
                        {viewUser.is_amrita_student ? (
                          <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded-md">
                            Amrita Student
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 rounded-md">
                            External College
                          </span>
                        )}
                        {viewUser.verification_status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <CheckCircle size={11} /> Verified Account
                          </span>
                        ) : viewUser.verification_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
                            <XCircle size={11} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Pending Review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{viewUser.email} {viewUser.phone && `· 📞 ${viewUser.phone}`}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setViewUser(null); setFullDetail(null); }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                  {viewLoading ? (
                    <div className="py-16 text-center text-slate-400 space-y-3">
                      <Loader2 size={32} className="animate-spin mx-auto text-purple-400" />
                      <p className="text-xs font-semibold">Loading complete student profile, registered events & audit log...</p>
                    </div>
                  ) : (
                    <>
                      {/* 1. Academic & Identity Matrix */}
                      <div>
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <GraduationCap size={14} /> Student Academic & Contact Details
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-white/[0.03] p-4 rounded-xl border border-white/10">
                          <div>
                            <p className="text-slate-500 text-[11px]">College / University</p>
                            <p className="font-semibold text-slate-200 mt-0.5">
                              {viewUser.is_amrita_student ? 'Amrita Vishwa Vidyapeetham, Amaravati' : (viewUser.college_name || 'External College')}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[11px]">Roll / Student Number</p>
                            <p className="font-mono font-bold text-purple-300 mt-0.5">
                              {viewUser.roll_number || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[11px]">Branch / Department</p>
                            <p className="font-semibold text-slate-200 mt-0.5">
                              {viewUser.department || 'Not Specified'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[11px]">Year of Study</p>
                            <p className="font-semibold text-slate-200 mt-0.5">
                              {viewUser.year_of_study ? `Year ${viewUser.year_of_study}` : 'Not Specified'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[11px]">City / Location</p>
                            <p className="text-slate-200 mt-0.5">{viewUser.city || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[11px]">Account Created (IST)</p>
                            <p className="font-mono text-slate-300 mt-0.5">{formatDateTimeIST(viewUser.created_at)}</p>
                          </div>
                          {fullDetail?.user.verified_at && (
                            <div>
                              <p className="text-slate-500 text-[11px]">Verified Timestamp (IST)</p>
                              <p className="font-mono text-emerald-400 font-semibold mt-0.5">
                                {formatDateTimeIST(fullDetail.user.verified_at)}
                              </p>
                            </div>
                          )}
                          {fullDetail?.user.verified_by_name && (
                            <div>
                              <p className="text-slate-500 text-[11px]">Verified By</p>
                              <p className="text-slate-200 font-medium mt-0.5">
                                {fullDetail.user.verified_by_name}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500 text-[11px]">Pass Status</p>
                            <p className="mt-0.5">
                              {viewUser.verification_status !== 'verified' ? (
                                <span className="font-semibold text-amber-400">Pending Approval</span>
                              ) : viewUser.is_amrita_student ? (
                                <span className="font-semibold text-purple-300">Free Amrita Pass</span>
                              ) : viewUser.platform_fee_paid ? (
                                <span className="font-semibold text-emerald-400">Paid Pass Active</span>
                              ) : (
                                <span className="font-semibold text-red-400">Unpaid</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 2. Uploaded ID Card (if available) */}
                      {viewUser.id_card_url && (
                        <div>
                          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <IdCard size={14} /> Uploaded College ID Card
                          </h4>
                          <div className="border border-white/10 rounded-xl p-3 bg-white/[0.02]">
                            <img
                              src={viewUser.id_card_url}
                              alt="Uploaded College ID"
                              onClick={() => setZoomedIdCard(viewUser.id_card_url)}
                              className="w-full max-h-56 object-contain rounded-lg bg-black/60 cursor-pointer hover:opacity-95 transition-opacity"
                            />
                            <p className="text-[10px] text-slate-500 mt-1.5 text-center">Click image to inspect full-size</p>
                          </div>
                        </div>
                      )}

                      {/* 3. Registered Events Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy size={14} /> Registered Events & Activity Timeline ({fullDetail?.registrations?.length || 0})
                          </h4>
                        </div>

                        {(!fullDetail || !fullDetail.registrations || fullDetail.registrations.length === 0) ? (
                          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 text-center text-slate-500 text-xs">
                            <Calendar size={24} className="mx-auto mb-1.5 text-slate-600" />
                            <p className="text-slate-400 font-medium">No event registrations found for this student.</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {fullDetail.registrations.map(reg => (
                              <div
                                key={reg.registration_id}
                                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-xl p-3.5 transition-colors space-y-2"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-white text-sm">{reg.event_name}</span>
                                      <span
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-white shadow-sm"
                                        style={{ backgroundColor: reg.club_color || '#9333ea' }}
                                      >
                                        {reg.club_name}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                        {reg.category}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                                      {reg.venue && <span>📍 {reg.venue}</span>}
                                      {reg.date_start && (
                                        <span>📅 {new Date(reg.date_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      )}
                                      {reg.start_time && <span>⏰ {reg.start_time}</span>}
                                      {reg.team_name && <span className="text-purple-300 font-medium">👥 Team: {reg.team_name}</span>}
                                    </div>
                                  </div>

                                  {/* Exact Registered Timestamp */}
                                  <div className="sm:text-right shrink-0">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Registered At (IST)</p>
                                    <p className="font-mono text-xs text-purple-200 font-bold mt-0.5">
                                      {formatDateTimeIST(reg.registered_at)}
                                    </p>
                                  </div>
                                </div>

                                {/* Status & Attendance Bar */}
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      reg.registration_status === 'CONFIRMED'
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    }`}>
                                      {reg.registration_status}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                      reg.payment_status === 'paid'
                                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                        : 'bg-white/5 text-slate-400'
                                    }`}>
                                      {reg.amount_paid > 0 ? `₹${reg.amount_paid} Paid` : 'Free Registration'}
                                    </span>
                                  </div>

                                  {/* Attendance Check-in Info */}
                                  <div>
                                    {reg.checked_in_at ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                        <CheckCircle size={12} /> Checked-in {formatDateTimeIST(reg.checked_in_at)}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-500 font-mono">
                                        ⏳ Not Checked In
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 4. Payment History (if any) */}
                      {fullDetail?.payments && fullDetail.payments.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CreditCard size={14} /> Cashfree Payments Audit ({fullDetail.payments.length})
                          </h4>
                          <div className="space-y-2">
                            {fullDetail.payments.map(p => (
                              <div key={p.payment_id} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-mono text-white font-semibold">{p.cf_payment_id || p.cf_order_id || p.razorpay_payment_id || p.razorpay_order_id || 'Direct Payment'}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatDateTimeIST(p.created_at)}</p>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-emerald-400 font-mono text-sm">₹{Math.round(Number(p.amount || 0) / 100)}</span>
                                  <p className="text-[10px] text-emerald-300 font-semibold uppercase">{p.status}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Modal Footer / Verification Action */}
                <div className="p-4 border-t border-white/10 bg-[#080413] flex items-center justify-between gap-3">
                  {viewUser.verification_status === 'verified' ? (
                    <div className="w-full flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                        <CheckCircle size={16} />
                        <span>✓ Verified Student Account & Pass Active</span>
                      </div>
                      <span className="text-[11px] text-emerald-300 font-mono">
                        {fullDetail?.user.verified_at ? `Verified: ${formatDateTimeIST(fullDetail.user.verified_at)}` : 'Approved'}
                      </span>
                    </div>
                  ) : viewUser.verification_status === 'rejected' ? (
                    <div className="w-full flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                        <XCircle size={16} />
                        <span>Student Account Rejected</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-3">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleVerify(viewUser.id, 'verified')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/30"
                      >
                        <CheckCircle size={14} /> Approve & Verify Pass
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleVerify(viewUser.id, 'rejected')}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Full Image Zoom Modal */}
        <AnimatePresence>
          {zoomedIdCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <div className="relative max-w-4xl w-full">
                <button
                  onClick={() => setZoomedIdCard(null)}
                  className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 bg-white/10 rounded-full"
                >
                  <X size={20} />
                </button>
                <img
                  src={zoomedIdCard}
                  alt="Zoomed ID Card"
                  className="w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl bg-black"
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. EDIT PROFILE MODAL */}
        <AnimatePresence>
          {editUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#0e071c] border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl relative"
              >
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Edit3 size={16} className="text-purple-400" /> Edit Student Profile
                  </h3>
                  <button
                    onClick={() => setEditUser(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">
                        Full Name (max {MAX_STUDENT_NAME_LENGTH} chars)
                      </label>
                      <input
                        type="text"
                        maxLength={MAX_STUDENT_NAME_LENGTH}
                        value={editForm.full_name}
                        onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value.slice(0, MAX_STUDENT_NAME_LENGTH) }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Phone (10 digits)</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={editForm.roll_number}
                        onChange={e => setEditForm(f => ({ ...f, roll_number: e.target.value }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Branch</label>
                      <select
                        value={editForm.department}
                        onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Branch</option>
                        {BRANCHES.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Year of Study</label>
                      <select
                        value={editForm.year_of_study}
                        onChange={e => setEditForm(f => ({ ...f, year_of_study: e.target.value }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Year</option>
                        {YEARS.map(y => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">KYC Status</label>
                      <select
                        value={editForm.verification_status}
                        onChange={e => setEditForm(f => ({ ...f, verification_status: e.target.value }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="pending">Pending Approval</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-1">Pass / Payment</label>
                      <select
                        value={editForm.platform_fee_paid ? 'true' : 'false'}
                        onChange={e => setEditForm(f => ({ ...f, platform_fee_paid: e.target.value === 'true' }))}
                        className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="true">Active Pass (Paid/Free)</option>
                        <option value="false">Unpaid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">College Name</label>
                    <input
                      type="text"
                      value={editForm.college_name}
                      onChange={e => setEditForm(f => ({ ...f, college_name: e.target.value }))}
                      className="w-full bg-[#05030a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-purple-900/40"
                    >
                      {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 3. DELETE CONFIRMATION MODAL */}
        <AnimatePresence>
          {deleteConfirmUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#0e071c] border border-red-500/30 rounded-2xl p-6 shadow-2xl relative text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
                  <Trash2 className="text-red-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Student Account?</h3>
                <p className="text-xs text-slate-300">
                  Are you sure you want to delete <strong>{deleteConfirmUser.full_name || deleteConfirmUser.email}</strong>? This action will permanently remove their pass, event registrations, and attendance history.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setDeleteConfirmUser(null)}
                    className="flex-1 py-2.5 rounded-xl text-xs text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={handleDeleteUser}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Deleting...' : 'Yes, Delete Account'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
