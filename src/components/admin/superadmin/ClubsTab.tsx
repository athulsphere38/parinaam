'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ClubsTabProps {
  clubs: any[];
}

export function ClubsTab({ clubs }: ClubsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map(club => (
          <div
            key={club.id}
            className="bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: club.color || '#9333ea' }}
                />
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  /admin/{club.slug}
                </span>
              </div>

              <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                {club.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {club.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Events: <strong className="text-white">{club.event_count || '0'}</strong>
              </span>
              <Link
                href={`/admin/${club.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600 px-3 py-1.5 rounded-lg transition-all"
              >
                Enter Portal <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
