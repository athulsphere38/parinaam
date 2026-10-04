'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  QrCode, Calendar, CheckCircle2, Clock, AlertTriangle,
  CreditCard, User, LogOut, TicketCheck, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

interface Registration {
  id: string; event_id: string; event_name: string; category: string;
  venue: string; date_start: string; start_time: string; status: string;
  payment_status: string; amount_paid: number; poster_url: string;
  club_name: string; club_color: string; checked_in_at: string | null;
}

export default function DashboardPage() {
  const { user } = useRequireAuth();
  const { logout, refreshUser } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    refreshUser();
    fetch('/api/registrations')
      .then(r => r.json())
      .then(d => { if (d.success) setRegistrations(d.data.registrations); })
      .finally(() => setLoadingRegs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const confirmed = registrations.filter(r => r.status === 'CONFIRMED').length;
  const pending   = registrations.filter(r => r.status === 'PENDING').length;
  const checkedIn = registrations.filter(r => r.checked_in_at).length;

  const verificationBanner = () => {
    if (!user.is_amrita_student && !user.platform_fee_paid && user.verification_status !== 'verified') {
      return (
        <div className="mb-6 flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Festival Delegate Pass Pending Payment</p>
              <p className="text-amber-400/70 text-xs mt-0.5">Complete your ₹1000 Cashfree payment to automatically generate your official pass and QR code.</p>
            </div>
          </div>
          <Link
            href="/dashboard/payment"
            className="text-xs bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl font-bold shrink-0 transition-colors"
          >
            Pay Now →
          </Link>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#05030a] pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Hey, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{(user.full_name || user.email || 'Student').split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {user.is_amrita_student ? 'Amrita Vishwa Vidyapeetham' : user.college_name}
              {user.roll_number ? ` • ${user.roll_number}` : ''}
            </p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            <LogOut size={15} /> Sign out
          </button>
        </div>

        {/* Verification / fee banners */}
        {verificationBanner()}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Registered', value: registrations.length, icon: <Calendar size={18} />, color: 'text-purple-400' },
            { label: 'Confirmed', value: confirmed, icon: <CheckCircle2 size={18} />, color: 'text-green-400' },
            { label: 'Pending Pay', value: pending, icon: <Clock size={18} />, color: 'text-amber-400' },
            { label: 'Checked In', value: checkedIn, icon: <TicketCheck size={18} />, color: 'text-cyan-400' },
          ].map(stat => (
            <motion.div key={stat.label} whileHover={{ scale: 1.02 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-500 text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — QR Pass */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="flex items-center gap-2 justify-center mb-4">
                <QrCode size={16} className="text-purple-400" />
                <h2 className="text-white font-semibold text-sm">Your Festival Pass</h2>
              </div>

              {user.verification_status === 'verified' ? (
                <>
                  <div className="bg-white rounded-xl p-4 inline-block mb-3">
                    <QRCodeSVG
                      value={user.qr_token || user.id}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#1a0533"
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{user.pass_type || 'DELEGATE PASS'}</p>
                  <p className="font-mono text-xs text-purple-400 bg-purple-500/10 rounded px-2 py-1 inline-block">
                    {user.qr_token?.slice(0, 12).toUpperCase()}
                  </p>
                  <p className="text-slate-600 text-xs mt-3">Show this QR at event entry gates</p>
                  <Link href="/dashboard/pass"
                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium py-2 rounded-lg transition-all">
                    <TicketCheck size={13} /> View Full Pass
                  </Link>
                </>
              ) : (
                <div className="py-6">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle size={24} className="text-amber-400" />
                  </div>
                  <p className="text-slate-400 text-sm">QR pass will be available once your account is verified. Waiting for approval.</p>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="mt-4 space-y-2">
              {[
                { href: '/events', label: 'Browse Events', icon: <Sparkles size={15} /> },
                { href: '/dashboard/profile', label: 'Edit Profile', icon: <User size={15} /> },
                { href: '/schedule', label: 'View Schedule', icon: <Calendar size={15} /> },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center justify-between bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm transition-all group">
                  <span className="flex items-center gap-2">{l.icon}{l.label}</span>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right — Registrations */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">My Registrations</h2>
              <Link href="/events" className="text-purple-400 text-sm hover:text-purple-300">+ Register for events</Link>
            </div>

            {loadingRegs ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-24 animate-pulse" />
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Calendar size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 font-medium">No registrations yet</p>
                <p className="text-slate-600 text-sm mt-1">Explore 35+ events and register!</p>
                <Link href="/events" className="mt-4 inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">
                  Browse Events <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map(reg => (
                  <motion.div key={reg.id} whileHover={{ x: 2 }}
                    className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-4 flex items-center gap-4 transition-all">
                    <div className="w-1 h-12 rounded-full shrink-0" style={{ background: reg.club_color || '#6366f1' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{reg.event_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{reg.club_name} · {reg.venue}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={reg.status} checkedIn={!!reg.checked_in_at} />
                      {reg.amount_paid > 0 && (
                        <p className="text-slate-600 text-xs mt-1">₹{reg.amount_paid}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, checkedIn }: { status: string; checkedIn: boolean }) {
  if (checkedIn) return <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Checked In ✓</span>;
  if (status === 'CONFIRMED') return <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Confirmed</span>;
  if (status === 'PENDING') return <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Pay Pending</span>;
  if (status === 'CANCELLED') return <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">Cancelled</span>;
  return <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{status}</span>;
}
