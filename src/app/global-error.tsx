'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#05030a] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Application Notice</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              A temporary issue occurred while rendering. Click below to reload the app.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
