'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, CheckCircle2, XCircle, X, Loader2, Sparkles, ShoppingBag } from 'lucide-react';

interface EventSummaryItem {
  id: string;
  name: string;
  fee: number;
}

interface MockRazorpayModalProps {
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

export const MockRazorpayModal: React.FC<MockRazorpayModalProps> = ({
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

  const handleSimulateSuccess = async () => {
    setProcessing(true);
    try {
      const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const mockSignature = `mock_sig_${Date.now()}`;
      await onVerifySuccess(mockPaymentId, mockSignature);
      setSimulatedSuccess(true);
    } catch (err: any) {
      onPaymentFailed(err.message || 'Mock payment verification failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateFailure = () => {
    onPaymentFailed('Payment declined by development test gateway.');
    onClose();
  };

  const qrPayload = `parinaam-test-payment:${orderData.payment_db_id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b0718] border border-purple-500/40 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-pink-900/60 p-5 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded tracking-wider">
                DEVELOPMENT TEST MODE
              </span>
              <h2 className="text-sm font-bold text-white mt-0.5">Razorpay Test Checkout</h2>
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
              Your test payment was verified by the server transaction endpoint. Registrations are now confirmed.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
            >
              Continue to Pass / Dashboard →
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Customer Info */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/10 font-mono">
              <div>
                <span className="text-slate-500 block">Student</span>
                <span className="text-white font-semibold">{userName || 'Student'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Order Ref</span>
                <span className="text-purple-300 truncate max-w-[120px] block">{orderData.order_id.slice(0, 16)}</span>
              </div>
            </div>

            {/* Selected Events Breakdown */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider block">
                Selected Events ({events.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex justify-between items-center text-xs py-1 px-2.5 rounded-lg bg-white/5 border border-white/5"
                  >
                    <span className="text-slate-200 truncate max-w-[200px]">{evt.name}</span>
                    <span className="font-mono font-semibold text-purple-300">
                      {Number(evt.fee) === 0 ? 'FREE' : `₹${evt.fee}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Lines */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/50 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{totalFee}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Fee</span>
                <span>{platformFee === 0 ? '₹0 (Waived)' : `₹${platformFee}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-purple-900/60">
                <span>Total Test Payable</span>
                <span className="text-emerald-400 font-mono text-base">₹{grandTotal}</span>
              </div>
            </div>

            {/* Fake QR Code Visual */}
            <div className="text-center space-y-2 py-2">
              <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg border border-purple-500/30">
                <QRCodeSVG value={qrPayload} size={130} bgColor="#ffffff" fgColor="#0b0718" level="H" />
              </div>
              <p className="text-[11px] text-amber-300 font-mono flex items-center justify-center gap-1">
                <span>Test Payment Simulation QR — ₹{grandTotal}</span>
              </p>
            </div>

            {/* Action Simulation Controls */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleSimulateSuccess}
                disabled={processing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Test Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Simulate Successful Payment (₹{grandTotal})</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSimulateFailure}
                  disabled={processing}
                  className="py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <XCircle size={14} />
                  <span>Simulate Failure</span>
                </button>

                <button
                  onClick={onClose}
                  disabled={processing}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <X size={14} />
                  <span>Cancel Payment</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
