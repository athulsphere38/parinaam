'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Loader2, Calendar, Users, IndianRupee, Trophy, ChevronRight, Tag, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { isStudentProfileComplete } from '@/lib/institutionPolicy';
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal';

interface Club { id: string; name: string; slug: string; color: string; event_count: string; }
interface Event {
  id: string; name: string; event_code: string; tagline: string; short_description: string;
  category: string; venue: string; date_start: string; start_time: string; end_time: string;
  min_team_size: number; max_team_size: number; capacity: number; enrolled: number; fee: number;
  amrita_fee?: number | null; other_fee?: number | null;
  prize_pool: string; poster_url: string; status: string; registration_open: boolean;
  unstop_url?: string; registration_url?: string;
  is_popular: boolean; is_featured: boolean;
  club_id: string; club_name: string; club_slug: string; club_color: string;
}

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Coding & Hackathon', 'Robotics', 'Gaming', 'Workshops', 'Quiz & Literary', 'Arts & Media', 'Management', 'Dance', 'Music', 'Film & Media'];

export default function EventsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents]     = useState<Event[]>([]);
  const [clubs, setClubs]       = useState<Club[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [clubFilter, setClubFilter] = useState('');
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);

  // Fetch clubs once
  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(d => { if (d.success) setClubs(d.data.clubs); });
  }, []);

  // Initialize filters from URL query parameters on load (e.g. /events?category=... or /events?search=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category');
      const searchParam = urlParams.get('search');
      const clubParam = urlParams.get('club_id') || urlParams.get('club');
      if (catParam) setCategory(catParam);
      if (searchParam) {
        setSearchInput(searchParam);
        setSearch(searchParam);
      }
      if (clubParam) setClubFilter(clubParam);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: 'published', page: String(page), limit: '18' });
    if (search)     params.set('search', search);
    if (category !== 'All') params.set('category', category);
    if (clubFilter) params.set('club_id', clubFilter);

    const res  = await fetch(`/api/events?${params}`);
    const data = await res.json();
    if (data.success) {
      const sorted = [...data.data.events].sort((a: Event, b: Event) => {
        const aFlag = (a.is_popular || a.is_featured) ? 0 : 1;
        const bFlag = (b.is_popular || b.is_featured) ? 0 : 1;
        return aFlag - bFlag;
      });
      setEvents(sorted);
      setTotal(data.data.pagination.total);
    }
    setLoading(false);
  }, [search, category, clubFilter, page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const clearFilters = () => { setSearchInput(''); setSearch(''); setCategory('All'); setClubFilter(''); setPage(1); };
  const hasFilters = search || category !== 'All' || clubFilter;
  const selectedClub = clubs.find(c => c.id === clubFilter);

  return (
    <div className="min-h-screen bg-[#05030a] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-10 space-y-2">
          <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-widest">PARINAAM 2026 CATALOG</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">All Events &amp; Competitions</h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            {total > 0 ? `${total} events across 12 clubs` : 'Browse events, view rulebooks, and register your team.'} Filter by club or category to discover what's happening.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="space-y-4 mb-8">
          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search events, clubs (e.g. Drisya, Chakravyuha), or keywords..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 text-sm transition-all"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Active Club Indicator if searching within a specific club */}
          {clubFilter && search && (
            <div className="flex items-center gap-2 text-xs bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-purple-300 w-fit">
              <span>Searching only within <strong>{selectedClub?.name || 'Selected Club'}</strong></span>
              <button
                onClick={() => { setClubFilter(''); setPage(1); }}
                className="underline hover:text-white font-semibold ml-1 cursor-pointer"
              >
                Search across all 12 clubs instead
              </button>
            </div>
          )}

          {/* Club pills */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setClubFilter(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!clubFilter ? 'bg-purple-600 text-white border-purple-600' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'}`}>
              All Clubs
            </button>
            {clubs.map(club => (
              <button key={club.id} onClick={() => { setClubFilter(clubFilter === club.id ? '' : club.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${clubFilter === club.id ? 'text-white border-transparent' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white'}`}
                style={clubFilter === club.id ? { background: club.color, borderColor: club.color } : {}}>
                {club.name}
                {club.event_count !== '0' && <span className="ml-1 opacity-60">({club.event_count})</span>}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${category === cat ? 'bg-white/15 text-white border-white/30' : 'bg-white/3 text-slate-500 border-white/5 hover:text-slate-300 hover:border-white/15'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Active filter count + clear */}
          {hasFilters && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">Filtered results: <strong className="text-white">{total}</strong></span>
              <button onClick={clearFilters} className="text-xs text-purple-400 hover:text-purple-300 underline">Clear all filters</button>
            </div>
          )}
        </div>

        {/* Events grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-purple-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-8 max-w-lg mx-auto">
            <Filter size={36} className="mx-auto text-purple-400 mb-3 opacity-60" />
            <p className="text-white font-bold text-lg">{hasFilters ? 'No events matching filters' : 'Club Events Releasing Soon'}</p>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              {hasFilters ? 'Try clearing your search or selecting a different club cluster.' : 'The 12 official club administrators are currently uploading festival workshops and competitions.'}
            </p>
            {hasFilters && (
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                {clubFilter && (
                  <button
                    onClick={() => { setClubFilter(''); setPage(1); }}
                    className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Search across All 12 Clubs
                  </button>
                )}
                {category !== 'All' && (
                  <button
                    onClick={() => { setCategory('All'); setPage(1); }}
                    className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    View All Categories
                  </button>
                )}
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} user={user} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 18 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/10 transition-all">
              ← Prev
            </button>
            <span className="text-slate-400 text-sm">Page {page} of {Math.ceil(total / 18)}</span>
            <button disabled={page >= Math.ceil(total / 18)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm disabled:opacity-30 hover:bg-white/10 transition-all">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, index, user }: { event: Event; index: number; user: ReturnType<typeof useAuth>['user'] }) {
  const router = useRouter();
  const { isInCart, isConfirmed } = useCart();
  const registered = isConfirmed(event.id);
  const inCart = isInCart(event.id);
  const isTeam = event.max_team_size > 1;
  const teamLabel = isTeam
    ? event.min_team_size === event.max_team_size
      ? `👥 Team of ${event.max_team_size}`
      : `👥 Team (${event.min_team_size}–${event.max_team_size} members)`
    : '👤 Individual';

  const spotsLeft = event.capacity ? event.capacity - event.enrolled : null;
  const almostFull = spotsLeft !== null && spotsLeft < 20 && spotsLeft > 0;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const [regModalOpen, setRegModalOpen] = useState(false);

  const isAdmin = user?.role === 'club_admin' || user?.role === 'super_admin';
  const isStudent = user?.role === 'student';
  const isProfileComplete = isStudentProfileComplete(user);

  const isRegistrationOpen = event.status === 'published' ? (event.registration_open ?? true) : Boolean(event.registration_open);

  const handleRegisterClick = () => {
    if (!user) {
      router.push('/auth/login?redirect=/events');
      return;
    }
    if (isStudent && !isProfileComplete) {
      alert('Please complete your platform registration profile before choosing events.');
      router.push('/dashboard/profile');
      return;
    }
    if (isStudent) {
      setRegModalOpen(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:shadow-purple-900/20"
    >
      {/* Top Header Pill Bar — Clean and zero overlap */}
      <div className="px-4 py-2.5 bg-[#0e091e] border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-white shadow-sm truncate max-w-[130px]" style={{ background: `${event.club_color}cc` }}>
            {event.club_name}
          </span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline truncate">
            {event.category}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(event.unstop_url || event.registration_url) && (
            <span className="bg-blue-600/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <ExternalLink size={10} /> Unstop
            </span>
          )}
          {event.is_popular && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
              Flagship
            </span>
          )}
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-sm ${event.fee === 0 ? 'bg-emerald-500/90 text-white' : 'bg-black/60 text-amber-300 border border-amber-500/30'}`}>
            {event.fee === 0 ? 'FREE' : `₹${event.fee}`}
          </span>
        </div>
      </div>

      {/* Poster — Big Full uncropped image with 3:4 portrait framing */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#070410] flex items-center justify-center border-b border-white/10">
        {event.poster_url ? (
          <>
            <img
              src={event.poster_url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-125 pointer-events-none"
            />
            <img
              src={event.poster_url}
              alt={event.name}
              className="relative z-10 w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300 drop-shadow-2xl"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl opacity-20" style={{ background: event.club_color }} />
          </div>
        )}
        {/* Subtle bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05030a]/90 via-transparent to-transparent pointer-events-none z-10" />
        
        {/* Bottom Pinned Alerts (Spots Left / Full) */}
        {(almostFull || isFull) && (
          <div className="absolute bottom-3 left-3 z-20">
            {almostFull && (
              <span className="bg-red-500/95 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-md flex items-center gap-1">
                ⚡ {spotsLeft} spots left
              </span>
            )}
            {isFull && (
              <span className="bg-slate-800/95 text-slate-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-md">
                Full
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs text-purple-400 font-mono font-semibold">{event.event_code} · {event.category}</p>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white/5 text-purple-300">
              {teamLabel}
            </span>
          </div>
          <h3 className="text-white font-bold text-base leading-snug group-hover:text-purple-200 transition-colors">{event.name}</h3>
          {event.tagline && <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{event.tagline}</p>}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 mb-4 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users size={12} className="shrink-0 text-purple-400" />
            <span className="truncate">{teamLabel}</span>
          </div>
          {event.prize_pool && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Trophy size={12} className="shrink-0" />
              <span className="truncate">{event.prize_pool}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 col-span-2">
              <Calendar size={12} className="shrink-0 text-slate-500" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Link href={`/events/${event.id}`}
            className="flex-1 text-center text-sm font-semibold py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all">
            Details
          </Link>
          {(event.unstop_url || event.registration_url) ? (
            <a
              href={
                (event.unstop_url || event.registration_url || '').startsWith('http')
                  ? (event.unstop_url || event.registration_url)
                  : `https://${event.unstop_url || event.registration_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-sm font-semibold py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all flex items-center justify-center gap-1 shadow-lg shadow-indigo-950/40"
            >
              <span>Register</span>
              <ExternalLink size={13} />
            </a>
          ) : !isAdmin && (
            registered ? (
              <span className="flex-1 text-center text-xs font-bold font-mono py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                You're registered!
              </span>
            ) : (
              <button
                onClick={handleRegisterClick}
                disabled={isFull || !isRegistrationOpen}
                className={`flex-1 text-center text-sm font-semibold py-2 rounded-xl transition-all ${
                  isFull || !isRegistrationOpen
                    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                    : inCart && isStudent
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/20'
                }`}>
                {isFull
                  ? 'Full'
                  : !isRegistrationOpen
                    ? 'Closed'
                    : inCart && isStudent
                      ? '✓ In Cart'
                      : 'Register'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Team / Individual Registration Modal */}
      <EventRegistrationModal
        event={{
          id: event.id,
          name: event.name,
          club_name: event.club_name,
          event_code: event.event_code,
          category: event.category,
          poster_url: event.poster_url,
          fee: event.fee,
          amrita_fee: event.amrita_fee,
          other_fee: event.other_fee,
          min_team_size: event.min_team_size || 1,
          max_team_size: event.max_team_size || 1,
          registration_open: isRegistrationOpen,
          status: event.status,
        }}
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
      />
    </motion.div>
  );
}
