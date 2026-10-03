'use client';

import React, { useState, useCallback } from 'react';
import { UserPlus, X, Loader2, CheckCircle2, AlertCircle, Search, Users, ShieldCheck } from 'lucide-react';

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  roll_number?: string | null;
  is_amrita_student: boolean;
  college_name?: string | null;
}

interface TeamMemberSelectorProps {
  eventId: string;
  minTeamSize: number;
  maxTeamSize: number;
  /** Members selected so far (not including leader themselves) */
  members: TeamMember[];
  onChange: (members: TeamMember[]) => void;
  leaderIsAmrita: boolean;
  disabled?: boolean;
  targetSize?: number;
  onTargetSizeChange?: (size: number) => void;
  showLeaderCard?: boolean;
  leaderName?: string;
  leaderEmail?: string;
  leaderRoll?: string | null;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  eventId,
  minTeamSize = 2,
  maxTeamSize = 3,
  members,
  onChange,
  leaderIsAmrita,
  disabled = false,
  targetSize,
  onTargetSizeChange,
  showLeaderCard = false,
  leaderName,
  leaderEmail,
  leaderRoll,
}) => {
  const [selectedSize, setSelectedSize] = useState<number>(targetSize || Math.max(minTeamSize, 2));
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const effectiveTargetSize = targetSize !== undefined ? targetSize : selectedSize;
  const maxMembersToAdd = effectiveTargetSize - 1; // leader is slot 1
  const totalWithLeader = members.length + 1;
  const isComplete = totalWithLeader >= minTeamSize && totalWithLeader === effectiveTargetSize;

  const handleSizeChange = (size: number) => {
    setSelectedSize(size);
    if (onTargetSizeChange) onTargetSizeChange(size);
    if (members.length > size - 1) {
      onChange(members.slice(0, size - 1));
    }
  };

  const handleVerifyAndAdd = useCallback(async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearchError('');
    setSuccessMsg('');

    const input = searchInput.trim();

    try {
      const res = await fetch(`/api/users/lookup?q=${encodeURIComponent(input)}`);
      const data = await res.json();

      if (!data.success) {
        setSearchError(data.error || 'No registered student found with that email or roll number. They must have an account on Parinaam.');
        return;
      }

      const found: TeamMember = data.data.user;

      // Check if already added
      if (members.some(m => m.id === found.id)) {
        setSearchError(`${found.full_name} is already added to your team.`);
        return;
      }

      // Validate college constraint
      const memberIsAmrita = Boolean(found.is_amrita_student);
      if (leaderIsAmrita && !memberIsAmrita) {
        setSearchError(`Amrita teams can only include registered Amrita students. ${found.full_name} is from ${found.college_name || 'an external college'}.`);
        return;
      }
      if (!leaderIsAmrita && memberIsAmrita) {
        setSearchError(`External college teams cannot include Amrita students (${found.full_name}). All members must be from external colleges.`);
        return;
      }

      // Add to team members
      if (members.length >= maxMembersToAdd) {
        setSearchError(`Team size limit reached for a team of ${effectiveTargetSize}. Increase team size to add more members.`);
        return;
      }

      const updated = [...members, found];
      onChange(updated);
      setSearchInput('');
      setSuccessMsg(`✓ Verified & Added ${found.full_name} to team!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setSearchError('Network error while verifying student. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [searchInput, members, leaderIsAmrita, maxMembersToAdd, effectiveTargetSize, onChange]);

  const handleRemove = (id: string) => {
    onChange(members.filter(m => m.id !== id));
    setSearchError('');
    setSuccessMsg('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyAndAdd();
    }
  };

  return (
    <div className="space-y-4">
      {/* Team Size Selector (if min != max) */}
      {maxTeamSize > minTeamSize && (
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/40 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-purple-300 font-bold uppercase block">
              Team Size
            </span>
            <p className="text-[11px] text-slate-400">
              Select total team members (including yourself as leader)
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {Array.from({ length: maxTeamSize - minTeamSize + 1 }, (_, i) => minTeamSize + i).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeChange(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  effectiveTargetSize === size
                    ? 'bg-purple-600 text-white shadow-purple-glow border border-purple-400'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {size} Members {size === maxTeamSize ? '(Max)' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-white">
            Team Squad Members
          </span>
        </div>
        <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
          isComplete
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          {totalWithLeader}/{effectiveTargetSize} verified (min {minTeamSize})
        </span>
      </div>

      {/* Status Warning / Success */}
      {!isComplete ? (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-400" />
          <span>
            {effectiveTargetSize - totalWithLeader > 0
              ? `Please enter and verify ${effectiveTargetSize - totalWithLeader} more registered member(s) below to complete team registration.`
              : `Minimum team size is ${minTeamSize} members.`}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
          <span>Team complete! All {effectiveTargetSize} members verified on portal. Ready to proceed to cart.</span>
        </div>
      )}

      {/* Optional Leader Card (if requested) */}
      {showLeaderCard && (
        <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              1
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">
                  {leaderName || 'You (Team Leader)'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                  LEADER
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {leaderEmail} {leaderRoll ? `• ${leaderRoll}` : ''}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
            {leaderIsAmrita ? '🏛️ Amrita Student' : '🎓 External Student'}
          </span>
        </div>
      )}

      {/* Team Member Slots List */}
      <div className="space-y-2.5">
        {/* Render Added Members */}
        {members.map((member, index) => (
          <div
            key={member.id}
            className="p-3 bg-white/5 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                {index + 2}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white truncate">{member.full_name}</p>
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {member.email} {member.roll_number ? `• ${member.roll_number}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline truncate max-w-[120px]">
                {member.college_name || (member.is_amrita_student ? 'Amrita' : 'External')}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Remove member"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Input box for adding next member if slots remaining */}
        {members.length < maxMembersToAdd && !disabled && (
          <div className="space-y-2 p-3 bg-purple-950/20 border border-dashed border-purple-500/40 rounded-xl">
            <label className="text-xs font-mono text-purple-300 font-semibold block">
              + Add Member {members.length + 2} of {effectiveTargetSize} (Search by Registered Email or Roll Number)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSearchError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    leaderIsAmrita
                      ? "Enter Amrita email (e.g. cb.en.u4cse22001@cb.amrita.edu) or Roll No"
                      : "Enter registered email or roll number"
                  }
                  className="w-full bg-[#0a0515] border border-purple-900/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyAndAdd}
                disabled={searching || !searchInput.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  searching || !searchInput.trim()
                    ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-glow'
                }`}
              >
                {searching ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={13} />
                    <span>Verify &amp; Add</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="flex items-start gap-1.5 text-xs text-red-400 pt-1">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
