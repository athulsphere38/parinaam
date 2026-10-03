'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FEST_CONFIG } from '../../data/festData';
import { MapPin, Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  const pathname = usePathname();
  if (pathname === '/auth/register' || pathname === '/register' || pathname?.startsWith('/auth/register')) {
    return null;
  }

  return (
    <footer className="bg-[#05080f] border-t border-slate-800 text-slate-400 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-display font-black text-lg text-white">
                P
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                {FEST_CONFIG.name} <span className="text-primary font-mono">{FEST_CONFIG.edition}</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {FEST_CONFIG.subtitle}. Amrita Amaravati's annual techno-cultural fest. Two days of hackathons, robowars, stage events, music, and sports.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Amaravati, Andhra Pradesh</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Amrita Amaravati</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  All Events
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-white transition-colors">
                  Schedule
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-white transition-colors text-purple-400 font-medium">
                  Register For Pass
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Featured Club Events / Clusters */}
          <div>
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">
              Popular Events
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/events/6b55f19c-02ce-45b2-a107-0935e4e5babd"
                  className="hover:text-white transition-colors"
                >
                  Harness.md Challenge
                </Link>
              </li>
              <li>
                <Link
                  href="/events/fe459bfb-059b-4b90-8fb8-5e9ac9185417"
                  className="hover:text-white transition-colors"
                >
                  Obstacle Robotic Racing
                </Link>
              </li>
              <li>
                <Link
                  href="/events/3c640142-44a4-4b06-8e76-68b2dda1c9e3"
                  className="hover:text-white transition-colors"
                >
                  Tholu Bommalata Theatre
                </Link>
              </li>
              <li>
                <Link
                  href="/events/9446dfef-14c7-406e-ab99-9abb83b3050e"
                  className="hover:text-white transition-colors"
                >
                  HackoPoly AI Challenge
                </Link>
              </li>
              <li>
                <Link
                  href="/events/d3e77771-8860-4ce3-8906-3e0e6e8751f1"
                  className="hover:text-white transition-colors"
                >
                  Garba Night
                </Link>
              </li>
              <li>
                <Link
                  href="/events/edd3b356-a5c6-4d01-a2e6-422ad74cc8e6"
                  className="hover:text-white transition-colors"
                >
                  Neon Badminton
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">
              Support & Desk
            </h4>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="font-mono text-xs">{FEST_CONFIG.contactEmail}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs">{FEST_CONFIG.helplinePhone}</span>
              </p>
              <p className="text-xs text-slate-400 leading-normal pt-1">
                Student Registration Desk open 8:30 AM – 8:00 PM during festival days.
              </p>
            </div>
          </div>
        </div>

                {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>© 2026 {FEST_CONFIG.name} Fest Team. All rights reserved.</span>
            <span>•</span>
            <span className="font-mono">{FEST_CONFIG.collegeName}</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Festival Guidelines
            </a>
            <span className="text-slate-400">
              Built by Chakravyuha Club • Amrita Amaravati
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
