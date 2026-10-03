'use client';
import { useEffect } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Registration page error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05030a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">Registration Portal Notice</h3>
        <p className="text-xs text-slate-400">
          The registration form encountered a temporary loading issue. Click retry to reload your registration session.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Retry Form
          </button>
          <Link
            href="/"
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
