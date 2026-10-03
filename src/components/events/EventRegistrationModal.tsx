'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, User, ShieldCheck, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart, CartTeamData } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { isStudentProfileComplete, isInstitutionalEmail } from '@/lib/institutionPolicy';
import { TeamMemberSelector, TeamMember } from './TeamMemberSelector';

export interface EventRegistrationItem {
  id: string;
  name: string;
  club_name?: string;
  club_color?: string;
  poster_url?: string;
  image?: string;
  event_code?: string;
  category?: string;
  fee: number;
  amrita_fee?: number | null;
  other_fee?: number | null;
  min_team_size?: number;
  max_team_size?: number;
  registration_open?: boolean;
  status?: string;
  unstop_url?: string;
  registration_url?: string;
}

interface EventRegistrationModalProps {
  event: EventRegistrationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { addToCart, isInCart, isConfirmed, getEventTeamData, openCart } = useCart();
  const router = useRouter();

  const [participationType, setParticipationType] = useState<'individual' | 'team'>('team');
  const [targetTeamSize, setTargetTeamSize] = useState<number>(2);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamName, setTeamName] = useState('');
  const [validationError, setValidationError] = useState('');

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, onClose]);

  // Load existing team data if already in cart
  useEffect(() => {
    if (event && isOpen) {
      const minSize = event.min_team_size || 2;
      const maxSize = event.max_team_size || 3;
      const existing = getEventTeamData(event.id);
      if (existing) {
        if (existing.participationType) setParticipationType(existing.participationType);
        if (existing.teamMembers) {
          setTeamMembers(existing.teamMembers);
          setTargetTeamSize(Math.max(minSize, existing.teamMembers.length + 1));
        }
        if (existing.teamName) setTeamName(existing.teamName);
      } else {
        const isTeamDefault = (event.max_team_size || 1) > 1;
        setParticipationType(isTeamDefault ? 'team' : 'individual');
        setTeamMembers([]);
        setTeamName('');
        setTargetTeamSize(Math.max(minSize, 2));
      }
      setValidationError('');
    }
  }, [event, isOpen, getEventTeamData]);

  if (!isOpen || !event) return null;

  const isAmrita = user ? (user.is_amrita_student || isInstitutionalEmail(user.email)) : false;
  const isProfileComplete = isStudentProfileComplete(user);
  const minTeamSize = event.min_team_size || 2;
  const maxTeamSize = event.max_team_size || 3;
  const isTeamCapable = maxTeamSize > 1;
  const allowIndividualChoice = minTeamSize <= 1 && isTeamCapable;

  // Calculate effective fee
  const getEffectiveFee = (): number => {
    if (isTeamCapable && event.amrita_fee != null && event.other_fee != null) {
      return isAmrita ? Number(event.amrita_fee) : Number(event.other_fee);
    }
    return Number(event.fee) || 0;
  };

  const effectiveFee = getEffectiveFee();
  const totalTeamCount = teamMembers.length + 1; // leader + added members
  const isTeamComplete = !isTeamCapable || participationType === 'individual' || (totalTeamCount >= minTeamSize && totalTeamCount === targetTeamSize);

  const handleAddToCart = () => {
    setValidationError('');

    if (!user) {
      onClose();
      router.push(`/auth/login?redirect=/events/${event.id}`);
      return;
    }

    if (!isProfileComplete) {
      alert('Please complete your student profile registration before choosing events.');
      onClose();
      router.push('/dashboard/profile');
      return;
    }

    if (participationType === 'team' && isTeamCapable) {
      if (totalTeamCount < minTeamSize) {
        setValidationError(`Incomplete team: Please add at least ${minTeamSize - totalTeamCount} more team member(s) to reach the minimum size of ${minTeamSize}.`);
        return;
      }
      if (totalTeamCount < targetTeamSize) {
        setValidationError(`Incomplete team: You selected a team size of ${targetTeamSize}. Please add ${targetTeamSize - totalTeamCount} more member(s).`);
        return;
      }
      if (totalTeamCount > maxTeamSize) {
        setValidationError(`Team exceeds maximum allowed size of ${maxTeamSize} members.`);
        return;
      }
    }

    // Save to cart with team details
    const teamData: CartTeamData = {
      participationType,
      teamMembers: participationType === 'team' ? teamMembers : [],
      teamName: teamName.trim() || undefined,
    };

    addToCart(event.id, event.name, teamData);
    onClose();
    openCart();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b0716] border border-purple-900/60 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl text-slate-200 my-auto animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0e091e]">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider block truncate">
                {event.club_name || 'Event Registration'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white truncate font-display">
                {event.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Price & College Tier Badge Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/50 via-fuchsia-950/30 to-purple-950/50 border border-purple-500/30 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-purple-300 block">
                {isAmrita ? '🏛️ Amrita Student Fee Tier' : '🎓 External Student Fee Tier'}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-white">
                  {effectiveFee === 0 ? 'FREE' : `₹${effectiveFee}`}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {isTeamCapable ? 'flat fee per team' : 'per participant'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                isAmrita
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {isAmrita ? 'AMRITA VERIFIED' : 'EXTERNAL COLLEGE'}
              </span>
              {isTeamCapable && event.amrita_fee != null && event.other_fee != null && (
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Amrita ₹{event.amrita_fee} | Others ₹{event.other_fee}
                </p>
              )}
            </div>
          </div>

          {/* Participation Mode (if flexible) */}
          {isTeamCapable && (
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                Participation Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setParticipationType('team')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    participationType === 'team'
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-purple-glow'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={14} />
                  <span>Team ({minTeamSize}–{maxTeamSize} Members)</span>
                </button>

                {allowIndividualChoice ? (
                  <button
                    type="button"
                    onClick={() => setParticipationType('individual')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      participationType === 'individual'
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-purple-glow'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User size={14} />
                    <span>Solo / Individual</span>
                  </button>
                ) : (
                  <div className="py-2.5 px-3 rounded-xl border border-white/5 bg-white/2 text-[11px] font-mono text-slate-500 flex items-center justify-center text-center">
                    Team Required (Min {minTeamSize})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Configuration Section */}
          {isTeamCapable && participationType === 'team' && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              
              {/* Optional Team Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 font-semibold uppercase">
                  Team Name <span className="text-slate-500 normal-case">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Cyber Knights, Team Phoenix"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Team Leader Card */}
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    👑
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {user?.full_name || user?.email || 'You'}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">
                        Leader
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {user?.email} {user?.roll_number ? `• ${user.roll_number}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
                  Slot 1 of {targetTeamSize}
                </span>
              </div>

              {/* Team Member Selector */}
              <TeamMemberSelector
                eventId={event.id}
                minTeamSize={minTeamSize}
                maxTeamSize={maxTeamSize}
                targetSize={targetTeamSize}
                onTargetSizeChange={setTargetTeamSize}
                members={teamMembers}
                onChange={setTeamMembers}
                leaderIsAmrita={isAmrita}
                showLeaderCard={false}
              />
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#0e091e] border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isTeamComplete}
            className={`flex-1 py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
              !isTeamComplete
                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-glow active:scale-98'
            }`}
          >
            <ShoppingBag size={15} />
            <span>
              {!isTeamComplete
                ? `Complete ${targetTeamSize} Team Members to Proceed`
                : `Register & Add to Cart — ${effectiveFee === 0 ? 'FREE' : `₹${effectiveFee}`}`}
            </span>
            {isTeamComplete && <ArrowRight size={14} />}
          </button>
        </div>

      </div>
    </div>
  );
};
