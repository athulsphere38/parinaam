'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldAlert, ArrowRight, Lock, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role === 'student' && !user.is_amrita_student && !user.platform_fee_paid) {
        // Outside student without payment is not allowed on dashboard
        router.replace('/auth/register');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05030a] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-mono">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Strict Gate: Outside student who has not paid the ₹1,000 pass
  if (user.role === 'student' && !user.is_amrita_student && !user.platform_fee_paid) {
    return (
      <div className="min-h-screen bg-[#05030a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/[0.03] border border-purple-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-5 text-purple-400 shadow-lg shadow-purple-900/40">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            Pass Payment Required
          </span>

          <h2 className="text-xl font-bold text-white mb-2">
            Festival Pass Not Activated
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            For external college delegates, dashboard access and QR pass generation require completing the fixed <strong className="text-purple-300">₹1,000 Festival Pass</strong> payment.
          </p>

          <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4 text-left text-xs space-y-2 mb-6">
            <p className="font-semibold text-purple-200">Included Flagship Access:</p>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <span>✓ Live Concert & DJ</span>
              <span>✓ Garba Night</span>
              <span>✓ Auto Expo</span>
              <span>✓ Tholu Bommalata</span>
            </div>
          </div>

          <Link
            href="/auth/register"
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Complete Pass Checkout (₹1,000)
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
