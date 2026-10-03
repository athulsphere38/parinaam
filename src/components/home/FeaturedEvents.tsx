'use client';

import React, { useState, useEffect } from 'react';
import { EventCard } from '../events/EventCard';
import { EventDetailModal } from '../events/EventDetailModal';
import { FestEvent, EventCategory } from '../../types';
import Link from 'next/link';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function mapApiEventToFestEvent(e: any): FestEvent {
  return {
    id: e.id,
    name: e.name,
    eventCode: e.event_code || 'EVT',
    category: (e.category || 'Other') as EventCategory,
    tagline: e.tagline || '',
    shortDescription: e.short_description || e.tagline || '',
    fullDescription: e.full_description || e.short_description || '',
    venue: e.venue || 'Campus Venue',
    date: e.date_start ? new Date(e.date_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Fest Days',
    startTime: e.start_time || '10:00 AM',
    endTime: e.end_time || '05:00 PM',
    day: (e.day_number === 2 ? 2 : 1) as 1 | 2 | 3,
    teamSize: e.min_team_size === e.max_team_size ? (e.min_team_size === 1 ? 'Individual' : `${e.min_team_size} Members`) : `${e.min_team_size}-${e.max_team_size} Members`,
    minTeamSize: Number(e.min_team_size) || 1,
    maxTeamSize: Number(e.max_team_size) || 1,
    fee: Number(e.fee) || 0,
    prizePool: e.prize_pool || 'Certificates & Trophies',
    rules: Array.isArray(e.rules) ? e.rules : (typeof e.rules === 'string' ? JSON.parse(e.rules) : []),
    eligibility: e.eligibility || '',
    coordinators: Array.isArray(e.coordinators) ? e.coordinators : [],
    image: e.poster_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
    rulebookUrl: e.rulebook_url || '',
    unstopUrl: e.unstop_url || e.registration_url || '',
    registrationUrl: e.registration_url || e.unstop_url || '',
    isPopular: Boolean(e.is_popular || e.is_featured),
    registrationOpen: Boolean(e.registration_open),
    clubName: e.club_name || e.category || 'Parinaam',
    clubColor: e.club_color || '#a855f7',
  };
}

export const FeaturedEvents = () => {
  const [selectedEvent, setSelectedEvent] = useState<FestEvent | null>(null);
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'All'>('All');
  const [events, setEvents] = useState<FestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const categories: (EventCategory | 'All')[] = [
    'All',
    'Coding & Hackathon',
    'Robotics',
    'Gaming',
    'Cultural',
    'Workshops',
  ];

  useEffect(() => {
    fetch('/api/events?status=published&limit=50')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data.events)) {
          setEvents(data.data.events.map(mapApiEventToFestEvent));
        }
      })
      .catch(err => console.error('Failed to load published events:', err))
      .finally(() => setLoading(false));
  }, []);

  const sortedEvents = [...events].sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
  const filteredEvents = activeCategory === 'All'
    ? sortedEvents.slice(0, 6)
    : sortedEvents.filter((e) => e.category === activeCategory);

  const handleQuickRegister = (event: FestEvent) => {
    router.push(user ? '/events' : `/auth/register?event=${event.id}`);
  };

  return (
    <section className="py-20 bg-[#05030a] border-b border-purple-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>EVENTS & COMPETITIONS</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              Featured Competitions
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              From 24-hour hackathons and robowars to esports battles and battle of the bands. Find your event and sign up.
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wide"
          >
            <span>Browse All Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-pixel">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white border-purple-500 shadow-purple-glow'
                  : 'bg-purple-950/40 text-slate-300 border-purple-900/60 hover:border-purple-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div className="py-16 flex items-center justify-center text-purple-400 gap-2 font-mono text-sm">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading festival events...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 px-6 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 text-center max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">
              <Sparkles size={26} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Events are being scheduled</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
              The clubs are finalizing event details and rulebooks. Check back shortly or view the schedule.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href={user ? '/dashboard/pass' : '/auth/register'}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all"
              >
                {user ? 'See Delegate Pass' : 'Get Delegate Pass'}
              </Link>
              <Link
                href="/schedule"
                className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition-all"
              >
                View Fest Timeline
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={(evt) => setSelectedEvent(evt)}
                onRegisterQuick={handleQuickRegister}
              />
            ))}
          </div>
        )}

        {/* Modal for detail view */}
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegister={handleQuickRegister}
        />

      </div>
    </section>
  );
};

