'use client';

import React, { useState } from 'react';
import { CheckCircle, Search, X, AlertTriangle, Eye, ChevronLeft, ChevronRight, IdCard } from 'lucide-react';

interface VerificationQueueTabProps {
  pendingUsers: any[];
  onOpenInspector: (userId: string) => void;
}

function formatDateTimeIST(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return dateStr;
  }
}

export function VerificationQueueTab({ pendingUsers, onOpenInspector }: VerificationQueueTabProps) {
  const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [kycPage, setKycPage] = useState(1);
  const [kycPageSize, setKycPageSize] = useState(6);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const filteredPendingUsers = pendingUsers.filter(u => {
    const q = kycSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.roll_number && u.roll_number.toLowerCase().includes(q)) ||
      (u.college_name && u.college_name.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.year_of_study && String(u.year_of_study).toLowerCase().includes(q))
    );
  });

  const kycTotal = filteredPendingUsers.length;
  const kycTotalPages = Math.max(1, Math.ceil(kycTotal / kycPageSize));
  const paginatedKyc = filteredPendingUsers.slice((kycPage - 1) * kycPageSize, kycPage * kycPageSize);

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-3.5 flex items-center gap-3">
        <CheckCircle size={18} className="text-blue-400 shrink-0" />
        <div>
          <p className="text-blue-200 text-sm font-semibold">Automatic Pass Generation Active</p>
          <p className="text-blue-400/80 text-xs mt-0.5">
            Passes are automatically generated when Cashfree payment is successfully verified. No manual approval needed.
            This tab shows uploaded ID cards for reference only.
          </p>
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={kycSearchQuery}
            onChange={e => {
              setKycSearchQuery(e.target.value);
              setKycPage(1);
            }}
            placeholder="Search by student name, roll number, college, email..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          {kycSearchQuery && (
            <button
              onClick={() => {
                setKycSearchQuery('');
                setKycPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-slate-400">
          <span className="font-mono">
            Showing <strong className="text-white">{filteredPendingUsers.length}</strong> of{' '}
            <strong className="text-purple-300">{pendingUsers.length}</strong> uploaded
          </span>
          {kycSearchQuery && (
            <button
              onClick={() => {
                setKycSearchQuery('');
                setKycPage(1);
              }}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <CheckCircle size={36} className="mx-auto text-emerald-400 mb-2" />
          <h4 className="text-base font-bold text-white">No ID Cards Uploaded</h4>
          <p className="text-xs text-slate-400 mt-1">No external students have uploaded ID cards at this moment.</p>
        </div>
      ) : filteredPendingUsers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <Search size={36} className="mx-auto text-slate-500 mb-1" />
          <h4 className="text-base font-bold text-white">No Matching Students Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No ID card uploads matched &ldquo;{kycSearchQuery}&rdquo;. Try searching with a different name, roll number, college, or email.
          </p>
          <div>
            <button
              onClick={() => {
                setKycSearchQuery('');
                setKycPage(1);
              }}
              className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Clear Search Filter
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {paginatedKyc.map(u => (
              <div key={u.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm">{u.full_name || 'Student'}</h4>
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        ID Uploaded
                      </span>
                    </div>
                    <p className="text-xs text-purple-300 font-mono mt-0.5">{u.email}</p>
                    {u.phone && <p className="text-xs text-slate-400 font-mono mt-0.5">📞 {u.phone}</p>}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0 text-right">
                    {formatDateTimeIST(u.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-slate-500 text-[10px] block">College / University</span>
                    <span className="font-semibold text-slate-200 truncate block">{u.college_name || 'External'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Roll / Student ID</span>
                    <span className="font-mono text-purple-300 truncate block">{u.roll_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Branch</span>
                    <span className="font-medium text-slate-200">{u.department || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Year of Study</span>
                    <span className="font-medium text-slate-200">{u.year_of_study ? `Year ${u.year_of_study}` : '—'}</span>
                  </div>
                </div>

                {/* Pass Status Info */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs">
                  <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                  <span className="text-amber-300">Pass pending — will auto-activate on Cashfree payment success</span>
                </div>

                {u.id_card_url && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold"><CheckCircle size={11} /> College ID Card Uploaded</span>
                      <button
                        onClick={() => setZoomedImage(u.id_card_url)}
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                      >
                        <Eye size={12} /> Zoom ID Card
                      </button>
                    </div>
                    <div
                      onClick={() => setZoomedImage(u.id_card_url)}
                      className="rounded-xl overflow-hidden border border-white/10 bg-black/60 cursor-pointer hover:border-purple-500/40 transition-colors"
                    >
                      <img
                        src={u.id_card_url}
                        alt="Student ID"
                        className="w-full h-44 object-contain"
                      />
                    </div>
                  </div>
                )}

                {!u.id_card_url && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs text-slate-500">
                    <IdCard size={13} />
                    <span>No ID card uploaded yet</span>
                  </div>
                )}

                <button
                  onClick={() => onOpenInspector(u.id)}
                  className="w-full py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye size={13} /> Inspect Student &amp; All Events
                </button>
              </div>
            ))}
          </div>

          {/* KYC Pagination */}
          {kycTotal > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Showing <strong className="text-white">{Math.min(kycTotal, (kycPage - 1) * kycPageSize + 1)}</strong> to{' '}
                <strong className="text-white">{Math.min(kycTotal, kycPage * kycPageSize)}</strong> of{' '}
                <strong className="text-white">{kycTotal}</strong> verification requests
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={kycPage <= 1}
                  onClick={() => setKycPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-slate-300 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 text-slate-300 font-medium font-mono text-[11px]">
                  Page {kycPage} of {kycTotalPages}
                </span>
                <button
                  disabled={kycPage >= kycTotalPages}
                  onClick={() => setKycPage(p => Math.min(kycTotalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-slate-300 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Photo Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-[#0e071c] p-2 rounded-2xl border border-white/20">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/90"
            >
              <X size={18} />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed Student ID"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
