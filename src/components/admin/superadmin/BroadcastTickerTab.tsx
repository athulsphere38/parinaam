'use client';

import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';

interface BroadcastTickerTabProps {
  initialBroadcastText?: string;
}

export function BroadcastTickerTab({
  initialBroadcastText = '🎉 PARINAAM 2026 Registration Open! Explore 40+ National Events and Register Today.',
}: BroadcastTickerTabProps) {
  const [broadcastText, setBroadcastText] = useState(initialBroadcastText);
  const [broadcastSaved, setBroadcastSaved] = useState(false);

  return (
    <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Megaphone size={18} className="text-purple-400" /> Live Marquee Announcement
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          This message scrolls dynamically in the global top notification bar across the website.
        </p>
      </div>

      <textarea
        value={broadcastText}
        onChange={(e) => setBroadcastText(e.target.value)}
        rows={3}
        className="w-full bg-[#0e0b1a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
      />

      <button
        onClick={() => {
          setBroadcastSaved(true);
          setTimeout(() => setBroadcastSaved(false), 2500);
        }}
        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-900/40"
      >
        {broadcastSaved ? '✓ Broadcast Updated' : 'Publish Announcement'}
      </button>
    </div>
  );
}
