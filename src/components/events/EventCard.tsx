'use client';

import React, { useState } from 'react';
import { FestEvent } from '../../types';
import { Calendar, Clock, MapPin, Users, Trophy, ChevronRight, Check, ShoppingBag, ExternalLink, Ticket } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useFest } from '../../context/FestContext';
import { useCart } from '../../context/CartContext';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isStudentProfileComplete } from '@/lib/institutionPolicy';
import { EventRegistrationModal } from './EventRegistrationModal';

interface EventCardProps {
  event: FestEvent;
  onSelect: (event: FestEvent) => void;
  onRegisterQuick?: (event: FestEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { isInCart, isConfirmed } = useCart();
  const registered = isConfirmed(event.id);
  const inCart = isInCart(event.id);

  const [regModalOpen, setRegModalOpen] = useState(false);

  const isStudent = user?.role === 'student';
  const isProfileComplete = isStudentProfileComplete(user);
  const isAdmin = user?.role === 'club_admin' || user?.role === 'super_admin';
  const hasUnstop = Boolean(event.unstopUrl || event.registrationUrl);
  const unstopLink = (event.unstopUrl || event.registrationUrl || '').startsWith('http')
    ? (event.unstopUrl || event.registrationUrl)
    : `https://${event.unstopUrl || event.registrationUrl}`;

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const cardInner = (
    <>
      {/* Image & Badges Banner — Big Full 3:4 Poster Showcase */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#070410] flex items-center justify-center border-b border-purple-900/30">
        <img
          src={event.image}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-125 pointer-events-none"
        />
        <img
          src={event.image}
          alt={event.name}
          className="relative z-10 w-full h-full object-contain p-1 group-hover:scale-[1.02] transition-transform duration-300 drop-shadow-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0716] via-transparent to-transparent pointer-events-none z-10" />

        {/* Prize Pool Tag */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/90 backdrop-blur-md text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-lg">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{event.prizePool}</span>
        </div>

        {/* Register Badge / Cart Toggle — Rendered ONLY for non-confirmed guests/students if not Unstop */}
        {!isAdmin && !registered && !hasUnstop && (
          <button
            onClick={handleRegisterClick}
            className={`absolute bottom-3.5 right-3.5 z-20 p-2.5 rounded-xl transition-all border shadow-lg ${
              inCart && isStudent
                ? 'bg-purple-600 text-white border-purple-400 scale-105 shadow-purple-900/40'
                : 'bg-black/85 backdrop-blur-md text-slate-300 border-white/20 hover:text-purple-300 hover:border-purple-500/50'
            }`}
            title={!user ? "Sign in to register" : inCart ? "In your Cart — Click to manage" : "Register for Event"}
          >
            <Ticket size={16} className={inCart && isStudent ? 'text-white' : ''} />
          </button>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="text-purple-400 font-semibold">{event.eventCode}</span>
            <span className="text-slate-300">{event.teamSize}</span>
          </div>

          <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug font-display">
            {event.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {event.shortDescription}
          </p>
        </div>

        {/* Key Details */}
        <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-purple-950">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{event.date} • {event.startTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Actions Footer with Price Tag at bottom */}
        <div className="pt-3 border-t border-purple-950 flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-black/60 border border-amber-500/30 shrink-0">
            {event.fee === 0 ? 'FREE' : formatCurrency(event.fee)}
          </span>
          <button
            onClick={() => onSelect(event)}
            className="flex-1 py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-xs font-semibold text-purple-200 border border-purple-900/60 transition-colors flex items-center justify-center gap-1"
          >
            <span>Rules & Info</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {hasUnstop ? (
            <a
              href={unstopLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-950/50"
            >
              <span>Register</span>
              <ExternalLink size={12} />
            </a>
          ) : !isAdmin && (
            registered ? (
              <span className="py-2 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>You're registered!</span>
              </span>
            ) : (
              <button
                onClick={handleRegisterClick}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  inCart && isStudent
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-glow'
                }`}
              >
                {inCart && isStudent ? (
                  <>
                    <Check size={13} />
                    <span>✓ In Cart</span>
                  </>
                ) : (
                  <>
                    <Ticket size={13} />
                    <span>Register</span>
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {event.isPopular ? (
        <div className="flagship-wrapper h-full flex flex-col">
          <div className="bg-[#0b0716] border-0 rounded-[calc(1.125rem-2px)] flex flex-col justify-between transition-all duration-300 group mi-glow-card h-full">
            {cardInner}
          </div>
        </div>
      ) : (
        <div className="bg-[#0b0716] border border-purple-900/50 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-purple-500/70 transition-all duration-300 group mi-glow-card h-full">
          {cardInner}
        </div>
      )}

      {/* Team / Individual Registration Modal */}
      <EventRegistrationModal
        event={{
          id: event.id,
          name: event.name,
          club_name: event.clubName || (event as any).club_name || (event as any).organizer || 'Chakravyuha Club',
          event_code: event.eventCode,
          category: event.category,
          poster_url: event.image,
          fee: event.fee,
          amrita_fee: (event as any).amrita_fee ?? (event.minTeamSize && event.minTeamSize > 1 ? 150 : event.fee),
          other_fee: (event as any).other_fee ?? (event.minTeamSize && event.minTeamSize > 1 ? 300 : event.fee),
          min_team_size: event.minTeamSize || 1,
          max_team_size: event.maxTeamSize || 1,
          registration_open: true,
          status: 'published',
        }}
        isOpen={regModalOpen}
        onClose={() => setRegModalOpen(false)}
      />
    </>
  );
};
