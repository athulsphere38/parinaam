'use client';

import React from 'react';
import { X, CheckCircle, AlertTriangle, Shield, User, School, BookOpen, Calendar, Phone, Mail, IdCard, ExternalLink, Loader2 } from 'lucide-react';

interface StudentInspectorModalProps {
  userId: string | null;
  data: any | null;
  loading: boolean;
  onClose: () => void;
  onZoomImage: (url: string) => void;
}

export function StudentInspectorModal({ userId, data, loading, onClose, onZoomImage }: StudentInspectorModalProps) {
  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0c0719] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-purple-900/40 flex items-center justify-between bg-gradient-to-r from-purple-950/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Student Passport Inspector</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {userId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-purple-900">
          {loading ? (
            <div className="py-16 text-center space-y-3 text-purple-400">
              <Loader2 size={32} className="animate-spin mx-auto" />
              <p className="text-sm font-mono">Fetching full student record & verification audit log...</p>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-400">
              <AlertTriangle size={32} className="mx-auto text-amber-400 mb-2" />
              <p>Failed to load student verification details.</p>
            </div>
          ) : (
            <>
              {/* Primary User Header */}
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white text-xl font-bold font-display shadow-lg shadow-purple-900/30">
                    {data.user?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-white">{data.user?.full_name}</h4>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        data.user?.is_amrita_student
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {data.user?.is_amrita_student ? 'Amrita Student' : 'Outside Student'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Mail size={12} className="text-slate-500" /> {data.user?.email}
                      {data.user?.phone && (
                        <>
                          <span className="text-slate-600">•</span>
                          <Phone size={12} className="text-slate-500" /> {data.user?.phone}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                    data.user?.verification_status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : data.user?.verification_status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {data.user?.verification_status === 'verified' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {data.user?.verification_status?.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 mt-1">
                    Pass: {data.user?.platform_fee_paid ? 'ACTIVE' : 'NONE'}
                  </span>
                </div>
              </div>

              {/* Institution Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <School size={13} className="text-purple-400" /> College / Institution
                  </p>
                  <p className="text-white font-semibold text-sm">{data.user?.college_name || '—'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-purple-400" /> Roll Number / Reg No
                  </p>
                  <p className="text-white font-mono font-semibold text-sm">{data.user?.roll_number || '—'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <Shield size={13} className="text-purple-400" /> Department / Branch
                  </p>
                  <p className="text-white font-semibold">{data.user?.department || '—'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <Calendar size={13} className="text-purple-400" /> Year of Study
                  </p>
                  <p className="text-white font-semibold">{data.user?.year_of_study ? `Year ${data.user.year_of_study}` : '—'}</p>
                </div>
              </div>

              {/* ID Card Upload Preview */}
              {data.user?.id_card_url && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <IdCard size={14} className="text-purple-400" /> Student Verification ID Card
                    </p>
                    <button
                      onClick={() => onZoomImage(data.user.id_card_url)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
                    >
                      <ExternalLink size={12} /> Inspect High-Res
                    </button>
                  </div>
                  <div
                    onClick={() => onZoomImage(data.user.id_card_url)}
                    className="relative aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/10 cursor-pointer group"
                  >
                    <img
                      src={data.user.id_card_url}
                      alt="Student ID Card"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              )}

              {/* Registrations List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Enrolled Competitions & Workshops ({data.registrations?.length || 0})
                </h4>
                {(!data.registrations || data.registrations.length === 0) ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center">
                    No event registrations recorded for this student yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.registrations.map((r: any) => (
                      <div key={r.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-white">{r.event_name || 'Event'}</p>
                          <p className="text-[10px] text-slate-400">{r.club_name || 'Parinaam Fest'}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
