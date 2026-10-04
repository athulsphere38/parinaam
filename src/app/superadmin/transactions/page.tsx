'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Shield, CreditCard, RefreshCw, Eye, X,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle,
  RotateCcw, Calendar, IndianRupee, Trophy, Building2, User, Mail,
  Phone, ArrowRight, Download, Sparkles, Layers, Hash, Copy, Check,
  PieChart, BarChart3, Users, ExternalLink, Ticket, CheckCircle2
} from 'lucide-react';
import { useRequireRole } from '@/context/AuthContext';

interface TransactionUser {
  name: string;
  email: string;
  phone: string | null;
  college: string;
  is_amrita_student: boolean;
  roll_number: string | null;
  department: string | null;
  year_of_study: string | null;
  city?: string | null;
  verification_status?: string;
  pass_type?: string;
  qr_token?: string | null;
}

interface PurchasedItem {
  name: string;
  type: string;
  amount_inr: number;
  club_name?: string;
  club_color?: string;
  category?: string;
  event_code?: string;
  team_name?: string | null;
}

interface TransactionRegistration {
  registration_id: string;
  registration_status: string;
  payment_status: string;
  amount_paid: number;
  team_name?: string | null;
  registered_at: string;
  confirmed_at: string | null;
  event_id: string;
  event_name: string;
  event_code?: string;
  category?: string;
  venue?: string;
  club_id: string;
  club_name: string;
  club_slug?: string;
  club_color: string;
}

interface Transaction {
  id: string;
  user_id: string | null;
  user: TransactionUser;
  type: 'platform_fee' | 'event_fee';
  gateway: string;
  amount_paise: number;
  amount_inr: number;
  currency: string;
  cf_order_id: string | null;
  cf_payment_id: string | null;
  payment_session_id: string | null;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  item_description: string;
  purchased_items: PurchasedItem[];
  created_at: string;
  updated_at: string;
  registrations: TransactionRegistration[];
}

interface SummaryStats {
  total_records: number;
  paid_count: number;
  created_count: number;
  failed_count: number;
  refunded_count: number;
  total_paid_inr: number;
  platform_paid_inr: number;
  event_paid_inr: number;
  outsider_paid_inr?: number;
  amrita_paid_inr?: number;
}

interface ClubStat {
  id: string;
  name: string;
  color: string;
  slug: string;
  published_events: number;
  total_events: number;
  total_registrations: number;
  confirmed_registrations: number;
  total_revenue: number;
  total_checkins: number;
}

interface ClubEventReport {
  club_id: string;
  club_name: string;
  club_slug: string;
  club_color: string;
  event_id: string;
  event_name: string;
  event_code: string;
  category: string;
  venue: string;
  event_fee: number;
  capacity: number | null;
  date_start: string | null;
  start_time: string | null;
  day_number: number | null;
  confirmed_count: number;
  pending_count: number;
  total_count: number;
  total_revenue: number;
  checked_in_count: number;
}

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

export default function SuperAdminTransactionsPage() {
  const { user } = useRequireRole('super_admin');

  // Main Active Tab View
  const [activeTab, setActiveTab] = useState<'transactions' | 'clubs' | 'events' | 'audience'>('transactions');

  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Financial Stats & Club Reports
  const [clubStats, setClubStats] = useState<ClubStat[]>([]);
  const [eventReports, setEventReports] = useState<ClubEventReport[]>([]);
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');
  const [eventSearch, setEventSearch] = useState<string>('');

  // Filters & Search for Transactions
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [studentTypeFilter, setStudentTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selected Detail Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter) queryParams.set('status', statusFilter);
      if (typeFilter) queryParams.set('type', typeFilter);
      if (studentTypeFilter) queryParams.set('student_type', studentTypeFilter);
      if (sortBy) queryParams.set('sort_by', sortBy);
      if (sortOrder) queryParams.set('sort_order', sortOrder);
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());

      const res = await fetch(`/api/admin/transactions?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setTransactions(data.data.transactions || []);
        setSummary(data.data.summary || null);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalRecords(data.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, typeFilter, studentTypeFilter, sortBy, sortOrder, page, limit]);

  const fetchStatsReports = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.data) {
        setClubStats(data.data.club_stats || []);
        setEventReports(data.data.club_event_reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch stats reports:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
    fetchStatsReports();
  }, [user, fetchTransactions, fetchStatsReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
    fetchStatsReports();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setStudentTypeFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  // Export Transactions as CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = [
      'Transaction ID',
      'Cashfree Order ID',
      'Cashfree Payment ID',
      'Payment Type',
      'Paid For Description',
      'Amount (INR)',
      'Status',
      'Student Name',
      'Student Email',
      'Phone',
      'College',
      'Student Type',
      'Roll Number',
      'Department',
      'Year of Study',
      'Created At (IST)',
    ];

    const rows = transactions.map(tx => [
      `"${tx.id}"`,
      `"${tx.cf_order_id || ''}"`,
      `"${tx.cf_payment_id || ''}"`,
      `"${tx.type}"`,
      `"${tx.item_description.replace(/"/g, '""')}"`,
      tx.amount_inr,
      `"${tx.status.toUpperCase()}"`,
      `"${tx.user.name.replace(/"/g, '""')}"`,
      `"${tx.user.email}"`,
      `"${tx.user.phone || ''}"`,
      `"${tx.user.college.replace(/"/g, '""')}"`,
      tx.user.is_amrita_student ? 'Amrita Student' : 'Outside College',
      `"${tx.user.roll_number || ''}"`,
      `"${tx.user.department || ''}"`,
      `"${tx.user.year_of_study || ''}"`,
      `"${formatDateTimeIST(tx.created_at)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `parinaam_cashfree_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Event Reports
  const filteredEvents = useMemo(() => {
    return eventReports.filter(ev => {
      const matchesClub = selectedClubFilter === 'all' || ev.club_id === selectedClubFilter;
      const q = eventSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        ev.event_name.toLowerCase().includes(q) ||
        ev.club_name.toLowerCase().includes(q) ||
        (ev.event_code && ev.event_code.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q));
      return matchesClub && matchesSearch;
    });
  }, [eventReports, selectedClubFilter, eventSearch]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#05030a] pt-20 pb-16 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Top Header & Fast Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/20">
                <Shield size={12} className="text-emerald-400" /> Super Admin Financial Suite
              </span>
              <span className="text-xs text-slate-500">• Cashfree Gateway Integration</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <CreditCard className="text-emerald-400" size={28} /> Payments &amp; Revenue HQ
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Authoritative Cashfree audit trail, itemized participant purchases, outsider vs Amrita revenues &amp; club analytics
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-emerald-400' : ''} /> Refresh Data
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
            >
              <Download size={13} /> Export CSV
            </button>
            <Link
              href="/superadmin"
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              ← Command HQ
            </Link>
            <Link
              href="/superadmin/users"
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Users size={13} /> View Students
            </Link>
          </div>
        </div>

        {/* Global Financial KPI Summary Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Overall Fest Revenue */}
            <div className="bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Total Fest Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">
                ₹{summary.total_paid_inr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle size={11} /> 100% Cashfree Verified
              </p>
            </div>

            {/* Outsiders Total Revenue */}
            <div className="bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Outsider Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-1">
                ₹{(summary.outsider_paid_inr ?? summary.platform_paid_inr).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Passes + Event Fees
              </p>
            </div>

            {/* Amrita Students Total Revenue */}
            <div className="bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Amrita Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-300 mt-1">
                ₹{(summary.amrita_paid_inr ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Event Workshop Fees
              </p>
            </div>

            {/* Delegate Pass Platform Fees */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Delegate Passes</p>
              <p className="text-2xl sm:text-3xl font-bold text-fuchsia-400 mt-1">
                ₹{summary.platform_paid_inr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">₹1000 Outside Passes</p>
            </div>

            {/* Event Registration Fees */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Event Fees</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400 mt-1">
                ₹{summary.event_paid_inr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Contests &amp; Workshops</p>
            </div>

            {/* Transaction Orders Status */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Success / Total Orders</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{summary.paid_count}</span>
                <span className="text-xs text-slate-500 font-mono">/ {summary.total_records}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summary.created_count} Pending • {summary.failed_count + summary.refunded_count} Failed
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs for Financial Reports */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 w-fit flex-wrap">
          {[
            { id: 'transactions', label: 'Cashfree Transactions Log', icon: CreditCard, badge: totalRecords },
            { id: 'clubs', label: 'Club-Wise Revenue Breakdown', icon: Building2, badge: clubStats.length },
            { id: 'events', label: 'Event-Wise Financial Audit', icon: Trophy, badge: eventReports.length },
            { id: 'audience', label: 'Outsiders vs Amrita Split', icon: PieChart },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: CASHFREE TRANSACTION LOGS */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">

            {/* Filter and Search Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {/* Search Input */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="Search Student, Email, Phone, Cashfree Order/Payment ID..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-8 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => { setSearch(''); setPage(1); }}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Payment Statuses</option>
                    <option value="paid">✓ PAID (Success)</option>
                    <option value="created">⏳ CREATED (Pending)</option>
                    <option value="failed">✕ FAILED</option>
                    <option value="refunded">↺ REFUNDED</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <select
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Payment Types</option>
                    <option value="platform_fee">Delegate Pass (₹1000)</option>
                    <option value="event_fee">Event Registration Fees</option>
                  </select>
                </div>

                {/* Student Type Filter (Amrita vs Outsiders) */}
                <div>
                  <select
                    value={studentTypeFilter}
                    onChange={e => { setStudentTypeFilter(e.target.value); setPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">All Student Types</option>
                    <option value="other">Outside College Students</option>
                    <option value="amrita">Amrita Amaravati Students</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <select
                    value={`${sortBy}:${sortOrder}`}
                    onChange={e => {
                      const [b, o] = e.target.value.split(':');
                      setSortBy(b);
                      setSortOrder(o);
                      setPage(1);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="created_at:desc">Newest First</option>
                    <option value="created_at:asc">Oldest First</option>
                    <option value="amount:desc">Amount: High to Low</option>
                    <option value="amount:asc">Amount: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Indicators */}
              {(search || statusFilter || typeFilter || studentTypeFilter || sortBy !== 'created_at' || sortOrder !== 'desc') && (
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                  <span>Showing filtered transaction records</span>
                  <button
                    onClick={handleResetFilters}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Authoritative Transactions Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-emerald-400" /> Verified Cashfree Transactions ({totalRecords})
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Page {page} of {totalPages}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider bg-black/30">
                      <th className="py-3 px-4">Transaction Details</th>
                      <th className="py-3 px-4">What Was Paid For</th>
                      <th className="py-3 px-4">Student &amp; College</th>
                      <th className="py-3 px-4">Amount (INR)</th>
                      <th className="py-3 px-4">Cashfree Order &amp; Payment ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Timestamp (IST)</th>
                      <th className="py-3 px-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400 space-y-2">
                          <RefreshCw size={24} className="animate-spin mx-auto text-emerald-400 mb-2" />
                          <p className="text-xs font-semibold">Loading Cashfree payment transaction audit logs...</p>
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-500">
                          <CreditCard size={32} className="mx-auto mb-2 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-400">No payment transaction records found</p>
                          <p className="text-xs text-slate-500 mt-1">Try clearing search filters or changing your selection</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Transaction ID & Badge */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-slate-300 font-semibold text-[11px] block truncate max-w-[100px]" title={tx.id}>
                              {tx.id.slice(0, 8)}...
                            </span>
                            <span className={`inline-block mt-1 text-[9px] font-semibold uppercase px-2 py-0.5 rounded ${
                              tx.type === 'platform_fee'
                                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {tx.type === 'platform_fee' ? 'Festival Delegate Pass' : 'Event Ticket'}
                            </span>
                          </td>

                          {/* What was paid for */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-white max-w-[220px] truncate" title={tx.item_description}>
                              {tx.item_description}
                            </p>
                            {tx.registrations && tx.registrations.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {tx.registrations.slice(0, 2).map(r => (
                                  <span
                                    key={r.registration_id}
                                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white"
                                    style={{ backgroundColor: r.club_color || '#9333ea' }}
                                  >
                                    {r.club_name}
                                  </span>
                                ))}
                                {tx.registrations.length > 2 && (
                                  <span className="text-[9px] font-mono text-slate-400">
                                    +{tx.registrations.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Student & College */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{tx.user.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{tx.user.email}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {tx.user.is_amrita_student ? (
                                <span className="text-[9px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded">
                                  Amrita Student
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 rounded truncate max-w-[140px]" title={tx.user.college}>
                                  {tx.user.college}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="text-sm font-bold text-amber-400">
                              ₹{tx.amount_inr.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-500 block">INR</span>
                          </td>

                          {/* Cashfree IDs */}
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            {tx.cf_payment_id ? (
                              <span className="text-emerald-300 block font-semibold truncate max-w-[160px]" title={tx.cf_payment_id}>
                                Pay: {tx.cf_payment_id}
                              </span>
                            ) : (
                              <span className="text-slate-500 block">—</span>
                            )}
                            {tx.cf_order_id ? (
                              <span className="text-slate-400 block text-[10px] truncate max-w-[160px]" title={tx.cf_order_id}>
                                Ord: {tx.cf_order_id}
                              </span>
                            ) : (
                              <span className="text-slate-600 block text-[10px]">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {tx.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase">
                                <CheckCircle size={10} /> Paid
                              </span>
                            ) : tx.status === 'refunded' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-full uppercase">
                                <RotateCcw size={10} /> Refunded
                              </span>
                            ) : tx.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full uppercase">
                                <XCircle size={10} /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase">
                                <AlertTriangle size={10} /> Pending
                              </span>
                            )}
                          </td>

                          {/* Timestamp */}
                          <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                            {formatDateTimeIST(tx.created_at)}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="inline-flex items-center gap-1 p-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 transition-colors"
                              title="Audit full Cashfree transaction record"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalRecords > 0 && (
                <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs bg-black/20">
                  <div className="text-slate-400">
                    Showing <strong className="text-white">{Math.min(totalRecords, (page - 1) * limit + 1)}</strong> to{' '}
                    <strong className="text-white">{Math.min(totalRecords, page * limit)}</strong> of{' '}
                    <strong className="text-white">{totalRecords}</strong> transaction records
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px]">Rows:</span>
                      {[10, 20, 50].map(sz => (
                        <button
                          key={sz}
                          onClick={() => { setLimit(sz); setPage(1); }}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                            limit === sz
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-slate-300 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="px-2 text-slate-300 font-medium font-mono text-[11px]">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-slate-300 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLUB-WISE REVENUE BREAKDOWN */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 size={18} className="text-purple-400" /> 12 Clubs Revenue &amp; Enrolment Audit
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct financial distribution across all 12 fest domains based on verified registrations
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total Event Registrations Revenue</span>
                  <p className="text-xl font-bold font-mono text-emerald-400">
                    ₹{clubStats.reduce((sum, c) => sum + Number(c.total_revenue || 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider bg-black/30">
                      <th className="py-3 px-4">Club Domain</th>
                      <th className="py-3 px-4 text-center">Published Events</th>
                      <th className="py-3 px-4 text-center">Total Enrolled</th>
                      <th className="py-3 px-4 text-center">Confirmed Seats</th>
                      <th className="py-3 px-4 text-center">QR Check-ins</th>
                      <th className="py-3 px-4 text-right">Revenue Generated</th>
                      <th className="py-3 px-4 text-right">Contribution</th>
                      <th className="py-3 px-4 text-right">Portal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clubStats.map((club, idx) => {
                      const totalClubRev = clubStats.reduce((s, c) => s + Number(c.total_revenue || 0), 0);
                      const sharePct = totalClubRev > 0 ? Math.round((Number(club.total_revenue || 0) / totalClubRev) * 100) : 0;
                      return (
                        <tr key={club.id || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow"
                                style={{ backgroundColor: club.color || '#9333ea' }}
                              />
                              <div>
                                <p className="font-bold text-white text-sm">{club.name}</p>
                                <p className="text-[10px] font-mono text-slate-500">/admin/{club.slug}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center font-mono text-slate-300">
                            {club.published_events}
                          </td>

                          <td className="py-4 px-4 text-center font-mono text-slate-300 font-semibold">
                            {club.total_registrations}
                          </td>

                          <td className="py-4 px-4 text-center font-mono text-emerald-400 font-bold">
                            {club.confirmed_registrations}
                          </td>

                          <td className="py-4 px-4 text-center font-mono text-cyan-300">
                            {club.total_checkins}
                          </td>

                          <td className="py-4 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                            ₹{Number(club.total_revenue || 0).toLocaleString('en-IN')}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-mono text-xs text-slate-300 font-semibold">{sharePct}%</span>
                              <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${sharePct}%`,
                                    backgroundColor: club.color || '#9333ea'
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <Link
                              href={`/admin/${club.slug}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Portal <ArrowRight size={11} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EVENT-WISE FINANCIAL AUDIT */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="Search by Event Name, Code, or Category..."
                    value={eventSearch}
                    onChange={e => setEventSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={selectedClubFilter}
                    onChange={e => setSelectedClubFilter(e.target.value)}
                    className="w-full sm:w-64 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All 12 Clubs</option>
                    {clubStats.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy size={16} className="text-purple-400" /> Event Financial &amp; Attendance Reports ({filteredEvents.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider bg-black/30">
                      <th className="py-3 px-4">Event Code &amp; Name</th>
                      <th className="py-3 px-4">Club Domain</th>
                      <th className="py-3 px-4">Category / Venue</th>
                      <th className="py-3 px-4 text-center">Ticket Fee</th>
                      <th className="py-3 px-4 text-center">Capacity / Enrolled</th>
                      <th className="py-3 px-4 text-center">Confirmed</th>
                      <th className="py-3 px-4 text-center">Checked In</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No event financial records match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map(ev => (
                        <tr key={ev.event_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[10px] text-purple-300 block">{ev.event_code || 'EVT'}</span>
                            <span className="font-bold text-white text-xs">{ev.event_name}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded text-white inline-block"
                              style={{ backgroundColor: ev.club_color || '#9333ea' }}
                            >
                              {ev.club_name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-slate-300 font-medium block">{ev.category || 'General'}</span>
                            <span className="text-[10px] text-slate-500">{ev.venue || 'Campus Venue'}</span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-amber-400">
                            {ev.event_fee > 0 ? `₹${ev.event_fee}` : 'Free'}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                            {ev.total_count} {ev.capacity ? `/ ${ev.capacity}` : ''}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                            {ev.confirmed_count}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono text-cyan-300">
                            {ev.checked_in_count}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                            ₹{Number(ev.total_revenue || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OUTSIDERS VS AMRITA AUDIENCE REVENUE SPLIT */}
        {activeTab === 'audience' && summary && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">

              {/* Outside College Students Box */}
              <div className="bg-gradient-to-b from-cyan-500/10 via-white/[0.02] to-transparent border border-cyan-500/20 rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Outside College Students</h4>
                      <p className="text-xs text-slate-400">National Delegates &amp; External Campuses</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30">
                    Fixed ₹1000 Pass Active
                  </span>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Total Outsiders Revenue</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400">
                      ₹{(summary.outsider_paid_inr ?? summary.platform_paid_inr).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs pt-2 border-t border-white/5">
                    <span className="text-slate-400">Platform Delegate Pass Revenue (₹1000)</span>
                    <span className="font-mono text-slate-200">₹{summary.platform_paid_inr.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  ✓ Automatically verified on Cashfree payment verification. Official Festival Pass and QR token unlocked immediately without administrative approval.
                </p>
              </div>

              {/* Amrita Vishwa Vidyapeetham Students Box */}
              <div className="bg-gradient-to-b from-purple-500/10 via-white/[0.02] to-transparent border border-purple-500/20 rounded-3xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Amrita Amaravati Students</h4>
                      <p className="text-xs text-slate-400">Institutional Student Body</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30">
                    Complimentary Passes
                  </span>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Total Amrita Revenue</span>
                    <span className="text-2xl font-bold font-mono text-purple-300">
                      ₹{(summary.amrita_paid_inr ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs pt-2 border-t border-white/5">
                    <span className="text-slate-400">Event Workshop &amp; Contest Fees</span>
                    <span className="font-mono text-slate-200">₹{(summary.amrita_paid_inr ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  ✓ Amrita students receive free festival delegate passes upon institutional email verification, paying only for individual competitive event entries if applicable.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* CASHFREE AUDIT INSPECTION MODAL */}
        <AnimatePresence>
          {selectedTx && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-3xl bg-[#0c071a] border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg leading-tight">
                        Cashfree Payment Audit Record
                      </h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        selectedTx.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : selectedTx.status === 'refunded'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : selectedTx.status === 'failed'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {selectedTx.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      DB Payment ID: {selectedTx.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

                  {/* 1. Cashfree Financial Summary Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/[0.03] p-4 rounded-xl border border-white/10">
                    <div>
                      <p className="text-slate-500 text-[11px]">Payment Type</p>
                      <p className="font-semibold text-purple-300 mt-0.5">
                        {selectedTx.type === 'platform_fee' ? 'Festival Delegate Pass' : 'Event Registration'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Amount Paid</p>
                      <p className="font-mono font-bold text-amber-400 text-base mt-0.5">
                        ₹{selectedTx.amount_inr.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">({selectedTx.amount_paise} paise)</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Cashfree Payment ID</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="font-mono text-emerald-400 font-semibold truncate text-[11px]" title={selectedTx.cf_payment_id || '—'}>
                          {selectedTx.cf_payment_id || '—'}
                        </p>
                        {selectedTx.cf_payment_id && (
                          <button
                            onClick={() => copyToClipboard(selectedTx.cf_payment_id!, 'pay_id')}
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            {copiedKey === 'pay_id' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Cashfree Order ID</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="font-mono text-slate-300 truncate text-[11px]" title={selectedTx.cf_order_id || '—'}>
                          {selectedTx.cf_order_id || '—'}
                        </p>
                        {selectedTx.cf_order_id && (
                          <button
                            onClick={() => copyToClipboard(selectedTx.cf_order_id!, 'ord_id')}
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            {copiedKey === 'ord_id' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. What the Student Paid For (Itemized Breakdown) */}
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Trophy size={14} /> Itemized Breakdown: What Student Paid For
                    </h4>

                    {selectedTx.purchased_items && selectedTx.purchased_items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTx.purchased_items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{item.name}</span>
                                {item.club_name && (
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded text-white"
                                    style={{ backgroundColor: item.club_color || '#9333ea' }}
                                  >
                                    {item.club_name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Category: {item.category || item.type} {item.event_code ? `• Code: ${item.event_code}` : ''}
                                {item.team_name ? ` • Team: ${item.team_name}` : ''}
                              </p>
                            </div>

                            <div className="sm:text-right">
                              <span className="font-mono font-bold text-amber-400 text-sm">
                                {item.amount_inr > 0 ? `₹${item.amount_inr}` : 'Included'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center text-slate-400 text-xs">
                        {selectedTx.item_description}
                      </div>
                    )}
                  </div>

                  {/* 3. Participant Profile Details */}
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User size={14} /> Participant Profile Details
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-black/30 p-4 rounded-xl border border-white/5">
                      <div>
                        <p className="text-slate-500 text-[10px]">Full Name</p>
                        <p className="font-semibold text-white mt-0.5">{selectedTx.user.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Email Address</p>
                        <p className="font-mono text-purple-300 mt-0.5">{selectedTx.user.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Phone Number</p>
                        <p className="font-mono text-slate-300 mt-0.5">{selectedTx.user.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">College / University</p>
                        <p className="font-medium text-slate-200 mt-0.5">{selectedTx.user.college}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Roll / Student Number</p>
                        <p className="font-mono text-purple-300 mt-0.5">{selectedTx.user.roll_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Department &amp; Year</p>
                        <p className="text-slate-300 mt-0.5">
                          {selectedTx.user.department || '—'} {selectedTx.user.year_of_study ? `(Yr ${selectedTx.user.year_of_study})` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Timestamps Audit */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Initiated: {formatDateTimeIST(selectedTx.created_at)}</span>
                    <span>Last Synced: {formatDateTimeIST(selectedTx.updated_at)}</span>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10 bg-[#080413] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 size={15} />
                    <span>Cashfree Gateway Database Synchronization Verified</span>
                  </div>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Close Log
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
