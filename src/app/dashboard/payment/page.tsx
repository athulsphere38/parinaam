'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Loader2, IndianRupee, Shield } from 'lucide-react';
import { useRequireAuth } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import { launchCashfreeCheckout } from '@/lib/cashfreeCheckout';

function PaymentContent() {
  const { user } = useRequireAuth();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const registrationId = searchParams.get('registration_id');
  const eventId        = searchParams.get('event_id');
  const type           = registrationId ? 'event_fee' : 'platform_fee';

  const [info, setInfo]       = useState<{ amount: number; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.is_amrita_student && type === 'platform_fee') {
      router.push('/dashboard/pass');
      return;
    }
    if (type === 'platform_fee') {
      // Fetch platform fee from config
      fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'platform_fee' }),
      }).then(r => r.json()).then(d => {
        if (d.success) {
          if (d.data?.is_free || d.data?.amount === 0) {
            router.push('/dashboard/pass');
          } else {
            setInfo({ amount: (d.data?.amount || 100000) / 100, description: 'Parinaam 2026 Festival Delegate Pass' });
          }
        } else if (d.error?.includes('already paid')) {
          router.push('/dashboard/pass');
        }
      }).finally(() => setLoading(false));
    } else if (eventId) {
      // Get event details for amount display
      fetch(`/api/events/${eventId}`).then(r => r.json()).then(d => {
        if (d.success) setInfo({ amount: d.data.event.fee, description: `Registration: ${d.data.event.name}` });
      }).finally(() => setLoading(false));
    }
  }, [user, type, eventId, router]);

  const handlePay = async () => {
    if (!info) return;
    setPaying(true);
    setError('');

    try {
      // 1. Create order server-side via POST /api/payments/create-order
      const ordRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          registration_id: registrationId || undefined,
          event_ids: eventId ? [eventId] : undefined,
        }),
      });
      const ordData = await ordRes.json();
      if (!ordData.success) throw new Error(ordData.error || 'Failed to create payment order.');

      const orderPayload = ordData.data || ordData;

      if (orderPayload.is_free || orderPayload.amount === 0) {
        setDone(true);
        await refreshUser();
        setTimeout(() => {
          router.push(type === 'platform_fee' ? '/pass' : '/dashboard');
        }, 1500);
        return;
      }

      // 2. Open Cashfree Checkout modal
      if (orderPayload.payment_session_id) {
        await launchCashfreeCheckout({
          paymentSessionId: orderPayload.payment_session_id,
          orderId: orderPayload.order_id,
          paymentDbId: orderPayload.payment_db_id,
          onSuccess: async () => {
            // Verify on server
            try {
              await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  payment_db_id: orderPayload.payment_db_id,
                  order_id: orderPayload.order_id,
                  type,
                }),
              });
            } catch {}
            setDone(true);
            await refreshUser();
            setTimeout(() => {
              router.push(type === 'platform_fee' ? '/pass' : '/dashboard');
            }, 1500);
          },
          onFailure: (errMsg: string) => {
            setPaying(false);
            setError(errMsg);
          },
          onDismiss: () => {
            setPaying(false);
          },
        });
      } else {
        throw new Error('No active Cashfree payment session returned from server.');
      }
    } catch (e: any) {
      setError(e.message || 'Payment initiation failed.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white/5 border border-white/10 rounded-3xl p-10 max-w-md w-full backdrop-blur-xl">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-slate-400 text-sm mb-4">
            {type === 'platform_fee'
              ? 'Your delegate registration is confirmed. Redirecting to your digital pass…'
              : 'Your event registration is confirmed! Redirecting…'}
          </p>
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
            <CreditCard size={24} className="text-purple-400" />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-1">
            {type === 'platform_fee' ? 'Parinaam Delegate Pass' : 'Event Registration'}
          </h1>
          <p className="text-slate-400 text-sm mb-6">{info?.description || 'Complete your checkout'}</p>

          {/* Amount Box */}
          {info && (
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-6 mb-6 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Amount to Pay</p>
              <p className="text-4xl font-bold text-white">₹{info.amount}</p>
              {type === 'platform_fee' && (
                <p className="text-slate-600 text-xs mt-2">One-time fee · Unlocks access to all event registrations</p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button onClick={handlePay} disabled={paying || !info}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/30">
            {paying ? (
              <><Loader2 size={18} className="animate-spin" /> Processing…</>
            ) : (
              <><IndianRupee size={18} /> {type === 'platform_fee' ? 'Pay & Unlock Platform Access' : `Pay ₹${info?.amount}`}</>
            )}
          </button>

          <p className="text-slate-500 text-xs text-center mt-3 flex items-center justify-center gap-1.5">
            <Shield size={12} className="text-emerald-400" />
            <span>Secured by Cashfree Payment Gateway · 256-bit SSL encryption</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
