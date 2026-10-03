'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured client error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05030a] flex items-center justify-center p-4 relative overflow-hidden w-full max-w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 lg:w-[500px] h-64 sm:h-96 lg:h-[500px] bg-purple-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center relative z-10 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-950/40">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white font-['Pixelify_Sans',_sans-serif] tracking-wide">
            Something Went Wrong
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            We encountered a temporary interface hiccup. Click below to recover and refresh your session seamlessly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/40 cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home size={14} />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
