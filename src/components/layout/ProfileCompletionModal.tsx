'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, ChevronRight, X, UserCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isStudentProfileComplete } from '@/lib/institutionPolicy';

export const ProfileCompletionModal: React.FC = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Re-evaluate when pathname changes
  useEffect(() => {
    setDismissed(false);
  }, [pathname]);

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDismissed(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading || !user || user.role !== 'student') return null;


  // Identify missing fields based on existing database schema fields
  const missingFields: string[] = [];
  if (!user.phone?.trim()) missingFields.push('Phone Number');
  if (!user.college_name?.trim()) missingFields.push('College Name');
  if (!user.department?.trim()) missingFields.push('Department / Branch');
  if (!user.year_of_study?.trim()) missingFields.push('Year of Study');
  if (!user.is_amrita_student && !user.id_card_url?.trim()) missingFields.push('College ID Card Upload');

  const isProfileIncomplete = missingFields.length > 0;
  
  // Don't show modal if profile is complete or dismissed or user is already on the profile edit page
  if (!isProfileIncomplete || dismissed || pathname === '/dashboard/profile') return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 bg-[#0d091a] border border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-950/40 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
          <ShieldAlert size={20} />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-display">
              Complete Your Student Profile
            </h4>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
              title="Dismiss warning"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your profile is missing required information:
            <span className="font-semibold text-amber-300 ml-1 font-mono">
              {missingFields.join(', ')}
            </span>.
          </p>

          <p className="text-[11px] text-slate-400">
            Please complete your profile to enable multi-event registration &amp; QR festival pass access.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              onClick={() => setDismissed(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shadow-md shadow-amber-500/20"
            >
              <span>Complete Profile Now</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
