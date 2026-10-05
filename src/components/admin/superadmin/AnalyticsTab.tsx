'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, TicketCheck, QrCode, IndianRupee, BarChart3, Search, Download, ArrowRight, TrendingUp } from 'lucide-react';

interface AnalyticsTabProps {
  overview: any;
  clubs: any[];
  clubEventReports: any[];
  branchStats: any[];
  yearStats: any[];
  exportCSV: (clubSlug?: string) => void;
}

const BRANCH_LIST = ['CSE', 'CSE-AIE', 'AIDS', 'CCE', 'ECE', 'QUANTUM'];

export function AnalyticsTab({
  overview,
  clubs,
  clubEventReports,
  branchStats,
  yearStats,
  exportCSV,
}: AnalyticsTabProps) {
  const [analyticsClubFilter, setAnalyticsClubFilter] = useState<string>('all');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState<string>('');

  const totalRegistered = overview?.total_students || 0;

  return (
    <div className="space-y-6">
      {/* 1. Top Analytics KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Club Events</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            {clubEventReports.length || overview?.total_events || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across {clubs.length || 12} active clubs</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Confirmed Registrations</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TicketCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            {clubEventReports.reduce((sum, r) => sum + parseInt(String(r.confirmed_count || 0)), 0) || overview?.confirmed_registrations || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Active confirmed event passes</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gate Check-in Attendance</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <QrCode size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-cyan-300 mt-2 font-mono">
            {clubEventReports.reduce((sum, r) => sum + parseInt(String(r.checked_in_count || 0)), 0) || overview?.total_checkins || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Verified attendance scans
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Event Revenue</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <IndianRupee size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-pink-300 mt-2 font-mono">
            ₹{clubEventReports.reduce((sum, r) => sum + parseInt(String(r.total_revenue || 0)), 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">From paid event registrations</p>
        </div>
      </div>

      {/* 2. Comprehensive Club-by-Club Event Registrations & Detailed Reports */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-400" /> Club Events Registrations & Detailed Report
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live registration analytics, gate check-in counts, and revenue breakdown per club & event
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search filter */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search event, code, venue..."
                value={analyticsSearchQuery}
                onChange={e => setAnalyticsSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors w-48 sm:w-56"
              />
            </div>

            {/* Club filter */}
            <select
              value={analyticsClubFilter}
              onChange={e => setAnalyticsClubFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all" className="bg-slate-900">All 12 Clubs</option>
              {clubs.map(c => (
                <option key={c.id} value={c.slug} className="bg-slate-900">{c.name}</option>
              ))}
            </select>

            {/* CSV Export Button */}
            <button
              onClick={() => exportCSV(analyticsClubFilter)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
              title="Export filtered reports to CSV"
            >
              <Download size={13} /> Export CSV Report
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] font-semibold">
                <th className="py-3 px-3">Club</th>
                <th className="py-3 px-3">Event Details</th>
                <th className="py-3 px-3 text-center">Confirmed</th>
                <th className="py-3 px-3 text-center">Pending</th>
                <th className="py-3 px-3 text-center">Total Enrolled</th>
                <th className="py-3 px-3 text-center">Checked-in (Attendance)</th>
                <th className="py-3 px-3 text-right">Fee / Revenue</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clubEventReports
                .filter(r => {
                  const matchesClub = analyticsClubFilter === 'all' || r.club_slug === analyticsClubFilter;
                  const query = analyticsSearchQuery.toLowerCase().trim();
                  const matchesQuery = !query || 
                    r.event_name.toLowerCase().includes(query) || 
                    r.club_name.toLowerCase().includes(query) ||
                    (r.event_code && r.event_code.toLowerCase().includes(query)) ||
                    (r.venue && r.venue.toLowerCase().includes(query)) ||
                    (r.category && r.category.toLowerCase().includes(query));
                  return matchesClub && matchesQuery;
                })
                .map((report, idx) => {
                  const confirmed = parseInt(String(report.confirmed_count || 0));
                  const pending = parseInt(String(report.pending_count || 0));
                  const checkedIn = parseInt(String(report.checked_in_count || 0));
                  const attendanceRate = confirmed > 0 ? Math.round((checkedIn / confirmed) * 100) : 0;
                  const revenue = parseInt(String(report.total_revenue || 0));
                  const capacity = report.capacity || 100;
                  const fillRate = Math.min(100, Math.round((confirmed / capacity) * 100));

                  return (
                    <tr key={`${report.club_id}-${report.event_id}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-white shadow-sm"
                          style={{ backgroundColor: report.club_color || '#9333ea' }}
                        >
                          {report.club_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">{report.event_name}</span>
                            {report.event_code && (
                              <span className="font-mono text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                                {report.event_code}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {report.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                            {report.venue && <span>📍 {report.venue}</span>}
                            {report.start_time && <span>⏰ {report.start_time}</span>}
                            {report.day_number && <span>Day {report.day_number}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs">
                          {confirmed}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                        {pending > 0 ? (
                          <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[11px]">
                            {pending}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div>
                          <span className="font-mono font-semibold text-white text-xs">
                            {confirmed} / {capacity}
                          </span>
                          <div className="w-20 mx-auto h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden border border-white/10">
                            <div
                              className={`h-full rounded-full transition-all ${
                                fillRate >= 90 ? 'bg-red-400' : fillRate >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${fillRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{fillRate}% filled</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div>
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg text-xs">
                            {checkedIn}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                            {attendanceRate}% rate
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div>
                          <span className="font-mono font-bold text-white text-xs">
                            {report.event_fee > 0 ? `₹${report.event_fee}` : 'Free'}
                          </span>
                          {revenue > 0 && (
                            <p className="text-[11px] font-mono text-pink-300 font-semibold mt-0.5">
                              ₹{revenue.toLocaleString('en-IN')} total
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/admin/${report.club_slug}/events/${report.event_id}/registrations`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white bg-purple-600/15 hover:bg-purple-600 border border-purple-500/30 px-2.5 py-1.5 rounded-lg transition-all"
                          title="View and manage individual attendee list"
                        >
                          View Attendees <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              {clubEventReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    No club event registration statistics available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Branch & Year Distribution Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Branch Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-400" /> Branch / Department Distribution
          </h3>

          <div className="space-y-3">
            {BRANCH_LIST.map(branch => {
              const match = branchStats.find(b => b.department?.toUpperCase() === branch.toUpperCase());
              const count = parseInt(match?.count || '0');
              const pct = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;

              return (
                <div key={branch}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{branch}</span>
                    <span className="font-mono text-slate-400">{count} students ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year of Study Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-purple-400" /> Year of Study Distribution
          </h3>

          <div className="space-y-4">
            {['1', '2', '3', '4'].map(yr => {
              const match = yearStats.find(y => y.year_of_study === yr || y.year_of_study === `${yr}st Year` || y.year_of_study === `${yr}nd Year` || y.year_of_study === `${yr}rd Year` || y.year_of_study === `${yr}th Year`);
              const count = parseInt(match?.count || '0');
              const pct = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;

              return (
                <div key={yr}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">Year {yr}</span>
                    <span className="font-mono text-slate-400">{count} students ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
