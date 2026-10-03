'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  GraduationCap,
  Building2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  School,
  Sparkles,
  ShieldCheck,
  IdCard,
  MapPin,
  CreditCard,
  Music,
  Flame,
  Car,
  Theater,
  Check,
  Loader2,
  QrCode,
} from 'lucide-react';
import { useAuth, RegisterData } from '@/context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { isValidEmail, isValidStudentName, MAX_STUDENT_NAME_LENGTH } from '@/lib/utils';

const AMRITA_DOMAIN = 'av.students.amrita.edu';
const STEPS = ['Category & Account', 'Student Profile', 'Pass & Payment'];

const INCLUDED_FLAGSHIP_EVENTS = [
  { name: 'Live Concert & DJ', icon: Music, desc: 'Mega pronite musical performance & EDM concert' },
  { name: 'Garba Night', icon: Flame, desc: 'High-energy cultural Garba dance celebration' },
  { name: 'Auto Expo', icon: Car, desc: 'Supercar & performance vehicle exhibition' },
  { name: 'Tholu Bommalata', icon: Theater, desc: 'Heritage shadow puppetry & traditional arts showcase' },
];

declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function RegisterPage() {
  const { register, user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [studentType, setStudentType] = useState<'amrita' | 'other'>('other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>('');

  // Payment & Pass state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    qrToken: string;
    studentName: string;
    amount: number;
  } | null>(null);

  const [registeredUserSession, setRegisteredUserSession] = useState<any>(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);

  const [form, setForm] = useState<RegisterData & { confirmPassword: string }>({
    student_type: 'other',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    college_name: '',
    roll_number: '',
    department: '',
    year_of_study: '',
    city: '',
    id_card_url: '',
  });

  useEffect(() => {
    if (user && user.platform_fee_paid && !paymentSuccessData) {
      router.push('/dashboard');
    } else if (user && !user.is_amrita_student && !user.platform_fee_paid && !registeredUserSession) {
      setRegisteredUserSession(user);
      setStudentType('other');
      setForm(f => ({
        ...f,
        student_type: 'other',
        email: user.email || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        college_name: user.college_name || '',
        roll_number: user.roll_number || '',
        department: user.department || '',
        year_of_study: user.year_of_study || '',
        city: user.city || '',
      }));
      setStep(2);
    }
  }, [user, router, paymentSuccessData, registeredUserSession]);

  // Load Cashfree checkout SDK script on mount safely
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (!document.getElementById('cashfree-checkout-script') && !window.Cashfree) {
        try {
          const script = document.createElement('script');
          script.id = 'cashfree-checkout-script';
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.async = true;
          document.body.appendChild(script);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleStudentTypeChange = (type: 'amrita' | 'other') => {
    setStudentType(type);
    setError('');
    setForm(f => ({
      ...f,
      student_type: type,
      college_name: type === 'amrita' ? 'Amrita Vishwa Vidyapeetham, Amaravati' : '',
    }));
  };

  const handleIdCardSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    setError('');
    setIdCardFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          setIdCardPreview(compressedBase64);
        } else {
          setIdCardPreview(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isAmritaSelected = studentType === 'amrita';
  const isAmritaEmail = form.email.toLowerCase().endsWith(`@${AMRITA_DOMAIN}`) || 
                        form.email.toLowerCase().endsWith('.amrita.edu') || 
                        form.email.toLowerCase().endsWith('@amrita.edu');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validateStep0 = () => {
    const emailTrimmed = form.email.trim();
    if (!emailTrimmed) return 'Email address is required';
    if (!isValidEmail(emailTrimmed)) {
      return 'Please enter a valid email address (e.g. name@example.com)';
    }
    if (isAmritaSelected && !isAmritaEmail) {
      return `Amrita students must use an official Amrita email (@${AMRITA_DOMAIN})`;
    }
    if (!form.password) return 'Password is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters long';
    if (!form.confirmPassword) return 'Please confirm your password';
    if (form.password !== form.confirmPassword) return 'Passwords do not match. Please ensure both passwords are identical.';
    return '';
  };

  const validateStep1 = () => {
    const nameCheck = isValidStudentName(form.full_name);
    if (!nameCheck.valid) {
      return nameCheck.error || 'Student name is invalid';
    }
    const cleanPhone = (form.phone ?? '').replace(/\D/g, '');
    if (!cleanPhone) return 'Phone number is required';
    if (cleanPhone.length !== 10) return 'Phone number must be exactly 10 digits';
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) return 'Phone number must start with 6, 7, 8, or 9 (excluding +91)';
    if (isAmritaSelected) {
      if (!(form.roll_number ?? '').trim()) return 'Amrita Roll Number / Student ID is required';
      if (!form.department) return 'Please select your Branch';
    } else {
      if (!(form.college_name ?? '').trim()) return 'College / Institution name is required';
      if (!(form.roll_number ?? '').trim()) return 'Roll / Student ID Number is required';
      if (!(form.department ?? '').trim()) return 'Branch / Department name is required';
      if (!(form.city ?? '').trim()) return 'City / Location is required';
      if (!idCardPreview && !idCardFile) return 'Please upload your College ID card photo';
    }
    if (!form.year_of_study) return 'Please select your Year of Study';
    return '';
  };

  const next = async () => {
    const err = step === 0 ? validateStep0() : step === 1 ? validateStep1() : '';
    if (err) {
      setError(err);
      return;
    }
    setError('');

    // If moving from Step 1 to Step 2, register the account in background to prepare order
    if (step === 1 && !registeredUserSession) {
      setLoading(true);
      const { confirmPassword, ...data } = form;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: (data.phone || '').replace(/\D/g, '').slice(0, 10),
          student_type: studentType,
          college_name: isAmritaSelected ? 'Amrita Vishwa Vidyapeetham, Amaravati' : data.college_name,
          id_card_url: idCardPreview || undefined,
        }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        json = { success: false, error: 'Registration server error. Please try again.' };
      }
      setLoading(false);

      if (json.success && json.data) {
        setRegisteredUserSession(json.data.user);
        setPendingPaymentOrder(json.data.cashfree_order);

        // If Amrita student (free pass), complete immediately!
        if (isAmritaSelected) {
          setPaymentSuccessData({
            qrToken: json.data.user.qr_token,
            studentName: json.data.user.full_name,
            amount: 0,
          });
          refreshUser();
          return;
        }

        setStep(2);
      } else {
        setError(json.error || 'Registration failed. Please verify your details.');
      }
      return;
    }

    setStep(s => s + 1);
  };

  // Launch Cashfree for ₹1000 Outside Student Pass
  const handleCashfreePayment = async () => {
    setError('');
    setPaymentProcessing(true);

    let cfOrder = pendingPaymentOrder;
    if (!cfOrder || !cfOrder.payment_session_id) {
      try {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'platform_fee' }),
        });
        const orderJson = await orderRes.json();
        if (orderJson.success && orderJson.data && orderJson.data.payment_session_id) {
          cfOrder = {
            ...orderJson.data,
            registration_token: pendingPaymentOrder?.registration_token,
          };
          setPendingPaymentOrder(cfOrder);
        } else {
          setError(orderJson.error || 'Failed to create payment order. Please try again.');
          setPaymentProcessing(false);
          return;
        }
      } catch {
        setError('Network error connecting to payment gateway. Please try again.');
        setPaymentProcessing(false);
        return;
      }
    }

    try {
      const { launchCashfreeCheckout } = await import('@/lib/cashfreeCheckout');
      await launchCashfreeCheckout({
        paymentSessionId: cfOrder.payment_session_id,
        orderId: cfOrder.order_id,
        paymentDbId: cfOrder.payment_db_id,
        onSuccess: async (details: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                payment_db_id: cfOrder?.payment_db_id,
                order_id: cfOrder?.order_id,
                cf_order_id: cfOrder?.cf_order_id || cfOrder?.order_id,
                cf_payment_id: details?.paymentDetails?.cf_payment_id || `cfpay_${Date.now()}`,
                registration_token: cfOrder?.registration_token,
                type: 'platform_fee',
              }),
            });

            const verifyData = await verifyRes.json();
            setPaymentProcessing(false);

            if (verifyData.success) {
              setPaymentSuccessData({
                qrToken: verifyData.data?.qr_token || registeredUserSession?.qr_token || registeredUserSession?.id,
                studentName: form.full_name || registeredUserSession?.full_name || 'Student',
                amount: 1000,
              });
              refreshUser();
            } else {
              setError(verifyData.error || 'Payment verification failed. Please contact support.');
            }
          } catch {
            setPaymentProcessing(false);
            setError('Network error verifying payment. Please refresh your dashboard.');
          }
        },
        onFailure: (errMsg: string) => {
          setPaymentProcessing(false);
          setError(errMsg || 'Payment failed. Please try again.');
        },
        onDismiss: () => {
          setPaymentProcessing(false);
        },
      });
    } catch (err: any) {
      setPaymentProcessing(false);
      setError('Could not open Cashfree payment window. Please try again.');
    }
  };

  // SUCCESS SCREEN (Payment Verified & QR Generated)
  if (paymentSuccessData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#05030a] relative overflow-hidden py-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-gradient-to-b from-[#180d2b] to-[#0a0515] border border-purple-500/40 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-2xl relative z-10 shadow-2xl shadow-purple-950/60 space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
            <CheckCircle className="text-emerald-400" size={34} />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Registration &amp; Pass Active
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-2">Welcome to Parinaam 2026!</h2>
            <p className="text-slate-300 text-xs mt-1">
              Hi <strong>{paymentSuccessData.studentName}</strong>, your festival pass has been activated successfully!
            </p>
          </div>

          {/* Generated Pass QR Code Display */}
          <div className="p-4 bg-white rounded-2xl max-w-[200px] mx-auto shadow-xl">
            <QRCodeSVG
              value={paymentSuccessData.qrToken}
              size={170}
              level="H"
              includeMargin={false}
              className="w-full h-auto"
            />
          </div>

          {/* Included Flagship Events confirmation */}
          {!isAmritaSelected && (
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5">
              <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} /> Included in your ₹1000 Pass:
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-200">
                <span>🎵 Live Concert &amp; DJ</span>
                <span>💃 Garba Night</span>
                <span>🏎️ Auto Expo</span>
                <span>🎭 Tholu Bommalata</span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Link
              href="/dashboard/pass"
              className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/40 text-sm flex items-center justify-center gap-2 block active:scale-95"
            >
              <QrCode size={16} /> View Digital Festival Pass →
            </Link>
            <Link
              href="/events"
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-semibold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 block"
            >
              Explore Club Competitions &amp; Workshops
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#05030a] relative overflow-hidden py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group">
            <span className="font-['Pixelify_Sans'] text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              PARINAAM
            </span>
          </Link>
          <p className="text-slate-400 mt-1 text-sm">Fest Registration &amp; Pass Portal</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all ${
                  i === step
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : i < step
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                {i < step ? <CheckCircle size={12} /> : <span className="w-4 text-center">{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? 'bg-emerald-600/50' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card Container */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 0: Category Choice + Account Credentials */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Your Student Category
                  </label>
                  
                  {/* Student Type Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {/* Option 1: Outside College Student */}
                    <div
                      onClick={() => handleStudentTypeChange('other')}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                        !isAmritaSelected
                          ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                          <School size={16} />
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ₹1,000 Fixed Pass
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-sm">Outside College Student</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        National delegate entry. Includes 4 major flagship events.
                      </p>
                    </div>

                    {/* Option 2: Amrita Student */}
                    <div
                      onClick={() => handleStudentTypeChange('amrita')}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                        isAmritaSelected
                          ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                          <GraduationCap size={16} />
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Free Pass (₹0)
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-sm">Amrita Amaravati Student</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Requires official @av.students.amrita.edu email.
                      </p>
                    </div>
                  </div>

                  {/* Outside Student Highlights Banner */}
                  {!isAmritaSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 to-pink-950/30 border border-purple-500/30 space-y-2 mb-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles size={14} className="text-purple-400" /> ₹1,000 Fixed Festival Pass Inclusions:
                        </span>
                        <span className="text-[10px] font-bold text-pink-400 bg-pink-500/15 px-2 py-0.5 rounded-full">
                          4 Flagship Events
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {INCLUDED_FLAGSHIP_EVENTS.map(ev => {
                          const Icon = ev.icon;
                          return (
                            <div key={ev.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-black/30 border border-white/5">
                              <Icon size={14} className="text-purple-400 shrink-0" />
                              <span className="font-semibold text-slate-200 truncate">{ev.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1 leading-normal">
                        * Access to all 4 flagship events above is included. Other specialized club competitions and workshops are paid individually as displayed on the Events catalog.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {isAmritaSelected ? 'Amrita Student Email' : 'Personal / Student Email'}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder={isAmritaSelected ? `yourname@${AMRITA_DOMAIN}` : 'your.email@gmail.com'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={next}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 text-sm mt-4"
                >
                  <span>Continue to Profile Details</span>
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* STEP 1: Personal & Academic Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name (as per ID, max {MAX_STUDENT_NAME_LENGTH} chars)
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      maxLength={MAX_STUDENT_NAME_LENGTH}
                      pattern="^[A-Za-z]+(?: [A-Za-z]+)*$"
                      required
                      value={form.full_name}
                      onChange={e => set('full_name', e.target.value.slice(0, MAX_STUDENT_NAME_LENGTH))}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Phone number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone Number (10 digits)
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                {/* College / Institution */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    College / University Name
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={isAmritaSelected ? 'Amrita Vishwa Vidyapeetham, Amaravati' : form.college_name}
                      disabled={isAmritaSelected}
                      onChange={e => set('college_name', e.target.value)}
                      placeholder="e.g. IIT Madras, VIT Vellore, SRM"
                      className={`w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 ${
                        isAmritaSelected ? 'opacity-80' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Roll Number & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Roll / Student ID No
                    </label>
                    <input
                      type="text"
                      value={form.roll_number}
                      onChange={e => set('roll_number', e.target.value)}
                      placeholder="e.g. AV.EN.U4CSE23001"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Branch / Department
                    </label>
                    {isAmritaSelected ? (
                      <select
                        value={form.department}
                        onChange={e => set('department', e.target.value)}
                        className="w-full bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select Branch</option>
                        {['CSE', 'CSE-AIE', 'AIDS', 'CCE', 'ECE', 'QUANTUM'].map(b => (
                          <option key={b} value={b} className="bg-slate-900 text-white">
                            {b}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.department}
                        onChange={e => set('department', e.target.value)}
                        placeholder="e.g. Computer Science"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                </div>

                {/* Year of Study & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Year of Study
                    </label>
                    <select
                      value={form.year_of_study}
                      onChange={e => set('year_of_study', e.target.value)}
                      className="w-full bg-[#0e0b1a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select Year</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'].map(y => (
                        <option key={y} value={y} className="bg-slate-900 text-white">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!isAmritaSelected && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        City / Location
                      </label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={form.city}
                          onChange={e => set('city', e.target.value)}
                          placeholder="e.g. Hyderabad, Chennai"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* College ID card photo upload (for Outside Students) */}
                {!isAmritaSelected && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Upload College ID Card Photo</span>
                      <span className="text-purple-400 text-[11px] font-normal">JPG/PNG</span>
                    </label>

                    {idCardPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-black/40 p-2">
                        <img
                          src={idCardPreview}
                          alt="Student ID Preview"
                          className="w-full h-32 object-contain rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => { setIdCardFile(null); setIdCardPreview(''); }}
                          className="absolute top-4 right-4 bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-4 text-center cursor-pointer block bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                        <Upload size={20} className="mx-auto text-purple-400 mb-1" />
                        <p className="text-white text-xs font-semibold">Click to select Student ID photo</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Clear photo of your college ID card</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleIdCardSelect}
                        />
                      </label>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-3 rounded-xl transition-all text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={loading}
                    className="w-2/3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to Pass Checkout</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Pass Confirmation & Cashfree Payment */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Outside Student ₹1000 Pass Checkout Card */}
                {!isAmritaSelected ? (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 via-purple-900/30 to-black border border-purple-500/40 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 bg-purple-500/20 px-2.5 py-0.5 rounded-full">
                            Official Delegate Pass
                          </span>
                          <h3 className="text-xl font-extrabold text-white mt-1">PARINAAM 2026 FESTIVAL PASS</h3>
                          <p className="text-slate-300 text-xs mt-0.5">Attendee: {form.full_name} ({form.college_name})</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono">₹1,000</p>
                          <span className="text-[10px] text-emerald-400 font-semibold">Fixed All-Inclusive</span>
                        </div>
                      </div>

                      {/* 4 Flagship Inclusions List */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-400" /> Guaranteed Included Flagship Events:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {INCLUDED_FLAGSHIP_EVENTS.map(ev => {
                            const Icon = ev.icon;
                            return (
                              <div key={ev.name} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
                                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                                  <Icon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white leading-tight">{ev.name}</p>
                                  <p className="text-[10px] text-slate-400 line-clamp-1">{ev.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                        💳 <strong>Note:</strong> Upon successful payment of ₹1000, your official digital QR pass is generated immediately. Additional club-specific competitions and workshops have separate entry fees payable in the events catalog.
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-3.5 rounded-xl transition-all text-xs"
                      >
                        ← Back
                      </button>

                      <button
                        type="button"
                        onClick={handleCashfreePayment}
                        disabled={paymentProcessing}
                        className="w-2/3 bg-gradient-to-r from-emerald-600 via-purple-600 to-pink-600 hover:from-emerald-500 hover:to-pink-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-95"
                      >
                        {paymentProcessing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Processing Cashfree...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            <span>Pay ₹1,000 &amp; Generate QR Pass</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Amrita Student Complimentary Pass Summary */
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <GraduationCap size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-white">Amrita Student Free Pass</h3>
                      <p className="text-slate-300 text-xs">
                        Complimentary festival pass for {form.full_name} ({form.email})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => next()}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
                    >
                      Complete &amp; Open Fest Pass →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer link to login */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
            Already registered on Parinaam?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
