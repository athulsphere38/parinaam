'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FEST_CONFIG } from '../../data/festData';
import { ArrowRight, Calendar, MapPin, Trophy, Ticket, Flame, Building2, Sparkles, Zap, Users, ExternalLink, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { InteractiveHeroBackground } from './InteractiveHeroBackground';

// Target Date: October 11, 2026, 09:00:00 AM IST
const FEST_START_TIME = new Date('2026-10-11T09:00:00+05:30').getTime();

const calculateTimeLeft = () => {
  const difference = FEST_START_TIME - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export const Hero = () => {
  const { user } = useAuth();
  
  // Accurate Real-Time Countdown Timer state to Oct 11, 2026, 09:00 AM IST
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const passHref = user
    ? user.role === 'student'
      ? '/dashboard/pass'
      : user.role === 'super_admin'
      ? '/superadmin'
      : `/admin/${user.club_slug || ''}`
    : '/auth/register';

  const passButtonLabel = user ? 'SEE DELEGATE PASS' : 'GET DELEGATE PASS';

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 border-b border-purple-900/50 overflow-hidden w-full max-w-full fest-grid-bg bg-[#05030a]">
      
      {/* Mood Indigo Ambient Spotlights */}
      <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 lg:w-[750px] h-64 sm:h-96 lg:h-[450px] bg-fuchsia-600/15 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-4 w-64 sm:w-96 lg:w-[650px] h-64 sm:h-96 lg:h-[550px] bg-purple-600/20 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-48 sm:w-80 lg:w-[400px] h-48 sm:h-80 lg:h-[400px] bg-amber-500/10 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none" />

      {/* Interactive Particle Canvas */}
      <InteractiveHeroBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Main Grid: Left Title & Info + Right Big Expanded Campus Architectural Hologram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Title Typography & CTAs (col-span-6 for balanced split) */}
          <div className="lg:col-span-6 text-left space-y-6">
            

            {/* Exact Logo Title Typography (Floating with glowing aura) */}
            <div className="relative py-1">
              <img
                src="/images/parinaam-title-transparent.png"
                alt="PARIनाम 2026 - The Techno-Cultural Fest"
                className="w-full max-w-lg sm:max-w-xl h-auto object-contain filter drop-shadow-[0_0_35px_rgba(217,70,239,0.7)]"
              />
            </div>

            {/* Subtitle Statement */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
              Two days. Tech, culture, music, and a lot of competition. 12 campus clubs, 35+ events, and over ₹3,00,000 in prizes.
            </p>

            {/* Date & Location Pill Summary */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-200 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-purple-950/70 border border-purple-800/80 text-[11px] sm:text-sm">
                <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-fuchsia-400 shrink-0" />
                <span className="font-mono">{FEST_CONFIG.dates}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-purple-950/70 border border-purple-800/80 text-[11px] sm:text-sm">
                <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400 shrink-0" />
                <span>Amaravati Campus</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-purple-950/70 border border-purple-800/80 text-[11px] sm:text-sm">
                <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400 shrink-0" />
                <span className="font-mono font-semibold">{FEST_CONFIG.totalPrizePool} Prize</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-3">
              <Link
                href={passHref}
                className="px-4 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-fuchsia-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-xs sm:text-base tracking-wide shadow-purple-glow flex items-center justify-center gap-2.5 sm:gap-3 transition-all active:scale-95 border border-fuchsia-400/40 text-center"
              >
                <Ticket className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300 shrink-0" />
                <span>{passButtonLabel}</span>
                <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
              </Link>

              <Link
                href="/events"
                className="px-4 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs sm:text-base border border-fuchsia-800/80 transition-all text-center tracking-wide"
              >
                EXPLORE EVENTS
              </Link>
            </div>

          </div>

          {/* Right Column: Big & Spacious Campus Architectural Hologram (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-end justify-center relative w-full">
            
            {/* Atmospheric Multi-layer Glow Spotlight */}
            <div className="absolute -inset-6 bg-gradient-to-tr from-fuchsia-600/35 via-purple-600/25 to-cyan-500/25 rounded-3xl blur-3xl pointer-events-none" />
            
            {/* Expanded Hero Campus Card - Generous Size, Fitting Right */}
            <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0e091d]/90 to-[#070410]/95 p-4 sm:p-7 rounded-3xl border border-purple-500/50 shadow-2xl shadow-purple-950/70 mi-glow-card group">
              
              {/* Header Label inside Card */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-purple-900/40 text-xs font-mono">
                <span className="text-purple-300 flex items-center gap-2 font-bold tracking-wide text-[11px] sm:text-xs">
                  <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-fuchsia-400 animate-pulse shrink-0" />
                  AMRITA VISHWA VIDYAPEETHAM
                </span>
                <span className="text-amber-400 font-bold px-2 sm:px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-xs">
                  AMARAVATI
                </span>
              </div>

              {/* Big High-Definition Glowing Campus Blueprint Artwork */}
              <div 
                onClick={() => setShowVenueModal(true)}
                title="Click to view Festival Venue details"
                className="relative w-full overflow-hidden rounded-2xl bg-[#040208]/90 p-3 sm:p-5 border border-purple-800/40 cursor-pointer group/art hover:border-fuchsia-500/70 transition-all duration-300"
              >
                {/* Subtle Grid overlay for architectural blueprint feel */}
                <div className="absolute inset-0 fest-grid-bg opacity-30 pointer-events-none" />
                
                <img
                  src="/images/campus-sketch-glow.png"
                  alt="Amrita Vishwa Vidyapeetham, Amaravati Campus"
                  className="w-full h-auto max-h-[360px] sm:max-h-[420px] object-contain filter drop-shadow-[0_0_30px_rgba(217,70,239,0.85)] group-hover/art:scale-[1.03] transition-transform duration-500 relative z-10"
                />

                {/* Subtle hover tooltip hint */}
                <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover/art:opacity-100 transition-opacity bg-black/80 border border-fuchsia-500/40 text-[10px] font-mono text-fuchsia-300 px-2 py-0.5 rounded pointer-events-none">
                  Click to explore venue ↗
                </div>
              </div>

              {/* Bottom Details Strip */}
              <div className="relative z-30 mt-3.5 px-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono text-slate-400 pointer-events-auto">
                <span className="flex items-center gap-1.5 text-slate-300 text-[11px] sm:text-xs truncate min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                  <span className="truncate">MAIN CAMPUS VENUE</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowVenueModal(true)}
                  className="relative z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/35 border border-fuchsia-500/50 hover:border-fuchsia-400 text-fuchsia-300 hover:text-white font-bold transition-all text-xs font-mono shadow-[0_0_15px_rgba(217,70,239,0.35)] hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto select-none shrink-0"
                >
                  <span className="pointer-events-none">ABOUT VENUE</span>
                  <ExternalLink className="w-3.5 h-3.5 text-fuchsia-400 pointer-events-none" />
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Live Ticker & Stats Strip */}
        <div className="pt-10 border-t border-purple-900/50 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-purple-950/50 p-5 rounded-2xl border border-purple-900/60 text-center hover:border-fuchsia-500/40 transition-all duration-200 ease-out hover:-translate-y-1.5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">
              Countdown
            </span>
            <div className="flex items-baseline justify-center gap-2 font-mono">
              <span className="text-2xl sm:text-3xl font-bold text-white">{mounted ? timeLeft.days : '0'}d</span>
              <span className="text-2xl sm:text-3xl font-bold text-white">{mounted ? timeLeft.hours : '0'}h</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#ff00ff]">{mounted ? timeLeft.minutes : '0'}m</span>
              <span className="text-xs sm:text-sm text-slate-400">{mounted ? timeLeft.seconds : '0'}s</span>
            </div>
          </div>

          <div className="bg-purple-950/50 p-5 rounded-2xl border border-purple-900/60 text-center hover:border-amber-500/40 transition-all duration-200 ease-out hover:-translate-y-1.5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">
              Total Prize Pool
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {FEST_CONFIG.totalPrizePool}
            </span>
          </div>

          <div className="bg-purple-950/50 p-5 rounded-2xl border border-purple-900/60 text-center hover:border-cyan-500/40 transition-all duration-200 ease-out hover:-translate-y-1.5">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1.5">
              Participating Clubs
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
              12 Active Clubs
            </span>
          </div>
        </div>

      </div>

      {/* Festival Venue Confirmation Dialog Modal */}
      {showVenueModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowVenueModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-gradient-to-b from-[#130b29] to-[#080413] border border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/90 space-y-6 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowVenueModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Campus Icon */}
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/40 text-fuchsia-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(217,70,239,0.5)]">
              <Building2 className="w-8 h-8 text-fuchsia-300 animate-pulse" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                Amrita Vishwa Vidyapeetham • Amaravati
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-['Pixelify_Sans',_monospace] tracking-wide pt-1">
                Amrita Amaravati Campus
              </h3>
              <p className="text-sm sm:text-base text-slate-200 font-medium">
                Explore the campus and festival grounds?
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                You will be redirected to the official Amrita Vishwa Vidyapeetham, Amaravati campus portal in a new tab.
              </p>
            </div>

            {/* Action Buttons: No or Yes */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowVenueModal(false)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-slate-300 font-mono text-xs font-semibold transition-all cursor-pointer hover:border-purple-500/50 active:scale-95"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVenueModal(false);
                  window.open('https://www.amrita.edu/campus/amaravati/', '_blank', 'noopener,noreferrer');
                }}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.8)] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Yes</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
