'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus, Calendar, Users, QrCode, ArrowLeft,
  ChevronRight, Shield, CheckCircle, Clock,
  Building2, Sparkles, Filter, Trash2, Loader2, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

interface EventItem {
  id: string;
  name: string;
  event_code: string;
  category: string;
  venue: string;
  date_start: string;
  fee: number;
  capacity: number;
  enrolled: number;
  status: string;
  registration_open: boolean;
  is_popular: boolean;
  day_number: number;
  unstop_url?: string;
  registration_url?: string;
}

export default function ClubAdminPortal({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [club, setClub] = useState<Club | null>(null);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${eventName}'? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setEvents(evs => evs.filter(e => e.id !== eventId));
      } else {
        alert(json.error || 'Failed to delete event');
      }
    } catch {
      alert('Network error deleting event. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };
  const [error, setError] = useState('');

  // Fetch club & events
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Fetch all clubs first to find current club
    fetch('/api/clubs')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAllClubs(d.data.clubs);
          const found = d.data.clubs.find((c: Club) => c.slug.toLowerCase() === clubSlug.toLowerCase());
          if (found) {
            setClub(found);
            // Fetch all events for this club (including drafts and published)
            return fetch(`/api/events?club_id=${found.id}&status=all&limit=100`)
              .then(r => r.json())
              .then(ed => {
                if (ed.success) setEvents(ed.data.events);
              });
          } else {
            setError(`Club "${clubSlug}" not found`);
          }
        }
      })
      .catch(() => setError('Failed to load club information'))
      .finally(() => setLoading(false));
  }, [clubSlug, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#05030a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authorization check
  const isSuperAdmin = user?.role === 'super_admin';
  const isAuthorizedClubAdmin = user?.role === 'club_admin' && (user.club_id === club?.id || user.club_slug === clubSlug);

  if (!isSuperAdmin && !isAuthorizedClubAdmin) {
    return (
      <div className="min-h-screen bg-[#05030a] pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/5 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl">
          <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm mb-6">
            You do not have administrative privileges for <strong>{club?.name || clubSlug}</strong>. You can only manage your own assigned club.
          </p>
          <Link
            href={user?.role === 'club_admin' && user.club_slug ? `/admin/${user.club_slug}` : '/dashboard'}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl"
          >
            Go to My Portal →
          </Link>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#05030a] pt-24 pb-16 px-4 text-center">
        <p className="text-red-400 mb-4">{error || 'Club not found'}</p>
        <Link href="/superadmin" className="text-purple-400 underline text-sm">
          Return to Command HQ
        </Link>
      </div>
    );
  }

  const totalAttendees = events.reduce((sum, e) => sum + (e.enrolled || 0), 0);
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);

  return (
    <div className="min-h-screen bg-[#05030a] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Superadmin banner & Quick Switcher */}
        {isSuperAdmin && (
          <div className="mb-6 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-300">
              <Shield size={16} className="text-purple-400" />
              <span><strong>Super Admin Mode:</strong> You are viewing the admin console for <strong>{club.name}</strong>.</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/superadmin"
                className="text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                ← Return to Superadmin HQ
              </Link>
              <select
                value={club.slug}
                onChange={e => router.push(`/admin/${e.target.value}`)}
                className="bg-black/60 border border-purple-500/40 text-purple-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                {allClubs.map(c => (
                  <option key={c.id} value={c.slug} className="bg-slate-900 text-white">
                    Switch to {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Club Header Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 mb-8 border border-white/10 overflow-hidden bg-gradient-to-r from-white/[0.04] to-white/[0.01] backdrop-blur-xl">
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: club.color || '#8b5cf6' }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-xl shrink-0"
                style={{ backgroundColor: club.color || '#8b5cf6' }}
              >
                {((club.name || clubSlug || 'CL').slice(0, 2)).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20">
                    /admin/{club.slug}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Building2 size={13} /> Official Club Portal
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{club.name} Administration</h1>
                <p className="text-slate-400 text-sm mt-1 max-w-2xl">{club.description}</p>
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/admin/${club.slug}/events/new`}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-purple-900/30 transition-all active:scale-95"
              >
                <Plus size={16} /> Create Event
              </Link>
              <Link
                href={`/admin/${club.slug}/scan`}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                <QrCode size={16} className="text-purple-400" /> QR Scanner
              </Link>
            </div>
          </div>
        </div>

        {/* Club Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Published Events</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{events.length}</span>
              <span className="text-xs text-purple-400 font-medium">events</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Attendees</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">{totalAttendees}</span>
              <span className="text-xs text-slate-500 font-medium">/ {totalCapacity || 100} capacity</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Active Registrations</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-400">
                {events.filter(e => e.registration_open).length}
              </span>
              <span className="text-xs text-slate-500 font-medium">open events</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Venue Scanner</span>
            <Link
              href={`/admin/${club.slug}/scan`}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-400 hover:text-purple-300"
            >
              Launch Camera Scanner →
            </Link>
          </div>
        </div>

        {/* Events Management List */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">Events Hosted by {club.name}</h2>
              <p className="text-slate-400 text-xs mt-0.5">Manage details, multi-round schedules, rules, and live attendees</p>
            </div>
            <Link
              href={`/admin/${club.slug}/events/new`}
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md"
            >
              <Plus size={14} /> Add New Event
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
              <Calendar size={36} className="mx-auto text-slate-600 mb-3" />
              <h3 className="text-white font-semibold text-base">No events created yet</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 mb-5">
                Create your club's first workshop, competition, or hackathon for Parinaam 2026.
              </p>
              <Link
                href={`/admin/${club.slug}/events/new`}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                <Plus size={14} /> Create {club.name} Event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, i) => (
                <div
                  key={event.id ? `event-${event.id}` : `event-${i}`}
                  className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-purple-500/40 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        {event.event_code || 'EVENT'}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-300">
                        {event.category || 'General'}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        event.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {event.status}
                      </span>
                      {(event.unstop_url || event.registration_url) && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold border border-blue-500/30 flex items-center gap-1">
                          <ExternalLink size={10} /> Unstop Link
                        </span>
                      )}
                      {event.is_popular && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-bold text-lg truncate">{event.name}</h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                      <span>📍 {event.venue || 'Campus Venue'}</span>
                      <span>🗓️ Day {event.day_number || 1} ({event.date_start})</span>
                      <span>💰 {event.fee ? `₹${event.fee}` : 'Free'}</span>
                      <span className="text-emerald-400 font-medium">👥 {event.enrolled || 0} / {event.capacity || '∞'} enrolled</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {(event.unstop_url || event.registration_url) && (
                      <a
                        href={
                          (event.unstop_url || event.registration_url || '').startsWith('http')
                            ? (event.unstop_url || event.registration_url)
                            : `https://${event.unstop_url || event.registration_url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                        title="Open external Unstop registration page in new tab"
                      >
                        <span>Unstop Link</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <Link
                      href={`/admin/${club.slug}/events/${event.id}/registrations`}
                      className="flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all"
                    >
                      <Users size={13} /> Participants ({event.enrolled || 0})
                    </Link>
                    <Link
                      href={`/admin/${club.slug}/events/${event.id}/edit`}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium px-3.5 py-2 rounded-xl transition-all"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      disabled={deletingId === event.id}
                      className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-medium px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      title="Delete Event"
                    >
                      {deletingId === event.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
