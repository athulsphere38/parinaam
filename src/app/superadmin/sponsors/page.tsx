'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Shield, Building2, RefreshCw, Eye, X,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle,
  Calendar, User, Mail, Phone, Globe, DollarSign, MessageSquare,
  Award, Check, Briefcase, ExternalLink
} from 'lucide-react';
import { useRequireRole } from '@/context/AuthContext';

interface SponsorApplication {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  designation: string | null;
  website: string | null;
  tier: string;
  budget: string | null;
  message: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  reviewed_note: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface SummaryStats {
  total_count: number;
  pending_count: number;
  confirmed_count: number;
  rejected_count: number;
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

function getTierBadge(tier: string) {
  switch (tier.toLowerCase()) {
    case 'title_sponsor':
      return { name: 'TITLE SPONSOR', color: 'bg-amber-400/15 text-amber-300 border-amber-400/40' };
    case 'co_sponsor':
      return { name: 'CO-SPONSOR', color: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40' };
    case 'associate':
    default:
      return { name: 'ASSOCIATE PARTNER', color: 'bg-purple-500/15 text-purple-300 border-purple-500/40' };
  }
}

export default function SuperAdminSponsorsPage() {
  const { user } = useRequireRole('super_admin');

  // State
  const [sponsors, setSponsors] = useState<SponsorApplication[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Inspection & Review Modal
  const [selectedApp, setSelectedApp] = useState<SponsorApplication | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter) queryParams.set('status', statusFilter);
      if (tierFilter) queryParams.set('tier', tierFilter);
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());

      const res = await fetch(`/api/admin/sponsors?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setSponsors(data.data.sponsors || []);
        setSummary(data.data.summary || null);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalRecords(data.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sponsors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, tierFilter, page, limit]);

  useEffect(() => {
    if (!user) return;
    fetchSponsors();
  }, [user, fetchSponsors]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSponsors();
  };

  const handleReviewAction = async (targetStatus: 'CONFIRMED' | 'REJECTED') => {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/sponsors/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, note: reviewNote }),
      });

      const data = await res.json();

      if (data.success) {
        setSelectedApp(null);
        setReviewNote('');
        fetchSponsors();
      } else {
        setActionError(data.error || 'Failed to update sponsor application status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setActionError('Network error while updating status');
    } finally {
      setActionLoading(false);
    }
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
              <span className="text-xs text-slate-500">• Sponsorship Desk</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="text-purple-400" size={28} /> Sponsor Applications Queue
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Review corporate partnership requests, verify contact details, and approve official sponsors
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
              href="/superadmin/transactions"
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              Transactions
            </Link>
          </div>
        </div>

        {/* Summary Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Total Applications</p>
              <p className="text-2xl font-bold text-purple-300 mt-1">{summary.total_count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sponsorship Registrations</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{summary.pending_count}</p>
              <p className="text-[10px] text-amber-400/80 font-medium mt-0.5">Awaiting Super Admin Action</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Confirmed Sponsors</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.confirmed_count}</p>
              <p className="text-[10px] text-emerald-400/80 font-medium mt-0.5">Official Partners</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-slate-400 text-xs font-medium">Rejected Requests</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{summary.rejected_count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Closed Applications</p>
            </div>
          </div>
        )}

        {/* Controls: Search & Filters */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search Company, Contact, Email, Phone..."
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
                <option value="">All Review Statuses</option>
                <option value="PENDING">PENDING (Review Queue)</option>
                <option value="CONFIRMED">CONFIRMED (Approved)</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <select
                value={tierFilter}
                onChange={e => { setTierFilter(e.target.value); setPage(1); }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Package Tiers</option>
                <option value="title_sponsor">Title Sponsor</option>
                <option value="co_sponsor">Co-Sponsor</option>
                <option value="associate">Associate Partner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award size={16} className="text-purple-400" /> Sponsorship Applications ({totalRecords})
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider bg-black/30">
                  <th className="py-3 px-4">Company / Organization</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Package Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Submitted (IST)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 space-y-2">
                      <RefreshCw size={24} className="animate-spin mx-auto text-purple-400 mb-2" />
                      <p className="text-xs font-semibold">Loading sponsor applications database...</p>
                    </td>
                  </tr>
                ) : sponsors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <Building2 size={32} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-sm font-semibold text-slate-400">No sponsorship applications found</p>
                      <p className="text-xs text-slate-500 mt-1">Try clearing search filters or selecting a different status</p>
                    </td>
                  </tr>
                ) : (
                  sponsors.map(app => {
                    const badge = getTierBadge(app.tier);
                    return (
                      <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-white">{app.company_name}</p>
                          {app.website && (
                            <a
                              href={app.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-[180px]"
                            >
                              {app.website} <ExternalLink size={10} />
                            </a>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-200">{app.contact_person}</p>
                          <p className="text-[11px] text-purple-300 font-mono">{app.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono">📞 {app.phone}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border font-semibold ${badge.color}`}>
                            {badge.name}
                          </span>
                          {app.budget && (
                            <p className="text-[10px] text-amber-300 font-mono mt-0.5">Budget: {app.budget}</p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {app.status === 'CONFIRMED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase">
                              <CheckCircle size={10} /> Confirmed
                            </span>
                          ) : app.status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full uppercase">
                              <XCircle size={10} /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase">
                              <AlertTriangle size={10} /> Pending Review
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                          {formatDateTimeIST(app.created_at)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => { setSelectedApp(app); setReviewNote(''); setActionError(''); }}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-white/10 transition-colors text-xs"
                          >
                            <Eye size={13} /> Inspect & Review
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
                <strong className="text-white">{totalRecords}</strong> sponsor applications
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Per page:</span>
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

        {/* INSPECT & REVIEW MODAL */}
        <AnimatePresence>
          {selectedApp && (
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
                        {selectedApp.company_name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        selectedApp.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : selectedApp.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {selectedApp.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Application ID: {selectedApp.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

                  {actionError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
                      ⚠️ {actionError}
                    </div>
                  )}

                  {/* 1. Contact & Identity Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User size={14} /> Corporate Contact Details
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-white/[0.03] p-4 rounded-xl border border-white/10">
                      <div>
                        <p className="text-slate-500 text-[10px]">Contact Person</p>
                        <p className="font-semibold text-white mt-0.5">{selectedApp.contact_person}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Designation / Role</p>
                        <p className="text-slate-300 mt-0.5">{selectedApp.designation || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Official Email</p>
                        <p className="font-mono text-purple-300 mt-0.5">{selectedApp.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Phone / WhatsApp</p>
                        <p className="font-mono text-slate-200 mt-0.5">📞 {selectedApp.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Company Website</p>
                        {selectedApp.website ? (
                          <a
                            href={selectedApp.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-400 hover:underline text-[11px] truncate block mt-0.5"
                          >
                            {selectedApp.website}
                          </a>
                        ) : (
                          <p className="text-slate-500 mt-0.5">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px]">Submitted Timestamp (IST)</p>
                        <p className="font-mono text-slate-300 mt-0.5">{formatDateTimeIST(selectedApp.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Package Tier & Requirements */}
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award size={14} /> Package & Partnership Request
                    </h4>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Selected Package Tier</span>
                          <span className={`inline-block text-xs font-mono font-bold px-2.5 py-0.5 rounded border mt-0.5 ${getTierBadge(selectedApp.tier).color}`}>
                            {getTierBadge(selectedApp.tier).name}
                          </span>
                        </div>
                        {selectedApp.budget && (
                          <div className="text-right">
                            <span className="text-slate-500 text-[10px] block">Custom Budget Note</span>
                            <span className="font-mono font-bold text-amber-300 text-sm">{selectedApp.budget}</span>
                          </div>
                        )}
                      </div>

                      {selectedApp.message && (
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-slate-500 text-[10px] block mb-1">Special Message / Club Event Preferences</span>
                          <p className="text-slate-200 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
                            "{selectedApp.message}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Reviewer Audit Trail (if reviewed) */}
                  {selectedApp.status !== 'PENDING' && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5 text-xs">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Shield size={14} className="text-purple-400" /> Super Admin Review Audit
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <p>Status: <strong className={selectedApp.status === 'CONFIRMED' ? 'text-emerald-400' : 'text-red-400'}>{selectedApp.status}</strong></p>
                        <p>Reviewed By: <strong className="text-slate-200">{selectedApp.reviewed_by_name || 'Super Admin'}</strong></p>
                        <p className="col-span-2">Reviewed At: <strong className="text-slate-200 font-mono">{formatDateTimeIST(selectedApp.reviewed_at)}</strong></p>
                      </div>
                      {selectedApp.reviewed_note && (
                        <p className="text-slate-300 text-[11px] mt-1 bg-black/40 p-2 rounded border border-white/5">
                          Note: "{selectedApp.reviewed_note}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* 4. Action Input (Only for PENDING applications) */}
                  {selectedApp.status === 'PENDING' && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="block text-xs font-semibold text-slate-300">
                        Reviewer Audit Note (Optional)
                      </label>
                      <textarea
                        value={reviewNote}
                        onChange={e => setReviewNote(e.target.value)}
                        placeholder="Add review notes (e.g., Verified phone call, MoU terms discussed)..."
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                </div>

                {/* Modal Footer / Review Actions */}
                <div className="p-4 border-t border-white/10 bg-[#080413] flex items-center justify-between gap-3">
                  {selectedApp.status === 'PENDING' ? (
                    <div className="w-full flex items-center gap-3">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleReviewAction('CONFIRMED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/30 cursor-pointer"
                      >
                        <Check size={15} /> Confirm Sponsor (PENDING → CONFIRMED)
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleReviewAction('REJECTED')}
                        className="flex-1 bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <X size={15} /> Reject (PENDING → REJECTED)
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        This application has already been reviewed ({selectedApp.status}).
                      </span>
                      <button
                        onClick={() => setSelectedApp(null)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
