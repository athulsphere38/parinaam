'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { isInstitutionalEmail, STANDARD_PLATFORM_FEE_INR, isStudentProfileComplete } from '@/lib/institutionPolicy';
import { MockPaymentModal } from './MockPaymentModal';
import { TeamMemberSelector, TeamMember } from '@/components/events/TeamMemberSelector';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EventItem {
  id: string;
  name: string;
  category: string;
  fee: number;
  amrita_fee?: number | null;
  other_fee?: number | null;
  min_team_size?: number;
  max_team_size?: number;
  club_name: string;
  poster_url: string;
  date_start: string;
  start_time: string;
  registration_open?: boolean;
  status?: string;
}


export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cartItemIds, cartTeamData, setEventTeamData, removeFromCart, clearCart, refreshRegistrations } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Team members: map from eventId -> array of added members
  const [teamMembersMap, setTeamMembersMap] = useState<Record<string, TeamMember[]>>({});
  const [expandedTeamEventId, setExpandedTeamEventId] = useState<string | null>(null);

  // Sync team members from CartContext when opening or when cartTeamData changes
  useEffect(() => {
    if (isOpen && cartTeamData) {
      const initial: Record<string, TeamMember[]> = {};
      Object.entries(cartTeamData).forEach(([evId, data]) => {
        if (data.teamMembers && data.teamMembers.length > 0) {
          initial[evId] = data.teamMembers;
        }
      });
      setTeamMembersMap(prev => ({ ...initial, ...prev }));
    }
  }, [isOpen, cartTeamData]);

  // Mock checkout modal state
  const [mockModalOpen, setMockModalOpen] = useState(false);
  const [mockOrderData, setMockOrderData] = useState<{
    order_id: string;
    amount: number;
    currency: string;
    payment_db_id: string;
  } | null>(null);

  // Close drawer on Escape key press
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

  // Fetch event details for cart items whenever drawer opens or cartItemIds change
  useEffect(() => {
    if (!isOpen || cartItemIds.length === 0) {
      setEvents([]);
      return;
    }

    setLoadingEvents(true);
    fetch('/api/events?status=all&limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data.events)) {
          const matchedMap = new Map<string, any>(data.data.events.map((e: any) => [e.id, e]));
          const matched = cartItemIds.map((id) => {
            const e: any = matchedMap.get(id);
            if (e) {
              return {
                ...e,
                fee: Number(e.fee) || 0,
                registration_open: Boolean(e.registration_open),
                status: e.status,
              };
            }
            return {
              id,
              name: 'Unavailable Event',
              category: 'N/A',
              fee: 0,
              club_name: 'System',
              poster_url: '',
              date_start: '',
              start_time: '',
              registration_open: false,
              status: 'unavailable',
              isDeleted: true,
            };
          });
          setEvents(matched);
        }
      })
      .catch(err => console.error('Failed to load cart event details:', err))
      .finally(() => setLoadingEvents(false));
  }, [isOpen, cartItemIds]);

  const isAmrita = user ? (user.is_amrita_student || isInstitutionalEmail(user.email)) : false;

  // Compute effective fee per event based on user's college type and event fee tiers
  const getEffectiveFee = (evt: EventItem): number => {
    const isTeam = (evt.max_team_size || 1) > 1;
    if (isTeam && evt.amrita_fee != null && evt.other_fee != null) {
      return isAmrita ? Number(evt.amrita_fee) : Number(evt.other_fee);
    }
    return Number(evt.fee) || 0;
  };

  const totalFee = events.reduce((sum, e) => sum + getEffectiveFee(e), 0);

  // Check if all team events have enough team members
  const incompleteTeamEvents = events.filter(evt => {
    const minSize = evt.min_team_size || 1;
    const maxSize = evt.max_team_size || 1;
    if (maxSize <= 1) return false; // solo event, no team needed
    const added = teamMembersMap[evt.id]?.length || 0;
    const totalWithLeader = added + 1;
    return totalWithLeader < minSize;
  });

  const hasIncompleteTeams = incompleteTeamEvents.length > 0;

  const handleCheckout = async () => {
    setCheckoutError('');
    setSuccessMessage('');

    if (!user) {
      onClose();
      router.push('/auth/login?redirect=/events');
      return;
    }

    if (!isStudentProfileComplete(user)) {
      setCheckoutError('Platform registration profile completion is required before event registration checkout. Please complete your profile first.');
      return;
    }

    if (user.verification_status !== 'verified') {
      setCheckoutError('Your account verification is pending Super Admin approval before event registration.');
      return;
    }

    if (!user.is_amrita_student && !user.platform_fee_paid) {
      onClose();
      router.push('/dashboard/payment');
      return;
    }

    // Validate team completeness for all team events
    if (hasIncompleteTeams) {
      const eventNames = incompleteTeamEvents.map(e => e.name).join(', ');
      setCheckoutError(`Incomplete team registration for: ${eventNames}. Please add all required team members before proceeding to checkout.`);
      // Expand the first incomplete team event
      setExpandedTeamEventId(incompleteTeamEvents[0].id);
      return;
    }

    // Pre-checkout validation: Ensure no closed or unpublished events are in cart
    const closedEvent = events.find(e => !e.registration_open || e.status !== 'published');
    if (closedEvent) {
      setCheckoutError(`Registration for event "${closedEvent.name}" is currently closed. Please remove it from your cart to proceed.`);
      return;
    }

    setProcessingPayment(true);

    // Build team_members_data: map of eventId -> {team_member_user_ids, team_members}
    const teamMembersData: Record<string, { team_member_user_ids: string[]; team_members: { name: string; email: string }[] }> = {};
    for (const evt of events) {
      const members = teamMembersMap[evt.id] || [];
      if (members.length > 0) {
        teamMembersData[evt.id] = {
          team_member_user_ids: members.map(m => m.id),
          team_members: members.map(m => ({ name: m.full_name, email: m.email })),
        };
      }
    }

    try {
      // Step 1: Create Order Server-side (Total fee is calculated server-side from DB)
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event_fee',
          event_ids: cartItemIds,
          team_members_data: teamMembersData,
        }),
      });

      const orderData = await res.json();

      if (!orderData.success) {
        setCheckoutError(orderData.error || 'Failed to initialize checkout');
        setProcessingPayment(false);
        return;
      }

      // Step 2A: Free Events Cart (Amount = 0)
      if (orderData.data.is_free) {
        clearCart();
        await refreshRegistrations();
        setSuccessMessage('Registration confirmed for all selected free events!');
        setTimeout(() => {
          onClose();
          router.push('/dashboard');
        }, 1500);
        setProcessingPayment(false);
        return;
      }

      // Step 2B: Paid Events Cart — Trigger Cashfree Modal or Mock Checkout
      const { order_id, cf_order_id, payment_session_id, amount, payment_db_id, is_mock } = orderData.data;

      // Helper function to call server-side verification
      const verifyPaymentServer = async (paymentId: string, signature = 'cf_verified') => {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_db_id,
            order_id,
            cf_order_id,
            razorpay_order_id: order_id,
            cf_payment_id: paymentId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            type: 'event_fee',
          }),
        });

        const verifyData = await verifyRes.json();
        setProcessingPayment(false);

        if (verifyData.success) {
          clearCart();
          await refreshRegistrations();
          setSuccessMessage(verifyData.data?.message || 'Registrations confirmed successfully!');
          setTimeout(() => {
            onClose();
            router.push('/dashboard');
          }, 1500);
        } else {
          setCheckoutError(verifyData.error || 'Payment verification failed');
        }
      };

      if (payment_session_id && !is_mock) {
        const { launchCashfreeCheckout } = await import('@/lib/cashfreeCheckout');
        await launchCashfreeCheckout({
          paymentSessionId: payment_session_id,
          orderId: order_id,
          paymentDbId: payment_db_id,
          onSuccess: async (details: any) => {
            const payId = details?.paymentDetails?.cf_payment_id || `cfpay_${Date.now()}`;
            await verifyPaymentServer(payId, 'cf_success');
          },
          onFailure: (errMsg: string) => {
            setProcessingPayment(false);
            setCheckoutError(errMsg || 'Payment failed. Please try again.');
          },
          onDismiss: () => {
            setProcessingPayment(false);
            setCheckoutError('Checkout was closed. Your 15-minute capacity hold remains active.');
          },
        });
      } else {
        // Mock / fallback checkout modal in development mode
        setMockOrderData({
          order_id,
          amount,
          currency: 'INR',
          payment_db_id,
        });
        setMockModalOpen(true);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError('An unexpected error occurred during checkout.');
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-3 sm:pl-10">
        <div className="w-full max-w-md bg-[#0a0714] border-l border-purple-900/50 text-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-snug">Registration Cart</h2>
                <p className="text-slate-400 text-xs">{events.length} Event(s) Selected</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Content / Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {checkoutError && (
              <div className="flex items-start gap-2 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {loadingEvents ? (
              <div className="py-16 flex items-center justify-center text-purple-400 gap-2 font-mono text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Fetching selected events...</span>
              </div>
            ) : cartItemIds.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                  <ShoppingBag size={24} />
                </div>
                <h3 className="font-bold text-white text-base">Your Cart is Empty</h3>
                <p className="text-slate-400 text-xs max-w-xs mx-auto">
                  Browse competitions and click "Register" to configure your team or individual entry and proceed to checkout.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
                >
                  Browse Competitions →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((evt) => {
                  const isUnavailable = evt.registration_open === false || evt.status !== 'published';
                  const isTeamEvent = (evt.max_team_size || 1) > 1;
                  const effectiveFee = getEffectiveFee(evt);
                  const membersForEvt = teamMembersMap[evt.id] || [];
                  const totalWithLeader = membersForEvt.length + 1;
                  const minSize = evt.min_team_size || 1;
                  const maxSize = evt.max_team_size || 1;
                  const teamComplete = !isTeamEvent || (totalWithLeader >= minSize && totalWithLeader <= maxSize);
                  const isExpanded = expandedTeamEventId === evt.id;

                  return (
                    <div
                      key={evt.id}
                      className={`border rounded-2xl transition-all ${
                        isUnavailable
                          ? 'bg-red-500/10 border-red-500/40'
                          : !teamComplete
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-white/5 border-white/10 hover:border-purple-500/40'
                      }`}
                    >
                      {/* Event header row */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                            {evt.poster_url ? (
                              <img src={evt.poster_url} alt={evt.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-400 font-bold text-xs bg-purple-950/40">
                                EVT
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-purple-400 block truncate">{evt.club_name}</span>
                            <h4 className="text-sm font-bold text-white truncate">{evt.name}</h4>
                            {isUnavailable ? (
                              <span className="text-[11px] font-semibold text-amber-400 font-mono flex items-center gap-1">
                                <AlertTriangle size={12} className="shrink-0 text-amber-400" />
                                <span>Registration Closed — Remove</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-emerald-400 font-mono">
                                  {effectiveFee === 0 ? 'FREE' : `₹${effectiveFee}`}
                                </span>
                                {isTeamEvent && evt.amrita_fee != null && evt.other_fee != null && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    (Amrita ₹{evt.amrita_fee} / Others ₹{evt.other_fee})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isTeamEvent && !isUnavailable && (
                            <button
                              onClick={() => setExpandedTeamEventId(isExpanded ? null : evt.id)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                teamComplete
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              }`}
                              title="Manage team members"
                            >
                              <Users size={12} />
                              <span>{totalWithLeader}/{maxSize}</span>
                            </button>
                          )}
                          <button
                            onClick={() => removeFromCart(evt.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove Event"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Team member selector (expanded) */}
                      {isTeamEvent && isExpanded && !isUnavailable && (
                        <div className="px-4 pb-4 border-t border-white/10 pt-3">
                          <TeamMemberSelector
                            eventId={evt.id}
                            minTeamSize={minSize}
                            maxTeamSize={maxSize}
                            members={membersForEvt}
                            onChange={(newMembers) => {
                              setTeamMembersMap(prev => ({ ...prev, [evt.id]: newMembers }));
                              const existing = cartTeamData[evt.id] || {};
                              setEventTeamData(evt.id, { ...existing, teamMembers: newMembers });
                            }}
                            leaderIsAmrita={isAmrita}
                          />
                        </div>
                      )}

                      {/* Team incomplete warning (collapsed) */}
                      {isTeamEvent && !isExpanded && !teamComplete && !isUnavailable && (
                        <div
                          className="px-4 pb-3 flex items-center gap-2 text-xs text-amber-300 cursor-pointer"
                          onClick={() => setExpandedTeamEventId(evt.id)}
                        >
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>Add {minSize - totalWithLeader} more team member(s) to proceed. Click to manage team.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            )}
          </div>

          {/* Footer Summary & Pay Button */}
          {cartItemIds.length > 0 && (() => {
            const platformFee = isAmrita || (user?.platform_fee_paid) ? 0 : STANDARD_PLATFORM_FEE_INR;
            const grandTotal = totalFee + platformFee;

            return (
              <div className="p-6 border-t border-white/10 bg-[#080511] space-y-4">
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Selected Competitions ({events.length})</span>
                    <span className="text-white font-mono font-semibold">₹{totalFee}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <span>Platform Registration Fee</span>
                      {isAmrita && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                          Waived
                        </span>
                      )}
                    </span>
                    <span className="font-mono">
                      {isAmrita ? (
                        <span className="text-emerald-400 font-bold">₹0</span>
                      ) : user?.platform_fee_paid ? (
                        <span className="text-emerald-400">₹0 (Paid)</span>
                      ) : (
                        <span className="text-purple-300 font-semibold">₹{STANDARD_PLATFORM_FEE_INR}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-white/10 text-white">
                    <span>Total Payable Amount</span>
                    <span className="text-purple-400 font-mono text-lg">
                      {grandTotal === 0 ? 'FREE' : `₹${grandTotal}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span>Verified backend price calculation. One payment covers all selected events.</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processingPayment}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>{user ? `Checkout & Pay ${grandTotal === 0 ? 'Free' : `₹${grandTotal}`}` : 'Sign In to Register'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Development Mock Cashfree Test Checkout Modal */}
      {mockOrderData && (
        <MockPaymentModal
          isOpen={mockModalOpen}
          onClose={() => {
            setMockModalOpen(false);
            setProcessingPayment(false);
          }}
          orderData={mockOrderData}
          events={events.map((e) => ({ id: e.id, name: e.name, fee: getEffectiveFee(e) }))}
          totalFee={totalFee}
          platformFee={isAmrita || user?.platform_fee_paid ? 0 : STANDARD_PLATFORM_FEE_INR}
          grandTotal={totalFee + (isAmrita || user?.platform_fee_paid ? 0 : STANDARD_PLATFORM_FEE_INR)}
          userEmail={user?.email}
          userName={user?.full_name}
          onVerifySuccess={async (paymentId, signature) => {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                payment_db_id: mockOrderData.payment_db_id,
                razorpay_order_id: mockOrderData.order_id,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                type: 'event_fee',
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              await refreshRegistrations();
              setSuccessMessage(verifyData.data?.message || 'Registrations confirmed successfully!');
              setTimeout(() => {
                setMockModalOpen(false);
                onClose();
                router.push('/dashboard');
              }, 1500);
            } else {
              throw new Error(verifyData.error || 'Mock verification failed');
            }
          }}
          onPaymentFailed={(reason) => {
            setCheckoutError(reason);
            setProcessingPayment(false);
          }}
        />
      )}
    </div>
  );
};
