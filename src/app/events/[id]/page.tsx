'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Users, IndianRupee, Trophy, FileText,
  Phone, Mail, ArrowLeft, CheckCircle, AlertTriangle,
  Loader2, Tag, Calendar, Layers, ExternalLink, Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { isStudentProfileComplete } from '@/lib/institutionPolicy';
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal';

interface EventDetail {
  id: string; name: string; event_code: string; tagline: string;
  short_description: string; full_description: string; category: string;
  tags: string[]; venue: string; date_start: string; date_end: string;
  start_time: string; end_time: string; day_number: number;
  min_team_size: number; max_team_size: number;
  capacity: number; enrolled: number; fee: number;
  amrita_fee?: number | null; other_fee?: number | null;
  prize_pool: string;
  eligibility: string; rules: string[]; rounds: { name: string; description: string; date: string }[];
  coordinators: { name: string; role: string; phone: string; email: string }[];
  poster_url: string; rulebook_url: string;
  unstop_url?: string; registration_url?: string;
  status: string; registration_open: boolean; is_popular: boolean;
  club_id: string; club_name: string; club_color: string; club_description: string;
}

interface UserRegistration {
  id: string; status: string; payment_status: string; amount_paid: number;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isInCart, isConfirmed } = useCart();

  const [event, setEvent]   = useState<EventDetail | null>(null);
  const [myReg, setMyReg]   = useState<UserRegistration | null>(null);
  const [loading, setLoading]   = useState(true);
  const [regModalOpen, setRegModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}`).then(r => r.json()).then(d => {
      if (d.success) { setEvent(d.data.event); setMyReg(d.data.userRegistration); }
    }).finally(() => setLoading(false));
  }, [id]);

  const inCart = isInCart(id);
  const isConfirmedReg = isConfirmed(id) || myReg?.status === 'CONFIRMED';
  const isStudent = user?.role === 'student';
  const isProfileComplete = isStudentProfileComplete(user);

  const handleRegisterClick = () => {
    if (!user) { router.push(`/auth/login?redirect=/events/${id}`); return; }
    if (isStudent && !isProfileComplete) {
      alert('Please complete your platform registration profile before choosing events.');
      router.push('/dashboard/profile');
      return;
    }
    if (isStudent) {
      setRegModalOpen(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#05030a] pt-28 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-purple-500" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[#05030a] pt-28 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 text-lg">Event not found</p>
        <Link href="/events" className="mt-4 text-purple-400 hover:text-purple-300 underline block">← Back to Events</Link>
      </div>
    </div>
  );

  const spotsLeft = event.capacity ? event.capacity - event.enrolled : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isTeamEvent = event.max_team_size > 1;
  const teamLabel = isTeamEvent
    ? event.min_team_size === event.max_team_size
      ? `Team of ${event.max_team_size}`
      : `${event.min_team_size}–${event.max_team_size} members`
    : 'Individual';

  const isRegistrationOpen = event.status === 'published' ? (event.registration_open ?? true) : Boolean(event.registration_open);

  return (
    <div className="min-h-screen bg-[#05030a] pt-24 pb-20">
      {/* Hero banner */}
      <div className="relative min-h-[260px] sm:min-h-[320px] overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a0515] to-[#05030a] border-b border-white/10 flex items-end">
        {event.poster_url && (
          <img
            src={event.poster_url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-125 pointer-events-none"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05030a] via-[#05030a]/70 to-transparent" />
        <div className="relative z-10 p-6 sm:p-8 max-w-5xl mx-auto w-full">
          <Link href="/events" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={14} /> Back to All Events
          </Link>
          <div className="flex items-center gap-3 mb-2.5 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1 rounded-full text-white shadow" style={{ background: `${event.club_color}dd` }}>
              {event.club_name}
            </span>
            <span className="text-slate-400 text-xs font-mono bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              {event.event_code}
            </span>
            <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/30">
              {isTeamEvent ? `👥 ${teamLabel}` : '👤 Individual'}
            </span>
            {(event.unstop_url || event.registration_url) && (
              <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/30 flex items-center gap-1 font-semibold">
                <ExternalLink size={12} /> Unstop Event
              </span>
            )}
            {event.is_popular && <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md font-bold">🔥 Flagship</span>}
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">{event.name}</h1>
          {event.tagline && <p className="text-slate-300 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">{event.tagline}</p>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left — Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Users size={16} />, label: 'Participation', value: isTeamEvent ? `Team (${teamLabel})` : 'Individual' },
                { icon: <IndianRupee size={16} />, label: 'Registration Fee', value: event.fee === 0 ? 'FREE' : `₹${event.fee}` },
                { icon: <Trophy size={16} />, label: 'Prize Pool', value: event.prize_pool || '—' },
                { icon: <Calendar size={16} />, label: 'Festival Schedule', value: `Day ${event.day_number || 1}` },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm">
                  <div className="text-purple-400 mb-1.5">{s.icon}</div>
                  <p className="text-white text-sm font-bold truncate">{s.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <Section title="About this Event">
              <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                {event.full_description || event.short_description}
              </p>
            </Section>

            {/* Venue & Schedule */}
            {(event.venue || event.date_start) && (
              <Section title="Venue & Schedule">
                <div className="space-y-2">
                  {event.venue && <InfoRow icon={<MapPin size={14} />} text={event.venue} />}
                  {event.date_start && <InfoRow icon={<Calendar size={14} />} text={new Date(event.date_start).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />}
                  {event.start_time && <InfoRow icon={<Clock size={14} />} text={`${event.start_time} – ${event.end_time || ''}`} />}
                </div>
              </Section>
            )}

            {/* Rounds */}
            {event.rounds?.length > 0 && (
              <Section title="Event Rounds">
                <div className="space-y-3">
                  {event.rounds.map((round, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0">{i + 1}</div>
                      <div>
                        <p className="text-white text-sm font-semibold">{round.name}</p>
                        {round.description && <p className="text-slate-400 text-xs mt-0.5">{round.description}</p>}
                        {round.date && <p className="text-slate-600 text-xs mt-0.5">{new Date(round.date).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Eligibility */}
            {event.eligibility && (
              <Section title="Eligibility">
                <p className="text-slate-300 text-sm">{event.eligibility}</p>
              </Section>
            )}

            {/* Rules */}
            {event.rules?.length > 0 && (
              <Section title="Rules & Regulations">
                <ul className="space-y-2">
                  {event.rules.map((rule, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                      <span className="text-purple-400 shrink-0 mt-0.5">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
                {event.rulebook_url && (
                  <a href={event.rulebook_url} target="_blank" rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm underline">
                    <FileText size={13} /> Download Full Rulebook
                  </a>
                )}
              </Section>
            )}

            {/* Coordinators */}
            {event.coordinators?.length > 0 && (
              <Section title="Event Coordinators">
                <div className="grid sm:grid-cols-2 gap-3">
                  {event.coordinators.map((c, i) => (
                    <div key={i} className="bg-white/3 border border-white/10 rounded-xl p-4">
                      <p className="text-white font-semibold text-sm">{c.name}</p>
                      <p className="text-slate-500 text-xs">{c.role}</p>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-xs mt-2">
                          <Phone size={11} /> {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mt-1">
                          <Mail size={11} /> {c.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right — Registration & Poster Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              {/* Full Uncropped Poster Showcase */}
              {event.poster_url && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 overflow-hidden shadow-xl">
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/90 flex items-center justify-center">
                    <img
                      src={event.poster_url}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-125 pointer-events-none"
                    />
                    <img
                      src={event.poster_url}
                      alt={event.name}
                      className="relative z-10 w-full h-full object-contain p-1 rounded-lg"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <a
                      href={event.poster_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                    >
                      <span>🔍 View Full Resolution Poster</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

                {/* Status */}
                <div className="mb-4">
                  {spotsLeft !== null && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>{event.enrolled} registered</span>
                        <span>{spotsLeft} spots left</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (event.enrolled / event.capacity) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Registration Fee</span>
                    <span className={`font-bold text-lg ${event.fee === 0 ? 'text-green-400' : 'text-white'}`}>
                      {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
                    </span>
                  </div>
                </div>

                {/* Registration Action: Unstop vs Internal */}
                {(event.unstop_url || event.registration_url) ? (
                  <div className="space-y-3 mb-2">
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 font-bold text-blue-300 mb-1">
                        <ExternalLink size={13} />
                        <span>External Unstop Registration</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        This event's registrations and submissions are hosted on <strong>Unstop</strong>. Click below to proceed to the official competition portal.
                      </p>
                    </div>

                    <a
                      href={
                        (event.unstop_url || event.registration_url || '').startsWith('http')
                          ? (event.unstop_url || event.registration_url)
                          : `https://${event.unstop_url || event.registration_url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-950/50 transition-all text-sm group"
                    >
                      <span>Register on Unstop</span>
                      <ExternalLink size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                ) : isConfirmedReg ? (
                  <div className="mb-4 p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold font-mono text-sm flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-400" />
                    <span>You're registered!</span>
                  </div>
                ) : (
                  (!user || user.role === 'student') && (
                    <>
                      <button
                        onClick={handleRegisterClick}
                        disabled={isFull || !isRegistrationOpen || (!!user && user.verification_status !== 'verified')}
                        className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all ${
                          isFull || !isRegistrationOpen || (!!user && user.verification_status !== 'verified')
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                            : inCart && isStudent
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/30'
                        }`}
                      >
                        {isFull
                          ? 'Event is Full'
                          : !isRegistrationOpen
                            ? 'Registration Closed'
                            : !user
                              ? 'Sign in to Register'
                              : user.verification_status !== 'verified'
                                ? '⏳ Verification Pending'
                                : inCart && isStudent
                                  ? '✓ In Cart'
                                  : 'Register for Event'}
                      </button>
                      {!user && (
                        <p className="text-slate-600 text-xs text-center mt-2">
                          <Link href="/auth/login" className="text-purple-400 hover:text-purple-300">Sign in</Link> or{' '}
                          <Link href="/auth/register" className="text-purple-400 hover:text-purple-300">register</Link> to participate
                        </p>
                      )}
                    </>
                  )
                )}

                {/* Admin Mode Notice */}
                {user && (user.role === 'club_admin' || user.role === 'super_admin') && (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                    <p className="text-purple-300 text-xs font-semibold font-mono">Viewing Event in Admin Mode</p>
                    <p className="text-slate-500 text-[11px] mt-1">Student registration is disabled for administrator accounts.</p>
                  </div>
                )}

                {/* Team / Individual Registration Modal */}
                <EventRegistrationModal
                  event={event}
                  isOpen={regModalOpen}
                  onClose={() => setRegModalOpen(false)}
                />


                {/* Club info */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-600 mb-1">Organized by</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: event.club_color }} />
                    <p className="text-slate-300 text-sm font-medium">{event.club_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
      <h2 className="text-white font-bold text-base mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-slate-300 text-sm">
      <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
      {text}
    </div>
  );
}
