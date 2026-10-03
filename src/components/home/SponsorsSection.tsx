'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Crown, Zap, Shield, Globe, Award, Radio } from 'lucide-react';

export const SponsorsSection = () => {
  const tiers = [
    {
      tier: 'Title Partner',
      icon: Crown,
      color: 'from-amber-500/20 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-500/30 hover:border-amber-400/60',
      textColor: 'text-amber-400',
      glowColor: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      badge: 'Main Festival Presenter',
      status: 'Revealing Soon',
    },
    {
      tier: 'Powered By Partner',
      icon: Zap,
      color: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400/60',
      textColor: 'text-cyan-400',
      glowColor: 'shadow-[0_0_30px_rgba(6,182,212,0.15)]',
      badge: 'Tech & Infrastructure',
      status: 'Revealing Soon',
    },
    {
      tier: 'Platinum & Gold Partners',
      icon: Shield,
      color: 'from-fuchsia-500/20 via-fuchsia-500/5 to-transparent',
      borderColor: 'border-fuchsia-500/30 hover:border-fuchsia-400/60',
      textColor: 'text-fuchsia-400',
      glowColor: 'shadow-[0_0_30px_rgba(217,70,239,0.15)]',
      badge: 'Arena & Hackathon Tracks',
      status: 'Revealing Soon',
    },
    {
      tier: 'Media & Ecosystem Partners',
      icon: Globe,
      color: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400/60',
      textColor: 'text-emerald-400',
      glowColor: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      badge: 'National Outreach & Press',
      status: 'Revealing Soon',
    },
  ];

  return (
    <section id="sponsors" className="scroll-mt-20 py-20 sm:py-28 bg-[#04020a] border-y border-purple-950/70 relative overflow-hidden w-full max-w-full">
      
      {/* Dynamic Background Atmospheric Orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-purple-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-fuchsia-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-800/80 text-xs font-mono text-purple-300">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
            <span className="font-bold tracking-wider uppercase">PARTNERSHIP SHOWCASE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight">
            Sponsors <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-300 to-amber-300">Upcoming</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Parinaam 2026 is partnering with leading technology conglomerates, innovation labs, and startup incubators. Official tier reveals will be announced shortly.
          </p>
        </div>

        {/* Animated Upcoming Sponsor Tiers Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.tier}
                className={`relative rounded-2xl bg-gradient-to-b ${tier.color} bg-[#0a0614]/80 border ${tier.borderColor} p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1.5 ${tier.glowColor} group`}
              >
                {/* Subtle scanning light bar */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center ${tier.textColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                      {tier.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-display group-hover:text-purple-200 transition-colors">
                      {tier.tier}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Tier partnership onboarding underway
                    </p>
                  </div>
                </div>

                {/* Animated Pulsing Status */}
                <div className="pt-4 border-t border-purple-900/40 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-mono font-medium text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {tier.status}
                  </span>
                  <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sponsor Call To Action Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#0e071c] to-purple-950/80 border border-fuchsia-500/30 text-center max-w-3xl mx-auto space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <h4 className="text-xl sm:text-2xl font-extrabold text-white font-display">
              Want to showcase your brand at PARINAAM 2026?
            </h4>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Connect directly with thousands of engineering minds, tech builders, and student innovators across India.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sponsor"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-fuchsia-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide uppercase font-mono shadow-[0_0_25px_rgba(217,70,239,0.5)] hover:shadow-[0_0_35px_rgba(217,70,239,0.8)] transition-all active:scale-95 border border-fuchsia-400/40 cursor-pointer text-center"
            >
              <span>Partner With Us / Register as Sponsor</span>
              <ArrowRight className="w-4 h-4 text-amber-300 animate-pulse" />
            </Link>

            <a
              href="/docs/PARINAAM_2026_Sponsorship_Brochure.pdf"
              download="PARINAAM_2026_Sponsorship_Brochure.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm border border-purple-800/80 transition-all font-mono uppercase tracking-wider text-center"
            >
              <span>Download 7-Page Brochure</span>
            </a>
          </div>

          <p className="text-xs font-mono text-purple-300/70 pt-1">
            Amrita Vishwa Vidyapeetham • Amaravati Campus • parinaam@av.amrita.edu
          </p>
        </div>

      </div>
    </section>
  );
};
