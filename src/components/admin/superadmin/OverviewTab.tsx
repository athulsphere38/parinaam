'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { School, Building2, Users, CheckCircle, XCircle, AlertTriangle, Eye, ArrowRight } from 'lucide-react';

interface OverviewTabProps {
  overview: any;
  clubStats: any[];
  recentUsers: any[];
  recentRegistrations: any[];
  pendingUsersCount: number;
  onSelectTab: (tab: string) => void;
  onOpenInspector: (userId: string) => void;
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

export function OverviewTab({
  overview,
  clubStats,
  recentUsers,
  recentRegistrations,
  pendingUsersCount,
  onSelectTab,
  onOpenInspector,
}: OverviewTabProps) {
  const [feedType, setFeedType] = useState<'users' | 'events'>('users');
  const [feedPage, setFeedPage] = useState(1);
  const [feedPageSize, setFeedPageSize] = useState(10);

  const totalRegistered = overview?.total_students || 0;
  const activeFeedList = feedType === 'users' ? recentUsers : recentRegistrations;
  const feedTotal = activeFeedList.length;
  const feedTotalPages = Math.max(1, Math.ceil(feedTotal / feedPageSize));
  const paginatedFeed = activeFeedList.slice((feedPage - 1) * feedPageSize, feedPage * feedPageSize);

  return (
    <div className="space-y-8">
      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Fest Revenue', value: `₹${(overview?.total_revenue_inr ?? 0).toLocaleString('en-IN')}`, sub: 'Cashfree Gateway', color: 'text-amber-400', href: '/superadmin/transactions' },
          { label: 'Outsider Revenue', value: `₹${(overview?.outsider_revenue_inr ?? overview?.platform_revenue_inr ?? 0).toLocaleString('en-IN')}`, sub: 'Passes + Events', color: 'text-cyan-400', href: '/superadmin/transactions' },
          { label: 'Amrita Revenue', value: `₹${(overview?.amrita_revenue_inr ?? 0).toLocaleString('en-IN')}`, sub: 'Event Fees', color: 'text-purple-300', href: '/superadmin/transactions' },
          { label: 'Total Students', value: overview?.total_students ?? '—', sub: 'All Registered', color: 'text-fuchsia-400', href: '/superadmin/users' },
          { label: 'Active Events', value: overview?.total_events ?? '—', sub: 'Across 12 Clubs', color: 'text-blue-400', href: '/events' },
          { label: 'Gate Check-ins', value: overview?.total_checkins ?? '—', sub: 'QR Scans Done', color: 'text-emerald-400', href: '/superadmin/scan' },
        ].map(kpi => (
          <Link key={kpi.label} href={kpi.href} className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-2xl p-4 transition-all block">
            <p className="text-slate-400 text-xs font-medium">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{kpi.sub}</p>
          </Link>
        ))}
      </div>

      {/* Middle Grid: Ratio & Club Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Institution Distribution Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <School size={16} className="text-purple-400" /> Institution Ratio
            </h3>
            <span className="text-xs text-slate-400 font-mono">{totalRegistered} Total</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-300 font-medium">Amrita Students (Free)</span>
                <span className="text-white font-mono font-bold">
                  {overview?.amrita_students ?? 0} ({totalRegistered > 0 ? Math.round(((overview?.amrita_students ?? 0) / totalRegistered) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{ width: `${totalRegistered > 0 ? Math.min(100, Math.round(((overview?.amrita_students ?? 0) / totalRegistered) * 100)) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-300 font-medium">External Students</span>
                <span className="text-white font-mono font-bold">
                  {overview?.external_students ?? 0} ({totalRegistered > 0 ? Math.round(((overview?.external_students ?? 0) / totalRegistered) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: `${totalRegistered > 0 ? Math.min(100, Math.round(((overview?.external_students ?? 0) / totalRegistered) * 100)) : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Pending KYC Reviews</span>
            <span className="font-bold text-amber-400">{overview?.pending_verification ?? 0}</span>
          </div>
        </div>

        {/* Club Activity Ranking */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 size={16} className="text-purple-400" /> Club Registrations Leaderboard
            </h3>
            <button
              onClick={() => onSelectTab('clubs')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              View All 12 Clubs →
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {clubStats.slice(0, 6).map((club, idx) => (
              <div
                key={club.name}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">{club.name}</p>
                    <p className="text-[10px] text-slate-500">{club.published_events} events published</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono text-purple-300">
                    {club.total_registrations}
                  </span>
                  <p className="text-[9px] text-slate-500">enrolled</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users size={16} className="text-purple-400" /> Live Registrations & Participant Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time feed of participants signing up and claiming passes on Parinaam
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Feed Toggle */}
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => { setFeedType('users'); setFeedPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  feedType === 'users'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Student Signups ({recentUsers.length})
              </button>
              <button
                onClick={() => { setFeedType('events'); setFeedPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  feedType === 'events'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Event Enrollments ({recentRegistrations.length})
              </button>
            </div>

            <Link
              href="/superadmin/users"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium px-2 py-1"
            >
              All Users ({totalRegistered}) →
            </Link>
          </div>
        </div>

        {/* Feed Table */}
        <div className="overflow-x-auto">
          {feedType === 'users' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5">Participant</th>
                  <th className="py-2.5">Campus / Roll No</th>
                  <th className="py-2.5">Academic</th>
                  <th className="py-2.5">KYC Status</th>
                  <th className="py-2.5">Pass Status</th>
                  <th className="py-2.5 text-right">Registered (IST)</th>
                  <th className="py-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No student user signups recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedFeed.map((u: any) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {((u.full_name || u.email || 'S').charAt(0)).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{u.full_name || 'Student'}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                            {u.phone && <p className="text-[10px] text-slate-500 font-mono">{u.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        {u.is_amrita_student ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                            Amrita Amaravati
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs truncate max-w-[150px] block">
                            {u.college_name || 'External College'}
                          </span>
                        )}
                        {u.roll_number && (
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5">{u.roll_number}</p>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.department ? (
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300 text-[10px]">
                              {u.department}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                          {u.year_of_study && (
                            <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 text-[10px]">
                              Yr {u.year_of_study}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        {u.verification_status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> Verified
                          </span>
                        ) : u.verification_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={10} /> Waiting Approval
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {u.verification_status !== 'verified' ? (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            Pending Approval
                          </span>
                        ) : u.is_amrita_student ? (
                          <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                            Free Pass
                          </span>
                        ) : u.platform_fee_paid ? (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Paid Pass
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Unpaid</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-slate-400 font-mono text-[11px]">
                        {formatDateTimeIST(u.created_at)}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <button
                          onClick={() => onOpenInspector(u.id)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-white/10 transition-colors"
                          title="View Full Student Details"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5">Student</th>
                  <th className="py-2.5">Institution</th>
                  <th className="py-2.5">Branch & Year</th>
                  <th className="py-2.5">Event Enrolled</th>
                  <th className="py-2.5 text-right">Timestamp (IST)</th>
                  <th className="py-2.5 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No event enrollments recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedFeed.map((r: any) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-semibold text-white">{r.full_name}</td>
                      <td className="py-3 text-slate-400">
                        {r.is_amrita_student ? 'Amrita Amaravati' : r.college_name}
                      </td>
                      <td className="py-3">
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300 text-[10px]">
                          {r.department || '—'} {r.year_of_study ? `(Yr ${r.year_of_study})` : ''}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-purple-300">{r.event_name}</span>
                        <span className="text-slate-500 text-[10px] block">{r.club_name}</span>
                      </td>
                      <td className="py-3 text-right text-slate-400 font-mono text-[11px]">
                        {formatDateTimeIST(r.registered_at)}
                      </td>
                      <td className="py-3 text-right pr-2">
                        {r.user_id && (
                          <button
                            onClick={() => onOpenInspector(r.user_id)}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-white/10 transition-colors"
                            title="View Full Student Details"
                          >
                            <Eye size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {feedTotal > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-400">
              Showing <strong className="text-white">{Math.min(feedTotal, (feedPage - 1) * feedPageSize + 1)}</strong> to{' '}
              <strong className="text-white">{Math.min(feedTotal, feedPage * feedPageSize)}</strong> of{' '}
              <strong className="text-white">{feedTotal}</strong> records
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Per page:</span>
              {[5, 10, 20].map(sz => (
                <button
                  key={sz}
                  onClick={() => { setFeedPageSize(sz); setFeedPage(1); }}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-all ${
                    feedPageSize === sz
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}

              <div className="flex items-center gap-1 ml-2">
                <button
                  disabled={feedPage === 1}
                  onClick={() => setFeedPage(p => p - 1)}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/10"
                >
                  ←
                </button>
                <span className="text-slate-400 text-[11px] font-mono px-1">
                  {feedPage}/{feedTotalPages}
                </span>
                <button
                  disabled={feedPage >= feedTotalPages}
                  onClick={() => setFeedPage(p => p + 1)}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white text-xs disabled:opacity-30 hover:bg-white/10"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
