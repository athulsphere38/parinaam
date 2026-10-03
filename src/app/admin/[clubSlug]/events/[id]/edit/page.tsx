'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Eye, AlertCircle, Trash2, Users, ExternalLink, Globe } from 'lucide-react';
import { useRequireRole } from '@/context/AuthContext';
import { EventImageUploader } from '@/components/admin/EventImageUploader';

export default function EditEventPage() {
	const { id, clubSlug } = useParams<{ id: string; clubSlug: string }>();
	const { user } = useRequireRole(['club_admin', 'super_admin']);
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState('');
	const [form, setForm] = useState({
		name: '', tagline: '', short_description: '', full_description: '',
		venue: '', date_start: '', date_end: '', start_time: '', end_time: '',
		participation_type: 'individual' as 'individual' | 'team',
		min_team_size: '1', max_team_size: '1',
		team_pricing_structure: '',
		amrita_fee: '',
		other_fee: '',
		registration_mode: 'internal' as 'internal' | 'unstop',
		unstop_url: '',
		fee: '0', capacity: '', prize_pool: '', eligibility: '',
		poster_url: '', status: 'draft', registration_open: false, is_popular: false,
	});

	useEffect(() => {
		fetch(`/api/events/${id}`).then(r => r.json()).then(d => {
			if (d.success) {
				const ev = d.data.event;
				const isTeam = (Number(ev.max_team_size) || 1) > 1;
				const hasUnstop = Boolean(ev.unstop_url || ev.registration_url);
				setForm({
					name: ev.name || '',
					tagline: ev.tagline || '',
					short_description: ev.short_description || '',
					full_description: ev.full_description || '',
					venue: ev.venue || '',
					date_start: ev.date_start ? ev.date_start.split('T')[0] : '',
					date_end: ev.date_end ? ev.date_end.split('T')[0] : '',
					start_time: ev.start_time ? ev.start_time.slice(0, 5) : '',
					end_time: ev.end_time ? ev.end_time.slice(0, 5) : '',
					participation_type: isTeam ? 'team' : 'individual',
					min_team_size: String(ev.min_team_size || (isTeam ? 2 : 1)),
					max_team_size: String(ev.max_team_size || (isTeam ? 4 : 1)),
					team_pricing_structure: '',
					amrita_fee: ev.amrita_fee != null ? String(ev.amrita_fee) : '',
					other_fee: ev.other_fee != null ? String(ev.other_fee) : '',
					registration_mode: hasUnstop ? 'unstop' : 'internal',
					unstop_url: ev.unstop_url || ev.registration_url || '',
					fee: String(ev.fee ?? 0),
					capacity: ev.capacity ? String(ev.capacity) : '',
					prize_pool: ev.prize_pool || '',
					eligibility: ev.eligibility || '',
					poster_url: ev.poster_url || '',
					status: ev.status || 'draft',
					registration_open: ev.registration_open ?? false,
					is_popular: ev.is_popular ?? false,
				});
			}
		}).finally(() => setLoading(false));
	}, [id]);

	const set = (key: string, value: unknown) => setForm(form => ({ ...form, [key]: value }));

	const handleSave = async (publish?: boolean) => {
		setSaving(true);
		setError('');

		let effectiveUnstopUrl = form.unstop_url?.trim() || '';
		if (form.registration_mode === 'unstop') {
			if (!effectiveUnstopUrl) {
				setError('Please provide a valid Unstop or external registration URL');
				setSaving(false);
				return;
			}
			if (!effectiveUnstopUrl.startsWith('http://') && !effectiveUnstopUrl.startsWith('https://')) {
				effectiveUnstopUrl = `https://${effectiveUnstopUrl}`;
			}
			try {
				new URL(effectiveUnstopUrl);
			} catch {
				setError('Invalid Unstop or external URL format');
				setSaving(false);
				return;
			}
		} else {
			effectiveUnstopUrl = '';
		}

		let effectiveEligibility = form.eligibility || '';
		if (form.participation_type === 'team' && form.team_pricing_structure?.trim()) {
			if (!effectiveEligibility.includes(form.team_pricing_structure.trim())) {
				effectiveEligibility = effectiveEligibility
					? `${effectiveEligibility}\n\nTeam Pricing Structure: ${form.team_pricing_structure.trim()}`
					: `Team Pricing Structure: ${form.team_pricing_structure.trim()}`;
			}
		}

		const payload: Record<string, unknown> = {
			...form,
			unstop_url: effectiveUnstopUrl || null,
			registration_url: effectiveUnstopUrl || null,
			fee: parseInt(form.fee) || 0,
			min_team_size: form.participation_type === 'individual' ? 1 : (parseInt(form.min_team_size) || 2),
			max_team_size: form.participation_type === 'individual' ? 1 : (parseInt(form.max_team_size) || 4),
			eligibility: effectiveEligibility,
			capacity: form.capacity ? parseInt(form.capacity) : null,
			amrita_fee: form.participation_type === 'team' && form.amrita_fee !== '' ? parseInt(form.amrita_fee) : null,
			other_fee: form.participation_type === 'team' && form.other_fee !== '' ? parseInt(form.other_fee) : null,
		};
		if (publish !== undefined) {
			payload.status = publish ? 'published' : 'draft';
			payload.registration_open = publish;
		}

		const res = await fetch(`/api/events/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		const data = await res.json();
		setSaving(false);
		if (data.success) router.push(`/admin/${clubSlug}`);
		else setError(data.error || 'Save failed');
	};

	const handleDelete = async () => {
		if (!window.confirm(`Are you sure you want to permanently delete '${form.name || 'this event'}'? This action cannot be undone.`)) {
			return;
		}
		setDeleting(true);
		try {
			const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
			const data = await res.json();
			if (data.success) {
				router.push(`/admin/${clubSlug}`);
			} else {
				setError(data.error || 'Failed to delete event');
				setDeleting(false);
			}
		} catch {
			setError('Network error deleting event');
			setDeleting(false);
		}
	};

	if (!user || loading) return (
		<div className="min-h-screen bg-[#05030a] pt-28 flex items-center justify-center">
			<Loader2 size={32} className="animate-spin text-purple-500" />
		</div>
	);

	const inp = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all';
	const txta = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all resize-none';

	return (
		<div className="min-h-screen bg-[#05030a] pt-20 pb-16">
			<div className="max-w-3xl mx-auto px-4">
				<div className="flex items-center justify-between mb-6 flex-wrap gap-3">
					<div>
						<Link href={`/admin/${clubSlug}`} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-1">
							<ArrowLeft size={14} /> Back to Club Admin
						</Link>
						<h1 className="text-xl font-bold text-white">Edit Event</h1>
					</div>
					<div className="flex gap-2 items-center">
						<button onClick={handleDelete} disabled={deleting || saving}
							className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-sm font-medium px-3.5 py-2 rounded-xl disabled:opacity-50 transition-all">
							{deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
						</button>
						<button onClick={() => handleSave()} disabled={saving || deleting}
							className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50">
							<Save size={14} /> Save
						</button>
						<button onClick={() => handleSave(form.status !== 'published')} disabled={saving || deleting}
							className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-all ${
								form.status === 'published'
									? 'bg-amber-600/30 border border-amber-500/40 text-amber-300 hover:bg-amber-600/40'
									: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
							}`}>
							<Eye size={14} /> {form.status === 'published' ? 'Unpublish' : 'Publish'}
						</button>
					</div>
				</div>

				{error && (
					<div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
						<AlertCircle size={14} /> {error}
					</div>
				)}

				<div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
					<F label="Event Name *"><input value={form.name} onChange={e => set('name', e.target.value)} className={inp} /></F>
					<F label="Tagline"><input value={form.tagline} onChange={e => set('tagline', e.target.value)} className={inp} /></F>
					<F label="Short Description"><textarea value={form.short_description} onChange={e => set('short_description', e.target.value)} rows={2} className={txta} /></F>
					<F label="Full Description"><textarea value={form.full_description} onChange={e => set('full_description', e.target.value)} rows={5} className={txta} /></F>
					
					{/* Participation Type & Team Sizing */}
					<div>
						<label className="block text-xs font-medium text-slate-400 mb-1.5">Participation Type *</label>
						<div className="grid grid-cols-2 gap-3 mb-3">
							<div
								onClick={() => {
									set('participation_type', 'individual');
									set('min_team_size', '1');
									set('max_team_size', '1');
								}}
								className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
									form.participation_type === 'individual'
										? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30'
										: 'bg-white/5 border-white/10 hover:border-white/20'
								}`}
							>
								<p className="text-white font-bold text-xs">👤 Individual Entry</p>
								<p className="text-slate-400 text-[11px] mt-0.5">Solo participants</p>
							</div>

							<div
								onClick={() => {
									set('participation_type', 'team');
									if (form.min_team_size === '1' && form.max_team_size === '1') {
										set('min_team_size', '2');
										set('max_team_size', '4');
									}
								}}
								className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
									form.participation_type === 'team'
										? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30'
										: 'bg-white/5 border-white/10 hover:border-white/20'
								}`}
							>
								<p className="text-white font-bold text-xs">👥 Team Participation</p>
								<p className="text-slate-400 text-[11px] mt-0.5">Multi-member squads</p>
							</div>
						</div>

						{form.participation_type === 'team' && (
							<div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3 mb-3">
								<div className="grid grid-cols-2 gap-3">
									<F label="Min Team Size">
										<input type="number" min="2" value={form.min_team_size} onChange={e => set('min_team_size', e.target.value)} className={inp} />
									</F>
									<F label="Max Team Size">
										<input type="number" min="2" value={form.max_team_size} onChange={e => set('max_team_size', e.target.value)} className={inp} />
									</F>
								</div>
								<F label="Team Pricing Breakdown / Tiers">
									<input
										value={form.team_pricing_structure}
										onChange={e => set('team_pricing_structure', e.target.value)}
										placeholder="e.g. ₹350 for team of 4, ₹200 for team of 2"
										className={inp}
									/>
								</F>
								{/* Per-college fee tiers */}
								<div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
									<p className="text-xs font-semibold text-purple-300">📋 College-based Fee Tiers</p>
									<p className="text-slate-400 text-[11px]">Leave blank to use the general fee for all students.</p>
									<div className="grid grid-cols-2 gap-3">
										<F label="🏛️ Amrita Students (₹)">
											<input type="number" min="0" value={form.amrita_fee} onChange={e => set('amrita_fee', e.target.value)} placeholder="e.g. 150" className={inp} />
										</F>
										<F label="🎓 Other College (₹)">
											<input type="number" min="0" value={form.other_fee} onChange={e => set('other_fee', e.target.value)} placeholder="e.g. 300" className={inp} />
										</F>
									</div>
								</div>

							</div>
						)}
					</div>

					{/* Registration Mode & Unstop Link */}
					<div>
						<label className="block text-xs font-medium text-slate-400 mb-1.5">Registration Method *</label>
						<div className="grid grid-cols-2 gap-3 mb-3">
							<div
								onClick={() => {
									set('registration_mode', 'internal');
									set('unstop_url', '');
								}}
								className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
									form.registration_mode === 'internal'
										? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30'
										: 'bg-white/5 border-white/10 hover:border-white/20'
								}`}
							>
								<div className="flex items-center gap-1.5 mb-1">
									<Globe size={14} className="text-purple-400" />
									<p className="text-white font-bold text-xs">Internal Portal</p>
								</div>
								<p className="text-slate-400 text-[11px] leading-relaxed">Parinaam digital pass & QR check-in</p>
							</div>

							<div
								onClick={() => set('registration_mode', 'unstop')}
								className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
									form.registration_mode === 'unstop'
										? 'bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-blue-500 ring-2 ring-blue-500/40'
										: 'bg-white/5 border-white/10 hover:border-white/20'
								}`}
							>
								<div className="flex items-center gap-1.5 mb-1">
									<ExternalLink size={14} className="text-blue-400" />
									<p className="text-white font-bold text-xs">Unstop / External Link</p>
								</div>
								<p className="text-slate-400 text-[11px] leading-relaxed">Direct external competition page</p>
							</div>
						</div>

						{form.registration_mode === 'unstop' && (
							<div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2 mb-3">
								<F label="Unstop / External Registration URL *">
									<div className="flex gap-2">
										<input
											value={form.unstop_url}
											onChange={e => set('unstop_url', e.target.value)}
											placeholder="https://unstop.com/competitions/..."
											className={`${inp} flex-1`}
										/>
										{form.unstop_url && (
											<a
												href={form.unstop_url.startsWith('http') ? form.unstop_url : `https://${form.unstop_url}`}
												target="_blank"
												rel="noopener noreferrer"
												className="px-3 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
												title="Test link"
											>
												<span>Test</span>
												<ExternalLink size={12} />
											</a>
										)}
									</div>
								</F>
								<p className="text-blue-300/80 text-[11px]">
									💡 Participants will see a direct <strong>"Register on Unstop ↗"</strong> action button linking to this URL.
								</p>
							</div>
						)}
					</div>

					<F label="Venue"><input value={form.venue} onChange={e => set('venue', e.target.value)} className={inp} /></F>
					<div className="grid grid-cols-2 gap-4">
						<F label="Start Date"><input type="date" value={form.date_start} onChange={e => set('date_start', e.target.value)} className={inp} /></F>
						<F label="End Date"><input type="date" value={form.date_end} onChange={e => set('date_end', e.target.value)} className={inp} /></F>
						<F label="Start Time"><input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={inp} /></F>
						<F label="End Time"><input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={inp} /></F>
						<F label="Registration Fee (₹)"><input type="number" min="0" value={form.fee} onChange={e => set('fee', e.target.value)} className={inp} /></F>
						<F label="Max Capacity"><input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="Unlimited" className={inp} /></F>
					</div>
					<F label="Prize Pool"><input value={form.prize_pool} onChange={e => set('prize_pool', e.target.value)} placeholder="e.g. ₹50,000" className={inp} /></F>
					<F label="Eligibility & Guidelines"><textarea value={form.eligibility} onChange={e => set('eligibility', e.target.value)} rows={3} className={txta} /></F>
					<EventImageUploader value={form.poster_url} onChange={url => set('poster_url', url)} />

					<div className="space-y-3 pt-2">
						{[
							{ key: 'registration_open', label: 'Registration Open', desc: 'Allow students to register' },
							{ key: 'is_popular', label: 'Mark as Flagship / Popular', desc: 'Featured prominently on festival main page' },
						].map(toggle => (
							<div key={toggle.key} className="flex items-center justify-between bg-white/3 border border-white/10 rounded-xl px-4 py-3">
								<div>
									<p className="text-white text-sm font-medium">{toggle.label}</p>
									<p className="text-slate-500 text-xs">{toggle.desc}</p>
								</div>
								<button onClick={() => set(toggle.key, !form[toggle.key as keyof typeof form])}
									className={`w-12 h-6 rounded-full transition-all relative ${form[toggle.key as keyof typeof form] ? 'bg-purple-600' : 'bg-white/10'}`}>
									<div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form[toggle.key as keyof typeof form] ? 'left-7' : 'left-1'}`} />
								</button>
							</div>
						))}
					</div>

					<div className="pt-4 flex gap-3">
						<button onClick={handleDelete} disabled={deleting || saving}
							className="w-1/3 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-bold py-3 rounded-xl transition-all disabled:opacity-50">
							{deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete Event
						</button>
						<button onClick={() => handleSave()} disabled={saving || deleting}
							className="w-2/3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50">
							{saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Changes</>}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div>
			<label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
			{children}
		</div>
	);
}
