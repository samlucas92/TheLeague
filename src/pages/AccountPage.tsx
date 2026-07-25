import { FormEvent, useState } from 'react';
import { Check, KeyRound } from 'lucide-react';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function AccountPage() {
	const { user } = useAuthStore();
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setMessage('');
		setError('');

		if (newPassword !== confirmPassword) {
			setError('New passwords do not match.');
			return;
		}

		setIsSubmitting(true);
		try {
			await authService.changePassword(currentPassword, newPassword);
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setMessage('Password changed.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not change password.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="grid gap-6">
			<PageHeader title="Account" description="Manage your sign-in details." />
			<section className="grid max-w-2xl gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
				<div>
					<h2 className="text-lg font-bold text-ink">Profile</h2>
					<div className="mt-3 grid gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-700">
						<p><span className="font-semibold text-ink">Name:</span> {user?.name}</p>
						<p><span className="font-semibold text-ink">Email:</span> {user?.emailAddress}</p>
					</div>
				</div>
				<form className="grid gap-4 border-t border-slate-100 pt-5" onSubmit={submit}>
					<div>
						<h2 className="text-lg font-bold text-ink">Change password</h2>
						<p className="mt-1 text-sm text-slate-600">Use at least 8 characters and choose something different from your current password.</p>
					</div>
					<Field label="Current password">
						<TextInput type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
					</Field>
					<Field label="New password">
						<TextInput type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
					</Field>
					<Field label="Confirm new password">
						<TextInput type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
					</Field>
					{message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{message}</p> : null}
					{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
					<div className="flex justify-end">
						<Button type="submit" icon={message ? <Check size={16} /> : <KeyRound size={16} />} loading={isSubmitting} loadingLabel="Changing...">Change password</Button>
					</div>
				</form>
			</section>
		</div>
	);
}
