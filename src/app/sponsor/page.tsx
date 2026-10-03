'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Mail,
  User,
  Phone,
  Globe,
  DollarSign,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Lock,
  Download,
  HelpCircle,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react';
import { isValidEmail } from '@/lib/utils';

const SPONSOR_PACKAGES = [
  {
    id: 'associate',
    tierName: 'ASSOCIATE PARTNER',
    amount: '₹1,00,000+',
    badge: 'BRAND PARTNER',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    priceColor: 'text-amber-300',
    borderColor: 'border-purple-900/60',
    activeBorder: 'border-fuchsia-500 ring-2 ring-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.25)]',
    perks: [
      'Logo on standees & banners across all 12 events',
      'Branding at 2–3 club events of your choice',
      'Shout-out on Instagram & LinkedIn posts',
      'Logo on participant digital certificates',
      'Mention during event announcements',
    ],
  },
  {
    id: 'co_sponsor',
    tierName: 'CO-SPONSOR',
    amount: '₹2,50,000+',
    badge: 'CO-SPONSOR',
    badgeColor: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
    priceColor: 'text-fuchsia-400',
    borderColor: 'border-purple-900/60',
    activeBorder: 'border-fuchsia-500 ring-2 ring-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.35)]',
    perks: [
      'Everything in Associate Partner, plus:',
      'Logo on the main stage backdrop',
      'On-campus stall / booth space, all 3 days',
      'Branding across all 12 events + DJ Night',
      'Dedicated social media feature post',
      'Mention at prize distribution ceremonies',
    ],
  },
  {
    id: 'title_sponsor',
    tierName: 'TITLE SPONSOR',
    amount: '₹5,00,000+',
    badge: 'TITLE PARTNER',
    badgeColor: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
    priceColor: 'text-amber-400',
    borderColor: 'border-purple-900/60',
    activeBorder: 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    perks: [
      'Everything in Co-Sponsor, plus:',
      '"Presented by [Brand]" naming rights',
      'Logo on the DJ Night stage — peak footfall',
      'Premium booth placement, all 3 days',
      'Brand activation / speaking slot',
      'Logo on all print, digital & ID-card collateral',
    ],
  },
];



export default function SponsorRegistrationPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    website: '',
    tier: 'co_sponsor',
    budget: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState<string>('PENDING');

  const selectedPackage =
    SPONSOR_PACKAGES.find((pkg) => pkg.id === formData.tier) || SPONSOR_PACKAGES[1];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectTier = (tierId: string) => {
    setFormData((prev) => ({ ...prev, tier: tierId }));
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isValidEmail(formData.email)) {
      setFormError('Please enter a valid official corporate email address (e.g. name@company.com)');
      return;
    }

    if (!formData.companyName.trim() || !formData.contactPerson.trim() || !formData.phone.trim()) {
      setFormError('Please fill in all required contact & organization fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sponsors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setSubmissionId(data.data.application_id || '');
        setSubmittedStatus(data.data.status || 'PENDING');
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError(data.error || 'Failed to submit sponsor application. Please try again.');
      }
    } catch (err) {
      console.error('Sponsor form submit error:', err);
      setFormError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmittedStatus('PENDING');
    setFormData({
      companyName: '',
      contactPerson: '',
      designation: '',
      email: '',
      phone: '',
      website: '',
      tier: 'co_sponsor',
      budget: '',
      message: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#05030a] text-slate-100 fest-grid-bg pt-28 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">

      {/* Ambient Theme Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">

        {/* Section Header with Pixelify Sans Font */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-fuchsia-300">
            <Sparkles size={14} className="text-amber-400" />
            <span className="uppercase tracking-widest font-bold">THE PACKAGES</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Level of Partnership
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
            Three ways to partner with <strong className="text-white">PARINAAM 2026</strong>, from focused club branding to full title-sponsor visibility.
          </p>
        </div>

        {/* Success View */}
        {isSubmitted ? (
          <div className="bg-[#0c091d]/90 border border-purple-500/40 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] backdrop-blur-md">
            <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/40 text-fuchsia-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
                {submittedStatus === 'CONFIRMED'
                  ? 'Sponsorship Application Confirmed!'
                  : submittedStatus === 'REJECTED'
                  ? 'Sponsorship Application Reviewed'
                  : 'Sponsorship Application Submitted'}
              </h2>
              <p className="text-sm text-slate-300">
                Thank you, <span className="font-semibold text-white">{formData.contactPerson || 'Partner'}</span>. 
                {submittedStatus === 'CONFIRMED'
                  ? ` Your sponsorship for ${formData.companyName} has been officially confirmed by Super Admin.`
                  : ` Your sponsorship application for ${formData.companyName} has been successfully submitted and is now pending review by the Parinaam Super Admin team.`}
              </p>
            </div>

            <div className="bg-black/60 border border-purple-900/50 rounded-xl p-4 text-left font-mono text-xs space-y-2.5 text-slate-300">
              <div className="flex justify-between border-b border-purple-900/40 pb-2">
                <span className="text-slate-500">REFERENCE ID:</span>
                <span className="text-fuchsia-400 font-bold">{submissionId}</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-2">
                <span className="text-slate-500">APPLICATION STATUS:</span>
                <span className={`font-bold px-2 py-0.5 rounded uppercase border text-[11px] ${
                  submittedStatus === 'CONFIRMED'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : submittedStatus === 'REJECTED'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  {submittedStatus === 'CONFIRMED' ? 'CONFIRMED' : submittedStatus === 'REJECTED' ? 'REJECTED' : 'PENDING REVIEW'}
                </span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-2">
                <span className="text-slate-500">CHOSEN PACKAGE:</span>
                <span className="text-fuchsia-300 font-bold uppercase">
                  {selectedPackage.tierName} ({selectedPackage.amount})
                </span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-2">
                <span className="text-slate-500">OFFICIAL EMAIL:</span>
                <span className="text-white">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CONTACT NUMBER:</span>
                <span className="text-white">{formData.phone}</span>
              </div>
            </div>

            {/* Display-Only Payment Section in Success View */}
            <div className="bg-[#120d2b] border border-purple-500/30 rounded-xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-mono font-bold">
                  <CreditCard size={16} />
                  <span>PAYMENT &amp; INVOICING (PREVIEW ONLY)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/50 text-fuchsia-300 border border-purple-500/30">
                  DISPLAY ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Package Tier Amount: <strong className="text-white font-mono">{selectedPackage.amount}</strong> + official university receipt.
              </p>
              <div className="p-3 bg-black/50 rounded-lg text-xs text-slate-400 border border-purple-900/40 flex items-center justify-between">
                <span>Payment Gateway Integration:</span>
                <span className="text-amber-300 font-mono text-[11px]">Integration will be added later</span>
              </div>
            </div>

            <div className="p-4 bg-purple-950/50 border border-purple-500/30 rounded-xl text-xs text-purple-200 text-left flex items-start gap-3">
              <Clock size={16} className="text-fuchsia-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white mb-0.5">Super Admin Review &amp; MoU Notice</p>
                Our Corporate Relations &amp; Super Admin team will review your application within <strong>24 business hours</strong> and contact you regarding proposal deck verification, tax invoice guidelines, and formal MoU agreement.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-purple-500/30 text-sm font-medium hover:bg-purple-950/40 transition-colors cursor-pointer text-slate-200"
              >
                Submit Another Application
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all"
              >
                Return to Fest Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* 3 Packages Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SPONSOR_PACKAGES.map((pkg) => {
                const isSelected = formData.tier === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelectTier(pkg.id)}
                    className={`cursor-pointer rounded-2xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between relative bg-[#0c091d]/90 border ${
                      isSelected
                        ? pkg.activeBorder + ' bg-[#120d2b]'
                        : 'border-purple-900/40 hover:border-purple-500/60 hover:bg-[#0f0b24]'
                    }`}
                  >
                    {/* Header Badge */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-mono tracking-wider px-2.5 py-1 rounded border font-semibold ${pkg.badgeColor}`}>
                        {pkg.badge}
                      </span>
                      {isSelected ? (
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 size={14} /> SELECTED
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-purple-400/60">
                          Click to select
                        </span>
                      )}
                    </div>

                    {/* Tier Name & Amount */}
                    <div className="space-y-1 mb-5 border-b border-purple-900/40 pb-4">
                      <h3 className="text-xl font-bold text-white tracking-wide font-sans">
                        {pkg.tierName}
                      </h3>
                      <p className={`text-2xl sm:text-3xl font-extrabold font-mono ${pkg.priceColor}`}>
                        {pkg.amount}
                      </p>
                    </div>

                    {/* Perks List */}
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8 flex-1">
                      {pkg.perks.map((perk, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="text-fuchsia-400 font-bold shrink-0 mt-0.5">•</span>
                          <span className={perk.includes('Everything in') ? 'font-semibold text-white' : ''}>
                            {perk}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Select Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTier(pkg.id);
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                          : 'bg-purple-950/50 hover:bg-purple-900/60 text-slate-300 border border-purple-800/50'
                      }`}
                    >
                      {isSelected ? '✓ SELECTED PACKAGE' : 'SELECT THIS PACKAGE'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Banner Quote from the Brochure */}
            <div className="p-6 rounded-2xl bg-[#0c091d]/80 border border-purple-900/50 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-fuchsia-400 shrink-0">
                <Sparkles size={24} />
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                Partner with <strong className="text-white">PARINAAM 2026</strong> and connect your brand with{' '}
                <span className="text-fuchsia-300 font-medium">technology, creativity, automobiles, competitions and entertainment</span>.
              </p>
            </div>

            {/* Single Page Brochure Display Section (Above Register Your Company Form) */}
            <div className="bg-[#0c091d]/90 border border-purple-900/50 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[11px] font-mono text-fuchsia-300">
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="uppercase tracking-widest font-bold">FESTIVAL AT A GLANCE</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
                    Sponsorship Brochure &amp; Highlights
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Quick single-page summary of demographics, student reach, flagship arenas, and branding packages.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="/docs/PARINAAM_2026_Sponsorship_Brochure.pdf"
                    download="PARINAAM_2026_Sponsorship_Brochure.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mono text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(217,70,239,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-fuchsia-400/40"
                  >
                    <Download size={15} />
                    <span>Download Full 7-Page Brochure (PDF)</span>
                  </a>
                </div>
              </div>

              {/* Pure Image Single Page Brochure */}
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-[#030108] shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <img
                  src="/images/parinaam-one-page-brochure.png"
                  alt="PARINAAM 2026 Sponsorship Brochure (One Page)"
                  className="w-full h-auto max-h-[950px] object-contain mx-auto"
                />
              </div>
            </div>

            {/* Registration Form & Corporate Desk Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Card (8 cols) */}
              <div className="lg:col-span-8 bg-[#0c091d]/90 border border-purple-900/50 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
                <div className="border-b border-purple-900/40 pb-4">
                  <span className="text-xs font-mono text-fuchsia-400 font-bold tracking-wider uppercase block">
                    SPONSOR REGISTRATION FORM
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-sans tracking-tight">
                    Register Your Company as a Sponsor
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Selected package:{' '}
                    <strong className="text-fuchsia-300 font-mono">{selectedPackage.tierName} ({selectedPackage.amount})</strong>. 
                    Fill in your details below.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                      ⚠️ {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        COMPANY / ORGANIZATION *
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                        <input
                          type="text"
                          name="companyName"
                          required
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="e.g. Acme Corp / Red Bull"
                          className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>

                    {/* Contact Person */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        CONTACT PERSON NAME *
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                        <input
                          type="text"
                          name="contactPerson"
                          required
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          placeholder="Full Name"
                          className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Work Email */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        OFFICIAL EMAIL *
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="sponsor@company.com"
                          className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        PHONE / WHATSAPP NUMBER *
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 XXXXXXXXXX"
                          className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Designation */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        DESIGNATION / ROLE
                      </label>
                      <div className="relative">
                        <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          placeholder="e.g. Brand Marketing Director"
                          className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        COMPANY WEBSITE / LINKEDIN
                      </label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="https://company.com"
                          className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Package Selector */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        CHOSEN PACKAGE *
                      </label>
                      <select
                        name="tier"
                        value={formData.tier}
                        onChange={handleInputChange}
                        className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-mono"
                      >
                        {SPONSOR_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.id} className="bg-slate-900 text-white font-mono">
                            {pkg.tierName} ({pkg.amount})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Budget Notes */}
                    <div>
                      <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                        BUDGET / IN-KIND SUPPORT NOTES
                      </label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400/60" />
                        <input
                          type="text"
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          placeholder={`Default: ${selectedPackage.amount} (or custom)`}
                          className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Requirements / Special Message */}
                  <div>
                    <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
                      SPECIAL REQUIREMENTS / PREFERRED CLUB EVENTS
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="e.g. Desired club event focus (Chakravyuha coding, Robotics RoboWars, etc.) or demo stall requirements..."
                      className="w-full bg-[#140f2b] border border-purple-900/60 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all resize-none font-sans"
                    />
                  </div>

                  {/* ========================================= */}
                  {/* PAYMENT SECTION (DISPLAY-ONLY AS REQUESTED) */}
                  {/* ========================================= */}
                  <div className="rounded-2xl border border-purple-500/30 bg-[#120d2b] p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-fuchsia-400" />
                        <span className="text-sm font-bold text-white tracking-wide font-sans">
                          Payment Section
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-purple-900/60 text-fuchsia-300 border border-purple-500/30 w-fit">
                        DISPLAY ONLY • TO BE ADDED LATER
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-black/60 p-3 rounded-xl border border-purple-900/40 space-y-1">
                        <span className="text-purple-400/60 block font-mono text-[10px]">SELECTED TIER</span>
                        <span className="font-bold text-white font-mono">{selectedPackage.tierName}</span>
                      </div>
                      <div className="bg-black/60 p-3 rounded-xl border border-purple-900/40 space-y-1">
                        <span className="text-purple-400/60 block font-mono text-[10px]">CONTRIBUTION</span>
                        <span className="font-extrabold text-amber-300 font-mono">{selectedPackage.amount}</span>
                      </div>
                      <div className="bg-black/60 p-3 rounded-xl border border-purple-900/40 space-y-1">
                        <span className="text-purple-400/60 block font-mono text-[10px]">GATEWAY STATUS</span>
                        <span className="text-slate-300 flex items-center gap-1 font-mono text-[11px]">
                          <Lock size={12} className="text-amber-400" /> Inactive (Placeholder)
                        </span>
                      </div>
                    </div>

                    {/* Supported Gateways Display */}
                    <div className="p-3.5 bg-black/70 rounded-xl border border-purple-900/30 space-y-2 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-purple-300">
                          Supported Gateways (Coming Soon):
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                          <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-900/50 rounded">UPI</span>
                          <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-900/50 rounded">Cashfree</span>
                          <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-900/50 rounded">NEFT / RTGS</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-purple-200/70 leading-relaxed font-sans">
                        ℹ️ <em>Note: Payment gateway integration will be connected later. Submitting now records your sponsorship reservation with the Parinaam 2026 Core Organizing Committee.</em>
                      </p>
                    </div>
                  </div>

                  {/* Submit Button (Matching Festival Primary Button) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 text-white font-bold text-sm tracking-wider uppercase font-mono shadow-[0_0_25px_rgba(217,70,239,0.4)] hover:shadow-[0_0_35px_rgba(217,70,239,0.7)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Submitting Sponsor Registration...
                      </span>
                    ) : (
                      <>
                        <span>Register as a Sponsor</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-slate-500 font-mono">
                    Official Amrita Vishwa Vidyapeetham fest partnership protocol.
                  </p>
                </form>
              </div>

              {/* Help Desk Contacts (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Official Contact Card */}
                <div className="bg-[#0c091d]/90 border border-purple-900/50 rounded-2xl p-6 backdrop-blur-md space-y-5 shadow-xl">
                  <div className="flex items-center gap-2 text-fuchsia-400 font-sans text-xs font-bold tracking-wider uppercase">
                    <Phone size={15} />
                    <span>HELP DESK CONTACTS</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Need custom branding, booth dimensions, or assistance? Contact our team directly:
                  </p>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="bg-black/60 border border-purple-900/40 rounded-xl p-3.5 space-y-2">
                      <span className="text-[11px] text-fuchsia-300 uppercase block font-semibold tracking-wide">
                        OFFICIAL HELP DESK
                      </span>
                      <p className="text-slate-200 flex items-center gap-2">
                        <Mail size={13} className="text-fuchsia-400" />
                        <a href="mailto:parinaam@av.amrita.edu" className="hover:text-fuchsia-400 transition-colors font-medium">
                          parinaam@av.amrita.edu
                        </a>
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Clock size={12} className="text-purple-400/70" />
                        <span>Mon – Sat, 9:00 AM – 6:00 PM IST</span>
                      </p>
                    </div>

                    <div className="bg-black/60 border border-purple-900/40 rounded-xl p-3.5 space-y-1 text-slate-300">
                      <span className="text-[11px] text-amber-400 uppercase block font-semibold tracking-wide">
                        PROPOSAL &amp; MOU DESK
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        Our festival relations committee will contact you within <strong>24 business hours</strong> with the formal festival proposal deck, invoice guidelines, and MoU agreement.
                      </p>
                    </div>
                  </div>

                  {/* Campus Address */}
                  <div className="pt-2 border-t border-purple-900/40 text-xs text-slate-300 space-y-1">
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="text-fuchsia-400 shrink-0 mt-0.5" />
                      <span className="font-sans">
                        <strong className="text-white">Amrita Vishwa Vidyapeetham</strong>
                        <br />
                        Amaravati Campus, Kuragallu, Guntur Dt, Andhra Pradesh - 522503
                      </span>
                    </p>
                  </div>
                </div>

                {/* Brochure Card */}
                <div className="bg-[#120d2b] border border-purple-500/30 rounded-2xl p-6 text-center space-y-3 shadow-lg">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto text-fuchsia-300">
                    <Download size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-white font-sans">
                    Download Partnership Deck
                  </h4>
                  <p className="text-xs text-slate-300 font-sans">
                    Official Parinaam 2026 PDF brochure containing full campus event maps &amp; past sponsors.
                  </p>
                  <a
                    href="/docs/PARINAAM_2026_Sponsorship_Brochure.pdf"
                    download="PARINAAM_2026_Sponsorship_Brochure.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-xs font-mono font-bold text-white shadow-[0_0_20px_rgba(217,70,239,0.35)] transition-all cursor-pointer border border-fuchsia-400/40"
                  >
                    <Download size={15} />
                    <span>Download 7-Page Brochure (PDF)</span>
                  </a>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
