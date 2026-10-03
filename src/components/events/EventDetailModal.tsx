'use client';

import React, { useState, useEffect } from 'react';
import { FestEvent } from '../../types';
import { X, Calendar, Clock, MapPin, Users, Trophy, Download, Phone, Mail, CheckCircle2, ShieldCheck, Ticket, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useFest } from '../../context/FestContext';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { isStudentProfileComplete } from '@/lib/institutionPolicy';
import { EventRegistrationModal } from './EventRegistrationModal';

interface EventDetailModalProps {
  event: FestEvent | null;
  onClose: () => void;
  onRegister?: (event: FestEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { isInCart, isConfirmed } = useCart();

  const [regModalOpen, setRegModalOpen] = useState(false);

  React.useEffect(() => {
    if (event) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = orig;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [event, onClose]);

  if (!event) return null;

  const registered = isConfirmed(event.id);
  const inCart = isInCart(event.id);
  const isAdmin = user?.role === 'club_admin' || user?.role === 'super_admin';
  const isStudent = user?.role === 'student';
  const isProfileComplete = isStudentProfileComplete(user);
  const hasUnstop = Boolean(event.unstopUrl || event.registrationUrl);
  const unstopLink = (event.unstopUrl || event.registrationUrl || '').startsWith('http')
    ? (event.unstopUrl || event.registrationUrl)
    : `https://${event.unstopUrl || event.registrationUrl}`;

  const handleRegisterClick = () => {
    if (!user) {
      onClose();
      router.push('/auth/login?redirect=/events');
      return;
    }
    if (isStudent && !isProfileComplete) {
      alert('Please complete your platform registration profile before choosing events.');
      onClose();
      router.push('/dashboard/profile');
      return;
    }
    if (isStudent) {
      setRegModalOpen(true);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto overscroll-contain animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-purple-900/50 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative my-auto text-slate-200 animate-in fade-in zoom-in-95 duration-200 overscroll-contain"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image Header */}
        <div className="relative h-60 w-full bg-slate-950">
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-primary text-white px-2.5 py-0.5 rounded">
                {event.category}
              </span>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {event.eventCode}
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              {event.name}
            </h2>
            <p className="text-sm font-medium text-slate-300">
              {event.tagline}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[calc(85vh-240px)] overflow-y-auto">
          
          {/* Key Facts Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-slate-400 block mb-1">Registration Fee</span>
              <span className="text-base font-bold text-white">{formatCurrency(event.fee)}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Prize Pool</span>
              <span className="text-base font-bold text-amber-400">{event.prizePool}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Participation</span>
              <span className="text-base font-bold text-emerald-400">{event.teamSize}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Schedule</span>
              <span className="text-base font-bold text-slate-200">Day {event.day} ({event.startTime})</span>
            </div>
          </div>

          {/* Logistics Line */}
          <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-300 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{event.date} • {event.startTime} - {event.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{event.venue}</span>
            </div>
          </div>

          {/* Overview */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-display">
              About The Competition
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {event.fullDescription}
            </p>
          </div>

          {/* Eligibility */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Eligibility & Requirements</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {event.eligibility}
            </p>
          </div>

          {/* Official Rules */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-display">
              Rulebook Highlights
            </h3>
            <ul className="space-y-2.5">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coordinators Contact */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Event Heads & Coordinators
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.coordinators.map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-white block">{c.name} ({c.role})</span>
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {c.phone}
                    </span>
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-primary" />
                        {c.email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => alert(`Rulebook for ${event.name} has been downloaded.`)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Official Rulebook (PDF)</span>
          </button>

          {hasUnstop ? (
            <a
              href={unstopLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 shadow-fest-brand flex items-center justify-center gap-2 transition-all"
            >
              <span>Register on Unstop</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : !isAdmin ? (
            registered ? (
              <div className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-bold font-mono flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>You're registered!</span>
              </div>
            ) : (
              <button
                onClick={handleRegisterClick}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl text-white text-sm font-bold shadow-fest-brand flex items-center justify-center gap-2 transition-all ${
                  inCart && isStudent
                    ? 'bg-purple-600 hover:bg-purple-500 border border-purple-500'
                    : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>
                  {!user
                    ? "Sign in to Register"
                    : !isProfileComplete
                      ? "Complete Profile to Register"
                      : inCart
                        ? "✓ In Cart"
                        : "Register for Event"}
                </span>
              </button>
            )
          ) : (
            <span className="text-purple-300 text-xs font-mono">Viewing in Admin Mode</span>
          )}
        </div>

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
      </div>
    </div>
  );
};

