'use client';

import { useEffect, useState } from 'react';
import { Camera, Copy, Save, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { growthApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store';

type ProfileForm = { firstName: string; lastName: string; username: string; country: string; timezone: string };

export default function ProfilePage() {
	const { user, updateUser } = useAuthStore();
	const [form, setForm] = useState<ProfileForm>({ firstName: '', lastName: '', username: '', country: '', timezone: '' });
	const [saving, setSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [avatarUrl, setAvatarUrl] = useState('');
	const [referralStats, setReferralStats] = useState({ totalReferrals: 0, totalEarnedUsdCents: 0 });

	useEffect(() => {
		Promise.all([usersApi.me(), growthApi.referralStats()]).then(([profile, growth]) => {
			const { data } = profile;
			setForm({
				firstName: data.firstName || '',
				lastName: data.lastName || '',
				username: data.preferences?.username || '',
				country: data.country || '',
				timezone: data.timezone || '',
			});
			setAvatarUrl(data.avatarUrl || '');
			setReferralStats(growth.data);
			updateUser(data);
		}).catch(() => toast.error('Unable to load your profile.')).finally(() => setLoading(false));
	}, [updateUser]);

	const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSaving(true);
		try {
			const { data } = await usersApi.update({
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				country: form.country.trim().toUpperCase(),
				timezone: form.timezone.trim(),
				avatarUrl: avatarUrl.trim(),
				preferences: { ...(user as Record<string, unknown> | null)?.preferences as Record<string, unknown> || {}, username: form.username.trim() },
			});
			updateUser(data);
			toast.success('Profile updated.');
		} catch {
			toast.error('Unable to save your profile.');
		} finally { setSaving(false); }
	};

	const referralCode = user?.referralCode || '';
	const referralLink = referralCode && typeof window !== 'undefined' ? `${window.location.origin}/sign-up?ref=${encodeURIComponent(referralCode)}` : referralCode ? `/sign-up?ref=${encodeURIComponent(referralCode)}` : '';

	return (
		<div className="mx-auto max-w-4xl space-y-5">
			<section className="rounded-bp-lg border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-6">
				<div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-brand-accent" /><div><p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-accent">Profile</p><h1 className="mt-2 text-3xl font-semibold">Your identity</h1></div></div>
				<p className="mt-3 text-sm text-[var(--bp-foreground-muted)]">Keep your account name, photo, username, country, and region current.</p>
			</section>

			<form onSubmit={saveProfile} className="rounded-bp-lg border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-6">
				{loading ? <p className="text-sm text-[var(--bp-foreground-muted)]">Loading profile...</p> : <>
					<div className="grid gap-4 sm:grid-cols-2">
						{([['firstName', 'First name'], ['lastName', 'Last name'], ['username', 'Username'], ['country', 'Country / region'], ['timezone', 'Timezone']] as const).map(([key, label]) => (
							<label key={key} className="block text-sm text-[var(--bp-foreground-muted)]">{label}<input value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="bp-input mt-2" maxLength={80} /></label>
						))}
						<div className="rounded-md border border-[var(--bp-border-subtle)] p-3 text-sm"><p className="text-xs uppercase tracking-[0.12em] text-[var(--bp-foreground-muted)]">Email</p><p className="mt-2 break-all">{user?.email || 'Not connected'}</p><p className="mt-1 text-xs text-[var(--bp-foreground-muted)]">Change email in Security.</p></div>
						<div className="rounded-md border border-[var(--bp-border-subtle)] p-3 text-sm"><p className="text-xs uppercase tracking-[0.12em] text-[var(--bp-foreground-muted)]">Phone</p><p className="mt-2">{user?.phoneNumber || 'Not connected'}</p><p className="mt-1 text-xs text-[var(--bp-foreground-muted)]">Verification is managed in Security.</p></div>
					</div>
					  <div className="mt-5 flex items-end gap-3"><label className="block flex-1 text-sm text-[var(--bp-foreground-muted)]"><span className="inline-flex items-center gap-2">Profile photo URL <Camera className="h-4 w-4" /></span><input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="bp-input mt-2" placeholder="https://..." /></label><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-accent px-4 text-sm font-semibold text-black disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save profile'}</button></div>
				</>}
			</form>

			<section className="rounded-bp-lg border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] p-6">
				<p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-accent">Referrals</p>
				<h2 className="mt-2 text-xl font-semibold">Invite friends</h2>
				<p className="mt-2 text-sm text-[var(--bp-foreground-muted)]">Share your referral code or link. Rewards are applied by the backend when eligible.</p>
				<div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-[0.12em] text-[var(--bp-foreground-muted)]">Referral code</p><div className="mt-2 flex gap-2"><input readOnly value={referralCode || 'Unavailable'} className="bp-input" /><button type="button" aria-label="Copy referral code" onClick={() => referralCode && void navigator.clipboard.writeText(referralCode)} className="rounded-md border border-[var(--bp-border-subtle)] px-3"><Copy className="h-4 w-4" /></button></div></div><div><p className="text-xs uppercase tracking-[0.12em] text-[var(--bp-foreground-muted)]">Referral link</p><div className="mt-2 flex gap-2"><input readOnly value={referralLink || 'Unavailable'} className="bp-input" /><button type="button" aria-label="Copy referral link" onClick={() => referralLink && void navigator.clipboard.writeText(referralLink)} className="rounded-md border border-[var(--bp-border-subtle)] px-3"><Copy className="h-4 w-4" /></button></div></div></div>
				<div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-md border border-[var(--bp-border-subtle)] p-3"><p className="text-xs text-[var(--bp-foreground-muted)]">People referred</p><p className="mt-2 text-xl font-semibold">{referralStats.totalReferrals}</p></div><div className="rounded-md border border-[var(--bp-border-subtle)] p-3"><p className="text-xs text-[var(--bp-foreground-muted)]">Rewards earned</p><p className="mt-2 font-mono text-xl font-semibold">${(referralStats.totalEarnedUsdCents / 100).toFixed(2)}</p></div><div className="col-span-2 rounded-md border border-[var(--bp-border-subtle)] p-3"><p className="text-xs text-[var(--bp-foreground-muted)]">Total amount spent</p><p className="mt-2 font-mono text-xl font-semibold">${(Number((user as { lifetimeSpendUsdCents?: number } | null)?.lifetimeSpendUsdCents || 0) / 100).toFixed(2)} USD</p></div></div>
			</section>
		</div>
	);
}
