'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { isStudentProfileComplete } from '@/lib/institutionPolicy';
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal';

export interface EventDetail {
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

export function EventRegistrationActions({ event }: { event: EventDetail }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isInCart, isConfirmed } = useCart();

  const [regModalOpen, setRegModalOpen] = useState(false);

  const inCart = isInCart(event.id);
  const isConfirmedReg = isConfirmed(event.id);
  const isStudent = user?.role === 'student';
  const isProfileComplete = isStudentProfileComplete(user);

  const spotsLeft = event.capacity ? event.capacity - event.enrolled : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  const isRegistrationOpen = event.status === 'published' ? (event.registration_open ?? true) : Boolean(event.registration_open);

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/events/${event.id}`);
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
    <>
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
    </>
  );
}
