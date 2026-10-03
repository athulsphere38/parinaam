'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Shield, CreditCard, RefreshCw, Eye, X,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle,
  RotateCcw, Calendar, IndianRupee, Trophy, Building2, User, Mail,
  Phone, ArrowRight, Download, Sparkles, Layers, Hash
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
}

interface TransactionRegistration {
  registration_id: string;
  registration_status: string;
  payment_status: string;
  amount_paid: number;
  registered_at: string;
  confirmed_at: string | null;
  event_id: string;
  event_name: string;
  club_id: string;
  club_name: string;
  club_color: string;
}

interface Transaction {
  id: string;
  user_id: string | null;
  user: TransactionUser;
  type: 'platform_fee' | 'event_fee';
  amount_paise: number;
  amount_inr: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: 'created' | 'paid' | 'failed' | 'refunded';
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

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selected Detail Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter) queryParams.set('status', statusFilter);
      if (typeFilter) queryParams.set('type', typeFilter);
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
  }, [search, statusFilter, typeFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user, fetchTransactions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#05030a] pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-purple-500/30">
                <Shield size={12} /> Super Admin HQ
              </span>
              <span className="text-xs text-slate-500">• Financial Audit Suite</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <CreditCard className="text-purple-400" size={28} /> System Transaction Logs
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Authoritative, server-verified log of Razorpay orders, platform delegate passes, and event registrations
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
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
              View Users
            </Link>
          </div>
        </div>

        {/* Summary Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Total Volume</p>
              <p className="text-2xl font-bold text-purple-300 mt-1">{summary.total_records}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Payment Orders</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Verified Revenue</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">₹{summary.total_paid_inr.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Authoritative Paid</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Platform Passes</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">₹{summary.platform_paid_inr.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">₹1000 Outside Passes</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Event Fees</p>
              <p className="text-2xl font-bold text-fuchsia-400 mt-1">₹{summary.event_paid_inr.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Workshops / Contests</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Paid Success</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.paid_count}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Completed</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Pending Checkout</p>
              <p className="text-2xl font-bold text-amber-300 mt-1">{summary.created_count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Created Holds</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Failed / Refunded</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{summary.failed_count + summary.refunded_count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{summary.refunded_count} Refunded</p>
            </div>
          </div>
        )}

        {/* Filters & Search Control Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search Name, Email, Phone, Order ID, Payment ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
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
                <option value="paid">PAID (Success)</option>
                <option value="created">CREATED (Pending)</option>
                <option value="failed">FAILED</option>
                <option value="refunded">REFUNDED</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Transaction Types</option>
                <option value="platform_fee">Platform Delegate Pass (₹1000)</option>
                <option value="event_fee">Event Registrations Fee</option>
              </select>
            </div>

            {/* Sort Dropdown */}
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

          {/* Active Filters Reset */}
          {(search || statusFilter || typeFilter || sortBy !== 'created_at' || sortOrder !== 'desc') && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
              <span>Filters active</span>
              <button
                onClick={handleResetFilters}
                className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Transaction Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-purple-400" /> Payment Records Log ({totalRecords})
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider bg-black/30">
                  <th className="py-3 px-4">Transaction ID / Type</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Institution / Roll</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Razorpay Order & Payment ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp (IST)</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 space-y-2">
                      <RefreshCw size={24} className="animate-spin mx-auto text-purple-400 mb-2" />
                      <p className="text-xs font-semibold">Loading authoritative transaction logs...</p>
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
                      {/* ID & Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 font-semibold text-[11px] truncate max-w-[100px]" title={tx.id}>
                            {tx.id.slice(0, 8)}...
                          </span>
                        </div>
                        <span className={`inline-block mt-0.5 text-[9px] font-semibold uppercase px-2 py-0.5 rounded ${
                          tx.type === 'platform_fee'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {tx.type === 'platform_fee' ? 'Delegate Pass' : 'Event Fee'}
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{tx.user.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{tx.user.email}</p>
                        {tx.user.phone && <p className="text-[10px] text-slate-500 font-mono">📞 {tx.user.phone}</p>}
                      </td>

                      {/* Institution */}
                      <td className="py-3 px-4">
                        {tx.user.is_amrita_student ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                            Amrita Amaravati
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs truncate max-w-[140px] block">
                            {tx.user.college}
                          </span>
                        )}
                        {tx.user.roll_number && (
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5">{tx.user.roll_number}</p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono">
                        <span className="text-sm font-bold text-amber-400">
                          ₹{tx.amount_inr.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">({tx.amount_paise} paise)</p>
                      </td>

                      {/* Razorpay IDs */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {tx.razorpay_payment_id ? (
                          <span className="text-emerald-300 block font-semibold">
                            Pay: {tx.razorpay_payment_id}
                          </span>
                        ) : (
                          <span className="text-slate-500 block">—</span>
                        )}
                        {tx.razorpay_order_id ? (
                          <span className="text-slate-400 block text-[10px]">
                            Ord: {tx.razorpay_order_id}
                          </span>
                        ) : (
                          <span className="text-slate-600 block text-[10px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
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
                            <AlertTriangle size={10} /> Created
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {formatDateTimeIST(tx.created_at)}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-white/10 transition-colors"
                          title="View Complete Transaction Audit"
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

          {/* Pagination Controls */}
          {totalRecords > 0 && (
            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs bg-black/20">
              <div className="text-slate-400">
                Showing <strong className="text-white">{Math.min(totalRecords, (page - 1) * limit + 1)}</strong> to{' '}
                <strong className="text-white">{Math.min(totalRecords, page * limit)}</strong> of{' '}
                <strong className="text-white">{totalRecords}</strong> transaction records
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Rows per page:</span>
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

        {/* TRANSACTION AUDIT MODAL */}
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
                        Transaction Audit Record
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
                <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1 custom-scrollbar">

                  {/* 1. Payment Financial Summary Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/[0.03] p-4 rounded-xl border border-white/10">
                    <div>
                      <p className="text-slate-500 text-[11px]">Transaction Type</p>
                      <p className="font-semibold text-purple-300 mt-0.5">
                        {selectedTx.type === 'platform_fee' ? 'Platform Pass Fee' : 'Event Registration Fee'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Total Amount</p>
                      <p className="font-mono font-bold text-amber-400 text-base mt-0.5">
                        ₹{selectedTx.amount_inr.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">({selectedTx.amount_paise} paise)</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Razorpay Payment ID</p>
                      <p className="font-mono text-emerald-400 font-semibold mt-0.5 truncate">
                        {selectedTx.razorpay_payment_id || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-[11px]">Razorpay Order ID</p>
                      <p className="font-mono text-slate-300 mt-0.5 truncate">
                        {selectedTx.razorpay_order_id || '—'}
                      </p>
                    </div>
                  </div>

                  {/* 2. Participant Identity Matrix */}
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User size={14} /> Participant Identity Details
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
                        <p className="text-slate-500 text-[10px]">Department & Year</p>
                        <p className="text-slate-300 mt-0.5">
                          {selectedTx.user.department || '—'} {selectedTx.user.year_of_study ? `(Yr ${selectedTx.user.year_of_study})` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Linked Registrations & Events */}
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Trophy size={14} /> Associated Event Registrations ({selectedTx.registrations.length})
                    </h4>

                    {selectedTx.registrations.length === 0 ? (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-center text-slate-500 text-xs">
                        <p>This payment was for a platform delegate pass (no direct event line items).</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedTx.registrations.map(reg => (
                          <div
                            key={reg.registration_id}
                            className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{reg.event_name}</span>
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded text-white"
                                  style={{ backgroundColor: reg.club_color || '#9333ea' }}
                                >
                                  {reg.club_name}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                Registered At: {formatDateTimeIST(reg.registered_at)}
                              </p>
                            </div>

                            <div className="sm:text-right">
                              <div className="flex items-center gap-2 sm:justify-end">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  reg.registration_status === 'CONFIRMED'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {reg.registration_status}
                                </span>
                                <span className="font-mono font-bold text-amber-400">
                                  {reg.amount_paid > 0 ? `₹${reg.amount_paid}` : 'Free'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Payment State: {reg.payment_status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Timestamps Audit */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Created: {formatDateTimeIST(selectedTx.created_at)}</span>
                    <span>Updated: {formatDateTimeIST(selectedTx.updated_at)}</span>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10 bg-[#080413] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle size={15} />
                    <span>Server-authoritative database verification record</span>
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
