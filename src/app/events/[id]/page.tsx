import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin, Clock, Users, IndianRupee, Trophy, FileText,
  Phone, Mail, ArrowLeft, Calendar, ExternalLink
} from 'lucide-react';
import { db } from '@/lib/db';
import { EventRegistrationActions } from '@/components/events/EventRegistrationActions';

export const revalidate = 0;

async function getEvent(id: string) {
  try {
    const result = await db.query(
      `SELECT
        e.*,
        c.id as club_id, c.name as club_name, c.slug as club_slug, c.color as club_color,
        c.description as club_description
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const event = result.rows[0];
    if (event.status === 'published' && (event.registration_open === null || event.registration_open === false)) {
      event.registration_open = true;
    }

    return event;
  } catch (err) {
    console.error('Error getting event details:', err);
    return null;
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event || event.status !== 'published') {
    notFound();
  }

  const spotsLeft = event.capacity ? event.capacity - event.enrolled : null;
  const isTeamEvent = event.max_team_size > 1;
  const teamLabel = isTeamEvent
    ? event.min_team_size === event.max_team_size
      ? `Team of ${event.max_team_size}`
      : `${event.min_team_size}–${event.max_team_size} members`
    : 'Individual';

  return (
    <div className="min-h-screen bg-[#05030a] pt-24 pb-20">
      {/* Hero banner */}
      <div className="relative min-h-[260px] sm:min-h-[320px] overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a0515] to-[#05030a] border-b border-white/10 flex items-end">
        {event.poster_url && (
          <img
            src={event.poster_url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-125 pointer-events-none"
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
                  {event.rounds.map((round: any, i: number) => (
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
                  {event.rules.map((rule: string, i: number) => (
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
                  {event.coordinators.map((c: any, i: number) => (
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

                {/* Client-Side Registration Action Button & Modal */}
                <EventRegistrationActions event={event} />

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
