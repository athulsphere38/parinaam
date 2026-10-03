'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, CheckCircle2, XCircle, X, Loader2, Sparkles, ShoppingBag } from 'lucide-react';

interface EventSummaryItem {
  id: string;
  name: string;
  fee: number;
}

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    order_id: string;
    amount: number; // in paise
    currency: string;
    payment_db_id: string;
  };
  events: EventSummaryItem[];
  totalFee: number;
  platformFee: number;
  grandTotal: number;
  userEmail?: string;
  userName?: string;
  onVerifySuccess: (paymentId: string, signature: string) => Promise<void>;
  onPaymentFailed: (reason: string) => void;
}

export const MockPaymentModal: React.FC<MockPaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  events,
  totalFee,
  platformFee,
  grandTotal,
  userEmail,
  userName,
  onVerifySuccess,
  onPaymentFailed,
}) => {
  const [processing, setProcessing] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setProcessing(true);
    const mockPaymentId = `cfpay_sim_${Date.now()}`;
    const mockSignature = 'cf_verified_signature';

    try {
      await onVerifySuccess(mockPaymentId, mockSignature);
      setSimulatedSuccess(true);
    } catch {
      onPaymentFailed('Payment verification failed on server.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateFailure = () => {
    onPaymentFailed('Simulated payment failure (insufficient test funds / cancelled).');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0d0718] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded tracking-wider">
                CASHFREE CHECKOUT
              </span>
              <h2 className="text-sm font-bold text-white mt-0.5">Payment Verification</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {simulatedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-extrabold text-white">✓ Payment Verified!</h3>
            <p className="text-slate-300 text-xs leading-relaxed max-w-xs mx-auto">
              Your payment was verified by the server transaction endpoint. Registrations are now confirmed.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Grand Total Box */}
            <div className="p-4 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-300 font-semibold">Total Amount Due</p>
                <p className="text-2xl font-mono font-black text-white">₹{grandTotal}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">Order ID</span>
                <p className="text-xs font-mono text-purple-300 font-bold truncate max-w-[140px]">
                  {orderData.order_id}
                </p>
              </div>
            </div>

            {/* Event Inclusions Summary */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-purple-400" />
                Items in Cart ({events.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-200 truncate max-w-[240px]">{ev.name}</span>
                    <span className="font-mono text-purple-300 font-bold">₹{ev.fee}</span>
                  </div>
                ))}
                {platformFee > 0 && (
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                    <span className="font-medium text-purple-200">Festival Delegate Pass</span>
                    <span className="font-mono text-purple-300 font-bold">₹{platformFee}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mock QR Code Scanner */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center space-y-3">
              <p className="text-[11px] text-slate-400">Scan to simulate instant UPI mobile checkout</p>
              <div className="p-3 bg-white rounded-xl inline-block shadow-lg">
                <QRCodeSVG
                  value={`upi://pay?pa=parinaam@cashfree&pn=Parinaam2026&am=${grandTotal}&tr=${orderData.order_id}`}
                  size={130}
                  level="M"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Payer: {userName || userEmail || 'Student'}
              </p>
            </div>

            {/* Simulation Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-purple-600 to-pink-600 hover:from-emerald-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying with Server...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm Payment (₹{grandTotal})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSimulateFailure}
                disabled={processing}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 font-semibold text-xs border border-white/5 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Simulate Gateway Failure / Cancel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export const MockRazorpayModal = MockPaymentModal;
