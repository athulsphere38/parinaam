'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket, ArrowLeft, Download, Printer, ShieldCheck,
  Calendar, MapPin, Sparkles, CheckCircle, Clock,
  ExternalLink, Building2, User, GraduationCap
} from 'lucide-react';

interface Registration {
  id: string;
  event_id: string;
  event_name: string;
  category: string;
  venue: string;
  date_start: string;
  start_time: string;
  status: string;
  club_name: string;
  club_color: string;
}

import { useRequireAuth, useAuth } from '@/context/AuthContext';

export default function StudentPassPage() {
  const { user } = useRequireAuth();
  const { refreshUser } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshUser();
    fetch('/api/registrations')
      .then(r => r.json())
      .then(d => {
        if (d.success) setRegistrations(d.data.registrations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const confirmedEvents = registrations.filter(r => r.status === 'CONFIRMED');
  const qrValue = user.qr_token || user.id;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#05030a] pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
            >
              <Printer size={14} /> Print Pass
            </button>
          </div>
        </div>

        {/* The Digital Fest Pass Card */}
        <motion.div
          ref={passRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-[#180d2b] via-[#0e071c] to-[#080312] shadow-2xl shadow-purple-950/50"
        >
          {/* Top Banner Accent */}
          <div className="h-2 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400" />

          {/* Pass Header */}
          <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-['Pixelify_Sans'] text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                  PARINAAM 2026
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Official Pass
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Amrita Vishwa Vidyapeetham, Amaravati • October 11-12, 2026
              </p>
            </div>

            <div className="text-left sm:text-right">
              {user.is_amrita_student || user.platform_fee_paid || user.verification_status === 'verified' ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                    <ShieldCheck size={14} /> PASS ACTIVE
                  </span>
                  <p className="text-[11px] font-mono text-purple-400 mt-1">
                    {user.is_amrita_student ? 'FREE AMRITA ACCESS' : 'OFFICIAL DELEGATE PASS'}
                  </p>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                    <Clock size={14} /> PAYMENT PENDING
                  </span>
                  <p className="text-[11px] font-mono text-amber-400 mt-1">
                    ₹1000 Delegate Fee Required
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Pass Body (QR + Student Details) */}
          <div className="p-6 sm:p-8 grid md:grid-cols-5 gap-6 items-center">
            {/* Left QR Code / Locked Placeholder */}
            <div className="md:col-span-2 flex flex-col items-center justify-center p-5 bg-white/5 border border-white/10 rounded-2xl text-center">
              {user.is_amrita_student || user.platform_fee_paid || user.verification_status === 'verified' ? (
                <>
                  <div className="bg-white p-3.5 rounded-2xl shadow-lg inline-block mb-3">
                    <QRCodeSVG
                      value={qrValue}
                      size={170}
                      bgColor="#ffffff"
                      fgColor="#15002b"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="font-mono text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md">
                    TOKEN: {qrValue.slice(0, 14).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">Scan at Entry Gates &amp; Event Venues</p>
                </>
              ) : (
                <div className="py-4 px-2 space-y-3">
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Clock size={36} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">QR Pass Locked</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Digital QR Code will be activated automatically once your Cashfree payment is verified.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/payment"
                    className="inline-block w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Pay Delegate Pass (₹1000) →
                  </Link>
                </div>
              )}
            </div>

            {/* Right Student Details */}
            <div className="md:col-span-3 space-y-4">
              <div>
                <p className="text-xs uppercase font-semibold tracking-wider text-slate-400">Student Name</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                  {user.full_name || user.email}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                {user.phone && <p className="text-xs text-slate-500 font-mono mt-0.5">{user.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Institution</p>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">
                    {user.is_amrita_student ? 'Amrita Vishwa Vidyapeetham, Amaravati' : (user.college_name || 'External College')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Roll Number</p>
                  <p className="text-xs font-mono font-semibold text-purple-300 mt-0.5">
                    {user.roll_number || 'Registered Participant'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Branch</p>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">
                    {user.department || (user.is_amrita_student ? 'Amrita Engineering' : 'Engineering')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Year</p>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">
                    {user.year_of_study ? (user.year_of_study.includes('Year') ? user.year_of_study : `Year ${user.year_of_study}`) : 'Enrolled Student'}
                  </p>
                </div>
              </div>

              {/* Security Pill */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center gap-3">
                <Sparkles size={16} className="text-purple-400 shrink-0" />
                <p className="text-xs text-purple-200">
                  {user.verification_status === 'verified'
                    ? user.is_amrita_student
                      ? 'Official Amrita Student Pass — Unlimited access to all non-paid cultural & tech arenas.'
                      : 'Verified Delegate Pass — Carry valid government / college photo ID.'
                    : 'Account Verification Pending — Waiting for approval.'}
                </p>
              </div>
            </div>
          </div>

          {/* Flagship Inclusions for Outside Delegate Pass */}
          {!user.is_amrita_student && user.platform_fee_paid && (
            <div className="bg-gradient-to-r from-purple-950/40 via-pink-950/20 to-black border-t border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Flagship Events Included in ₹1000 Pass
                </h4>
                <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full">
                  All 4 Included
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { name: 'Live Concert & DJ', icon: '🎵', tag: 'Mega Pronite' },
                  { name: 'Garba Night', icon: '💃', tag: 'Cultural Celebration' },
                  { name: 'Auto Expo', icon: '🏎️', tag: 'Supercar Exhibition' },
                  { name: 'Tholu Bommalata', icon: '🎭', tag: 'Heritage Arts' },
                ].map(ev => (
                  <div key={ev.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span>{ev.icon}</span>
                      <span>{ev.name}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Pass Access ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registered Club Events Footer */}
          <div className="bg-black/40 border-t border-white/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Ticket size={14} className="text-purple-400" />
                Additional Registered Events ({confirmedEvents.length})
              </h4>
              <Link
                href="/events"
                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                Explore More Events <ExternalLink size={12} />
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500">Loading registrations...</p>
            ) : confirmedEvents.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400">No additional specific club competitions enrolled yet.</p>
                <Link
                  href="/events"
                  className="mt-2 inline-block text-xs font-semibold text-purple-300 hover:text-purple-200 underline"
                >
                  Browse 35+ Club Competitions, Hackathons &amp; Workshops →
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5">
                {confirmedEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{evt.event_name}</p>
                      <p className="text-[11px] text-slate-400">{evt.club_name} • {evt.venue || 'Campus Arena'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Enrolled
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Nav Card */}
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <Link
            href="/events"
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all group"
          >
            <Calendar size={20} className="mx-auto text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-white">Event Schedule</p>
            <p className="text-xs text-slate-400">View upcoming rounds & rules</p>
          </Link>

          <Link
            href="/dashboard/profile"
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all group"
          >
            <User size={20} className="mx-auto text-pink-400 mb-1 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-white">Student Profile</p>
            <p className="text-xs text-slate-400">Manage contact & account info</p>
          </Link>
        </div>

      </div>
    </div>
  );
}
