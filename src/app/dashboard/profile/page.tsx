'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building2, GraduationCap, MapPin, Save, Loader2, CheckCircle, Upload, AlertTriangle } from 'lucide-react';
import { useRequireAuth, useAuth } from '@/context/AuthContext';
import { isValidStudentName, MAX_STUDENT_NAME_LENGTH, isValidEmail } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useRequireAuth();
  const { refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    email: '', full_name: '', phone: '', college_name: '',
    department: '', year_of_study: '', city: '', roll_number: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      email:        user.email        || '',
      full_name:    user.full_name    || '',
      phone:        user.phone        || '',
      college_name: user.college_name || '',
      department:   user.department   || '',
      year_of_study:user.year_of_study|| '',
      city:         user.city         || '',
      roll_number:  user.roll_number  || '',
    });
  }, [user]);

  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isValidEmail(form.email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    const nameCheck = isValidStudentName(form.full_name);
    if (!nameCheck.valid) {
      setErrorMsg(nameCheck.error || 'Student name is invalid');
      return;
    }

    setSaving(true);
    // Send form data without roll_number to guarantee immutability
    const { roll_number: _ignored, ...updatePayload } = form;
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setErrorMsg(data.error || 'Failed to update profile');
    }
  };

  const handleIdUpload = async () => {
    if (!idFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('id_card', idFile);
    await fetch('/api/auth/upload-id', { method: 'POST', body: fd });
    await refreshUser();
    setUploading(false);
    setIdFile(null);
  };

  if (!user) return null;

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all";

  return (
    <div className="min-h-screen bg-[#05030a] pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Update your personal information</p>
        </div>

        {/* Verification status card */}
        <div className={`mb-6 p-4 rounded-2xl border ${
          user.verification_status === 'verified'  ? 'bg-green-500/10 border-green-500/30' :
          user.verification_status === 'rejected'  ? 'bg-red-500/10 border-red-500/30' :
          'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {user.verification_status === 'verified'  ? <CheckCircle size={16} className="text-green-400"/> :
             user.verification_status === 'rejected'  ? <AlertTriangle size={16} className="text-red-400"/> :
             <AlertTriangle size={16} className="text-amber-400"/>}
            <p className={`text-sm font-semibold capitalize ${
              user.verification_status === 'verified'  ? 'text-green-300' :
              user.verification_status === 'rejected'  ? 'text-red-300' : 'text-amber-300'
            }`}>
              Account Verification: {user.verification_status || 'Pending'}
            </p>
          </div>

          {user.verification_status !== 'verified' && (
            <p className="text-slate-400 text-xs mb-3">
              {user.verification_status === 'rejected'
                ? 'Your registration was rejected by Super Admin. Please contact the coordinators.'
                : 'Your profile is awaiting Super Admin verification. Once approved, you can register for events.'}
            </p>
          )}

          {!user.is_amrita_student && user.verification_status !== 'verified' && (
            <>
              <p className="text-slate-400 text-xs mb-3">
                {user.verification_status === 'rejected'
                  ? 'Please upload a clearer image of your college ID card.'
                  : 'Upload your college ID card for account verification.'}
              </p>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500/40 transition-colors"
                onClick={() => document.getElementById('id-card-upload')?.click()}>
                <Upload size={20} className="mx-auto text-slate-500 mb-1"/>
                <p className="text-slate-400 text-xs">{idFile ? idFile.name : 'Click to select ID card (JPG, PNG, PDF)'}</p>
                <input id="id-card-upload" type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                  onChange={e => setIdFile(e.target.files?.[0] || null)}/>
              </div>
              {idFile && (
                <button onClick={handleIdUpload} disabled={uploading}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-xl text-sm disabled:opacity-50">
                  {uploading ? 'Uploading…' : 'Upload ID Card'}
                </button>
              )}
              {user.id_card_url && !idFile && (
                <p className="text-slate-600 text-xs mt-2">ID card already uploaded — waiting for review</p>
              )}
            </>
          )}
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          {saved && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
              <CheckCircle size={15}/> Profile saved successfully!
            </motion.div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value.toLowerCase().trim() }))}
                placeholder="your.email@example.com"
                className={`${inp} pl-9`}
                required
              />
            </div>
            {user.is_amrita_student && <p className="text-xs text-purple-400 mt-1">✓ Verified Amrita student</p>}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Full Name (max {MAX_STUDENT_NAME_LENGTH} chars)
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input
                value={form.full_name}
                maxLength={MAX_STUDENT_NAME_LENGTH}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value.slice(0, MAX_STUDENT_NAME_LENGTH) }))}
                placeholder="As on college ID"
                className={`${inp} pl-9`}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">Phone Number (10 Digits)</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input
                type="tel"
                maxLength={10}
                value={form.phone}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm(p => ({ ...p, phone: cleaned }));
                }}
                placeholder="10-digit mobile number"
                className={`${inp} pl-9`}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">College Name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input
                value={form.college_name}
                onChange={e => setForm(p => ({ ...p, college_name: e.target.value }))}
                placeholder="Institution name"
                disabled={user.is_amrita_student}
                className={`${inp} pl-9 ${user.is_amrita_student ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Roll / Registration Number <span className="text-slate-500 font-normal">(Cannot be modified)</span>
            </label>
            <div className="relative">
              <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input
                value={form.roll_number}
                disabled
                readOnly
                title="Roll number cannot be changed after registration"
                placeholder="Your roll/reg number"
                className={`${inp} pl-9 opacity-50 cursor-not-allowed select-none bg-white/[0.02] border-white/5 text-slate-400`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">City</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                placeholder="Your city"
                className={`${inp} pl-9`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Branch</label>
              <select
                value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full bg-[#0e0b1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Branch</option>
                {['CSE', 'CSE-AIE', 'AIDS', 'CCE', 'ECE', 'QUANTUM'].map(b => (
                  <option key={b} value={b} className="bg-[#0e0b1a] text-slate-100">{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Year of Study</label>
              <select
                value={form.year_of_study}
                onChange={e => setForm(p => ({ ...p, year_of_study: e.target.value }))}
                className="w-full bg-[#0e0b1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Year</option>
                {['1', '2', '3', '4'].map(y => (
                  <option key={y} value={y} className="bg-[#0e0b1a] text-slate-100">Year {y}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16}/> Save Profile</>}
          </button>
        </form>
      </div>
    </div>
  );
}
