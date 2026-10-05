import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Music,
  Flame,
  Car,
  Theater,
  Trophy,
  Users,
  Calendar,
  ShieldCheck,
  Cpu,
  Layers,
  Gamepad2,
  Zap,
} from 'lucide-react';

export const FestIdentity = () => {
  // Top Ribbon Items (Brand Emblems & Key Experiences)
  const brandCards = [
    {
      type: 'amrita',
      badge: 'OFFICIAL HOST CAMPUS',
      title: 'Amrita Vishwa Vidyapeetham',
      subtitle: 'Amaravati Campus • NAAC A++ Accredited',
      logo: '/images/amrita-logo.png',
      border: 'border-pink-500/40',
      glow: 'from-pink-900/30 to-purple-950/40',
      tagColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    },
    {
      type: 'parinaam',
      badge: 'GRAND TECH & CULTURAL FEST',
      title: 'PARINAAM 2026',
      subtitle: 'Where Passion Meets Performance',
      logo: '/images/parinaam-navbar-logo.png',
      border: 'border-fuchsia-500/40',
      glow: 'from-fuchsia-900/30 to-purple-950/40',
      tagColor: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
    },
    {
      type: 'feature',
      icon: Music,
      badge: 'FLAGSHIP PRONITE',
      title: 'Live Concert & DJ Night',
      subtitle: 'Mega EDM & Bollywood Beats Arena',
      border: 'border-purple-500/40',
      glow: 'from-purple-900/30 to-indigo-950/40',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      type: 'feature',
      icon: Flame,
      badge: 'CULTURAL CELEBRATION',
      title: 'Garba & Dandiya Night',
      subtitle: 'High-Energy Traditional Rhythm Celebration',
      border: 'border-amber-500/40',
      glow: 'from-amber-900/30 to-orange-950/40',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      type: 'feature',
      icon: Car,
      badge: 'SPECIAL EXHIBITION',
      title: 'National Auto Expo',
      subtitle: 'Supercars, Custom Tuners & Superbikes',
      border: 'border-cyan-500/40',
      glow: 'from-cyan-900/30 to-blue-950/40',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      type: 'feature',
      icon: Theater,
      badge: 'HERITAGE SHOWCASE',
      title: 'Tholu Bommalata',
      subtitle: 'Traditional Shadow Puppetry Artistry',
      border: 'border-emerald-500/40',
      glow: 'from-emerald-900/30 to-teal-950/40',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      href: '/events/3c640142-44a4-4b06-8e76-68b2dda1c9e3',
    },
    {
      type: 'feature',
      icon: Cpu,
      badge: 'FLAGSHIP AI DEVATHON',
      title: 'Harness.md Challenge',
      subtitle: 'Autonomous AI Agents Hackathon by Chakravyuha',
      border: 'border-violet-500/40',
      glow: 'from-violet-900/30 to-purple-950/40',
      tagColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      href: '/events/6b55f19c-02ce-45b2-a107-0935e4e5babd',
    },
    {
      type: 'feature',
      icon: Zap,
      badge: 'AVISRUTA • GLOW TOURNAMENT',
      title: 'Neon Badminton',
      subtitle: 'Glow-in-the-Dark Badminton under UV Lighting',
      border: 'border-fuchsia-500/40',
      glow: 'from-fuchsia-900/30 to-purple-950/40',
      tagColor: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
      href: '/events/edd3b356-a5c6-4d01-a2e6-422ad74cc8e6',
    },
    {
      type: 'feature',
      icon: Gamepad2,
      badge: 'AVINYA • STRATEGY ARENA',
      title: 'The Syndicate - Game of Deceit',
      subtitle: 'Mafia-Style Social Deduction & Strategy Arena',
      border: 'border-lime-500/40',
      glow: 'from-lime-900/30 to-emerald-950/40',
      tagColor: 'text-lime-400 bg-lime-500/10 border-lime-500/30',
      href: '/events/8d11e56c-83e6-4ead-a1b4-dff52b55ee5e',
    },
    {
      type: 'feature',
      icon: Gamepad2,
      badge: 'ROBOTICS • SPEED ARENA',
      title: 'Obstacle Robotic Racing',
      subtitle: 'High-Speed All-Terrain Land Rover & RC Car Trials',
      border: 'border-rose-500/40',
      glow: 'from-rose-900/30 to-pink-950/40',
      tagColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      href: '/events/fe459bfb-059b-4b90-8fb8-5e9ac9185417',
    },
  ];

  // Bottom Ribbon Items (Fest Highlights & Key Metrics)
  const highlightCards = [
    {
      icon: Trophy,
      label: 'TOTAL PRIZE POOL',
      value: '₹5,00,000+',
      description: 'Across 35+ national competitions',
      color: 'text-amber-400',
      accent: 'border-amber-500/30 bg-amber-500/5',
    },
    {
      icon: Layers,
      label: 'ORGANIZING BODIES',
      value: '12 Clubs & Domains',
      description: 'Chakravyuha, ReLU, IEEE, Prachurya & more',
      color: 'text-purple-400',
      accent: 'border-purple-500/30 bg-purple-500/5',
    },
    {
      icon: Users,
      label: 'PAN-INDIA DELEGATES',
      value: '10,000+ Footfall',
      description: 'Students from 80+ universities',
      color: 'text-cyan-400',
      accent: 'border-cyan-500/30 bg-cyan-500/5',
    },
    {
      icon: Calendar,
      label: 'FESTIVAL DATES',
      value: 'October 11-12, 2026',
      description: 'Saturday & Sunday on campus',
      color: 'text-emerald-400',
      accent: 'border-emerald-500/30 bg-emerald-500/5',
    },
    {
      icon: ShieldCheck,
      label: 'DIGITAL ACCESS',
      value: 'Smart QR Pass',
      description: 'One pass for entry & check-ins',
      color: 'text-pink-400',
      accent: 'border-pink-500/30 bg-pink-500/5',
    },
    {
      icon: Zap,
      label: 'MEGA STAGES',
      value: '4 Grand Arenas',
      description: 'Auditoriums, lawns & tech labs',
      color: 'text-fuchsia-400',
      accent: 'border-fuchsia-500/30 bg-fuchsia-500/5',
    },
  ];

  return (
    <section className="relative py-20 bg-[#05030a] overflow-hidden w-full max-w-full border-y border-purple-900/40">
      {/* Background Ambience Glows */}
      <div className="absolute inset-0 pointer-events-none fest-grid-bg opacity-40" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-purple-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-pink-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      {/* Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-xs font-mono text-purple-300 mb-4 shadow-lg shadow-purple-950/50 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse shrink-0" />
          <span className="truncate max-w-[280px] sm:max-w-none">AMRITA VISHWA VIDYAPEETHAM • AMARAVATI</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
          Two Days. One Campus.{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-300 bg-clip-text text-transparent">
            Non-Stop Action.
          </span>
        </h2>

        <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          From hackathons and robowars to music battles, design jams, and stage performances. Everything happening across Amrita Amaravati on October 11–12.
        </p>
      </div>

      {/* Marquee Wrapper with Smooth Edge Fades */}
      <div className="relative w-full max-w-full overflow-hidden shrink-0 marquee-container space-y-6">
        {/* Left & Right Gradient Shadows for Seamless Look */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-44 bg-gradient-to-r from-[#05030a] via-[#05030a]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-44 bg-gradient-to-l from-[#05030a] via-[#05030a]/80 to-transparent z-20 pointer-events-none" />

        {/* ─── TRACK 1: Leftward Infinite Marquee (Logos & Flagships) ─── */}
        <div className="overflow-hidden w-full max-w-full shrink-0 flex py-1">
          <div className="animate-marquee-left flex items-stretch gap-5 sm:gap-6 pr-5 sm:pr-6">
            {/* Duplicated twice for flawless seamless infinite loop */}
            {[...brandCards, ...brandCards].map((card, idx) => {
              const Icon = card.icon;
              const cardContent = (
                <div
                  className={`flex-shrink-0 w-72 sm:w-80 h-52 p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${card.glow} border ${card.border} backdrop-blur-xl shadow-xl hover:border-purple-300/80 hover:shadow-[0_0_25px_rgba(217,70,239,0.35)] transition-all duration-300 group ${card.href ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between h-7 mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${card.tagColor}`}
                    >
                      {card.badge}
                    </span>
                    {Icon ? (
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-pink-400 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    ) : null}
                  </div>

                  <div className="h-11 flex items-center mb-2">
                    {card.logo ? (
                      <img
                        src={card.logo}
                        alt={card.title}
                        className="max-h-10 max-w-[190px] object-contain drop-shadow-[0_0_12px_rgba(217,70,239,0.35)]"
                      />
                    ) : Icon ? (
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                        <Icon className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="h-10" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-purple-200 transition-colors leading-snug line-clamp-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              );

              return card.href ? (
                <Link key={`brand-track-${idx}`} href={card.href} className="block flex-shrink-0">
                  {cardContent}
                </Link>
              ) : (
                <div key={`brand-track-${idx}`} className="flex-shrink-0">
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── TRACK 2: Rightward Infinite Marquee (Stats & Pillars) ─── */}
        <div className="overflow-hidden w-full max-w-full shrink-0 flex py-1">
          <div className="animate-marquee-right flex items-center gap-4 sm:gap-5 pr-4 sm:pr-5">
            {/* Duplicated twice for flawless seamless infinite loop */}
            {[...highlightCards, ...highlightCards, ...highlightCards].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`stat-track-${idx}`}
                  className={`flex-shrink-0 w-72 sm:w-80 h-[74px] flex items-center gap-3.5 px-4 sm:px-5 py-3 rounded-xl border ${item.accent} backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 group cursor-default`}
                >
                  <div className={`p-2 rounded-lg bg-white/5 ${item.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold truncate">
                      {item.label}
                    </p>
                    <p className={`font-black text-sm sm:text-base ${item.color} leading-tight truncate`}>
                      {item.value}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-none mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
