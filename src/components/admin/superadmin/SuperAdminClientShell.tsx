'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  RefreshCw,
  Building2,
  CreditCard,
  QrCode,
  Users,
  Settings,
  IdCard,
  X,
} from 'lucide-react';

import { OverviewTab } from './OverviewTab';
import { AnalyticsTab } from './AnalyticsTab';
import { ClubsTab } from './ClubsTab';
import { VerificationQueueTab } from './VerificationQueueTab';
import { BroadcastTickerTab } from './BroadcastTickerTab';
import { StudentInspectorModal } from './StudentInspectorModal';

interface SuperAdminClientShellProps {
  initialOverview: any;
  initialBranchStats: any[];
  initialYearStats: any[];
  initialClubStats: any[];
  initialClubEventReports: any[];
  initialRecentUsers: any[];
  initialRecentRegistrations: any[];
  initialClubs: any[];
  initialPendingUsers: any[];
}

export function SuperAdminClientShell({
  initialOverview,
  initialBranchStats,
  initialYearStats,
  initialClubStats,
  initialClubEventReports,
  initialRecentUsers,
  initialRecentRegistrations,
  initialClubs,
  initialPendingUsers,
}: SuperAdminClientShellProps) {
  const [tab, setTab] = useState<'overview' | 'analytics' | 'clubs' | 'verify' | 'broadcast'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Stats data states
  const [overview, setOverview] = useState(initialOverview);
  const [branchStats, setBranchStats] = useState(initialBranchStats);
  const [yearStats, setYearStats] = useState(initialYearStats);
  const [clubStats, setClubStats] = useState(initialClubStats);
  const [clubEventReports, setClubEventReports] = useState(initialClubEventReports);
  const [recentUsers, setRecentUsers] = useState(initialRecentUsers);
  const [recentRegistrations, setRecentRegistrations] = useState(initialRecentRegistrations);
  const [clubs, setClubs] = useState(initialClubs);
  const [pendingUsers, setPendingUsers] = useState(initialPendingUsers);


  // Modals state
  const [inspectingUserId, setInspectingUserId] = useState<string | null>(null);
  const [inspectingData, setInspectingData] = useState<any | null>(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Dynamic refresh function for manual click
  const loadData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, clubsRes, pendingRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/clubs').then((r) => r.json()),
        fetch('/api/admin/users?verification_status=pending&limit=20').then((r) => r.json()),
      ]);

      if (statsRes.success) {
        setOverview(statsRes.data.overview);
        setBranchStats(statsRes.data.branch_stats || []);
        setYearStats(statsRes.data.year_stats || []);
        setClubStats(statsRes.data.club_stats || []);
        setClubEventReports(statsRes.data.club_event_reports || []);
        setRecentUsers(statsRes.data.recent_users || []);
        setRecentRegistrations(statsRes.data.recent_registrations || []);
      }
      if (clubsRes.success) setClubs(clubsRes.data.clubs || []);
      if (pendingRes.success) setPendingUsers(pendingRes.data.users || []);
    } catch (e) {
      console.error('Failed to load superadmin data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // CSV Export utility
  const exportCSV = (specificClubSlug?: string) => {
    const reportsToExport = specificClubSlug
      ? clubEventReports.filter((r) => r.club_slug === specificClubSlug)
      : clubEventReports;

    if (reportsToExport.length === 0) return;

    const headers = [
      'Club Name',
      'Event Name',
      'Event Code',
      'Category',
      'Venue',
      'Day Number',
      'Date Start',
      'Start Time',
      'Capacity',
      'Fee (INR)',
      'Confirmed Regs',
      'Pending Regs',
      'Total Regs',
      'Gate Check-ins',
      'Total Revenue (INR)',
    ];

    const rows = reportsToExport.map((r) => [
      `"${(r.club_name || '').replace(/"/g, '""')}"`,
      `"${(r.event_name || '').replace(/"/g, '""')}"`,
      `"${(r.event_code || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.venue || '').replace(/"/g, '""')}"`,
      `"${r.day_number || ''}"`,
      `"${r.date_start ? new Date(r.date_start).toISOString().split('T')[0] : ''}"`,
      `"${(r.start_time || '').replace(/"/g, '""')}"`,
      r.capacity || 0,
      r.event_fee || 0,
      r.confirmed_count || 0,
      r.pending_count || 0,
      r.total_count || 0,
      r.checked_in_count || 0,
      r.total_revenue || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parinaam_club_events_report_${specificClubSlug || 'all_clubs'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Inspect student modal trigger
  const handleInspectUser = async (userId: string) => {
    setInspectingUserId(userId);
    setInspectingLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/full-profile`);
      const data = await res.json();
      if (data.success) {
        setInspectingData(data.data);
      }
    } catch (e) {
      console.error('Failed to inspect student:', e);
    } finally {
      setInspectingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05030a] pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-purple-500/30">
                <Shield size={12} /> Super Admin Command HQ
              </span>
              <span className="text-xs text-slate-500">• Amrita Amaravati</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Festival Central Intelligence
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Live metrics, participant analytics, 12 club controls &amp; venue check-ins
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <Link
              href="/superadmin/sponsors"
              className="flex items-center gap-1.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Building2 size={14} /> Sponsor Apps
            </Link>
            <Link
              href="/superadmin/transactions"
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <CreditCard size={14} /> Transaction Logs
            </Link>
            <Link
              href="/superadmin/scan"
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-900/30"
            >
              <QrCode size={14} /> QR Scanner
            </Link>
            <Link
              href="/superadmin/users"
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Users size={14} /> View All Users
            </Link>
            <Link
              href="/superadmin/settings"
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <Settings size={14} /> Platform Config
            </Link>
          </div>
        </div>

        {/* Pending verification info banner */}
        {overview && overview.pending_verification > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-3.5 cursor-pointer hover:bg-blue-500/15 transition-colors"
            onClick={() => setTab('verify')}
          >
            <IdCard size={18} className="text-blue-400 shrink-0" />
            <p className="text-blue-300 text-sm">
              <strong>{overview.pending_verification}</strong> external student{overview.pending_verification !== 1 ? 's' : ''} have uploaded ID cards — passes are auto-granted on payment verification
            </p>
            <span className="text-xs text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full font-semibold ml-auto flex items-center gap-1">
              View ID Cards ({pendingUsers.length}) →
            </span>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 w-fit flex-wrap">
          {[
            { id: 'overview', label: 'Command Overview' },
            { id: 'analytics', label: 'Branch & Year Analytics' },
            { id: 'clubs', label: `12 Club Portals (${clubs.length})` },
            { id: 'verify', label: `ID Card Uploads (${pendingUsers.length})` },
            { id: 'broadcast', label: 'Live Ticker' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <OverviewTab
            overview={overview}
            clubStats={clubStats}
            recentUsers={recentUsers}
            recentRegistrations={recentRegistrations}
            pendingUsersCount={pendingUsers.length}
            onSelectTab={(t: string) => setTab(t as any)}
            onOpenInspector={handleInspectUser}
          />
        )}

        {/* TAB 2: ANALYTICS */}
        {tab === 'analytics' && (
          <AnalyticsTab
            overview={overview}
            clubs={clubs}
            clubEventReports={clubEventReports}
            branchStats={branchStats}
            yearStats={yearStats}
            exportCSV={exportCSV}
          />
        )}

        {/* TAB 3: CLUBS & EVENT REPORTS */}
        {tab === 'clubs' && (
          <ClubsTab
            clubs={clubs}
          />
        )}

        {/* TAB 4: ID CARD VERIFICATION QUEUE */}
        {tab === 'verify' && (
          <VerificationQueueTab
            pendingUsers={pendingUsers}
            onOpenInspector={handleInspectUser}
          />
        )}

        {/* TAB 5: BROADCAST TICKER */}
        {tab === 'broadcast' && <BroadcastTickerTab />}

        {/* Photo Zoom Modal */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setZoomedImage(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh] bg-[#0e071c] p-2 rounded-2xl border border-white/20">
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/90"
              >
                <X size={18} />
              </button>
              <img
                src={zoomedImage}
                alt="Zoomed Student ID"
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Comprehensive Student Inspection Modal */}
        <StudentInspectorModal
          userId={inspectingUserId}
          data={inspectingData}
          loading={inspectingLoading}
          onClose={() => {
            setInspectingUserId(null);
            setInspectingData(null);
          }}
          onZoomImage={setZoomedImage}
        />
      </div>
    </div>
  );
}
