import { FormEvent, useEffect, useState } from 'react';
import { Check, KeyRound, MailCheck, Send } from 'lucide-react';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import type { EmailAuditItem } from '../services/types';
import { useAuthStore } from '../store/authStore';

export function AccountPage() {
	const { user } = useAuthStore();
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [verificationMessage, setVerificationMessage] = useState('');
	const [verificationError, setVerificationError] = useState('');
	const [isSendingVerification, setIsSendingVerification] = useState(false);
	const [activeTab, setActiveTab] = useState<'profile' | 'emails'>('profile');
	const [emails, setEmails] = useState<EmailAuditItem[]>([]);
	const [emailError, setEmailError] = useState('');
	const [emailMessage, setEmailMessage] = useState('');
	const [pendingEmailAction, setPendingEmailAction] = useState<string | null>(null);
	const [isLoadingEmails, setIsLoadingEmails] = useState(false);

	async function loadEmails() {
		if (!user?.isSiteAdmin) {
			return;
		}

		setEmailError('');
		setIsLoadingEmails(true);
		try {
			setEmails(await adminService.emails());
		} catch (err) {
			setEmailError(err instanceof Error ? err.message : 'Could not load email outbox.');
		} finally {
			setIsLoadingEmails(false);
		}
	}

	useEffect(() => {
		if (activeTab === 'emails') {
			loadEmails();
		}
	}, [activeTab, user?.isSiteAdmin]);

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

	async function resendVerification() {
		setVerificationMessage('');
		setVerificationError('');
		setIsSendingVerification(true);
		try {
			const response = await authService.resendEmailVerification();
			setVerificationMessage(response.message);
		} catch (err) {
			setVerificationError(err instanceof Error ? err.message : 'Could not send verification email.');
		} finally {
			setIsSendingVerification(false);
		}
	}

	async function retryEmail(email: EmailAuditItem) {
		setEmailError('');
		setEmailMessage('');
		setPendingEmailAction(email.id);
		try {
			await adminService.retryEmail(email.id);
			setEmailMessage('Email retry attempted.');
			await loadEmails();
		} catch (err) {
			setEmailError(err instanceof Error ? err.message : 'Could not retry email.');
		} finally {
			setPendingEmailAction(null);
		}
	}

	return (
		<div className="grid gap-6">
			<PageHeader title="Account" description="Manage your sign-in details." />
			{user?.isSiteAdmin ? (
				<div className="flex flex-wrap gap-2 border-b border-slate-200">
					<button className={activeTab === 'profile' ? 'border-b-2 border-ink px-3 py-2 text-sm font-bold text-ink' : 'px-3 py-2 text-sm font-bold text-slate-500'} onClick={() => setActiveTab('profile')}>Profile</button>
					<button className={activeTab === 'emails' ? 'border-b-2 border-ink px-3 py-2 text-sm font-bold text-ink' : 'px-3 py-2 text-sm font-bold text-slate-500'} onClick={() => setActiveTab('emails')}>Email outbox</button>
				</div>
			) : null}
			{activeTab === 'profile' ? (
			<section className="grid max-w-2xl gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
				<div>
					<h2 className="text-lg font-bold text-ink">Profile</h2>
					<div className="mt-3 grid gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-700">
						<p><span className="font-semibold text-ink">Name:</span> {user?.name}</p>
						<p><span className="font-semibold text-ink">Email:</span> {user?.emailAddress}</p>
						<p className="flex flex-wrap items-center gap-2">
							<span className="font-semibold text-ink">Verification:</span>
							<span className={user?.isEmailVerified ? 'rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-800' : 'rounded bg-amber-100 px-2 py-1 font-semibold text-amber-800'}>
								{user?.isEmailVerified ? 'Verified' : 'Not verified'}
							</span>
						</p>
					</div>
				</div>
				{user?.isEmailVerified ? null : (
					<div className="grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
						<div className="flex items-start gap-3">
							<MailCheck className="mt-1 text-amber-700" size={20} />
							<div>
								<h2 className="text-base font-bold text-ink">Verify your email</h2>
								<p className="mt-1 text-sm text-slate-700">Send a verification link to unlock verified account status.</p>
							</div>
						</div>
						{verificationMessage ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{verificationMessage}</p> : null}
						{verificationError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{verificationError}</p> : null}
						<div className="flex justify-end">
							<Button type="button" icon={<Send size={16} />} loading={isSendingVerification} loadingLabel="Sending..." onClick={resendVerification}>Send verification email</Button>
						</div>
					</div>
				)}
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
			) : null}
			{user?.isSiteAdmin && activeTab === 'emails' ? (
				<section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-ink">Email outbox</h2>
							<p className="mt-1 text-sm text-slate-600">Platform emails with provider status and failure details.</p>
						</div>
						<div className="flex items-center gap-2">
							<StatusBadge label={`${emails.length} emails`} />
							<Button type="button" variant="secondary" loading={isLoadingEmails} loadingLabel="Loading..." onClick={loadEmails}>Refresh</Button>
						</div>
					</div>
					{emailMessage ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{emailMessage}</p> : null}
					{emailError ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{emailError}</p> : null}
					<div className="mt-4 grid gap-3">
						{emails.map((email) => (
							<article key={email.id} className="grid gap-3 rounded-md border border-slate-200 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<StatusBadge label={email.status} tone={getEmailTone(email.status)} />
										<p className="truncate text-sm font-semibold text-ink">{email.subject}</p>
									</div>
									<p className="mt-1 text-sm text-slate-700">
										{email.toName ? `${email.toName} ` : ''}<span className="font-semibold">{email.toEmailAddress}</span>
									</p>
									<div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
										<span>{email.provider}</span>
										<span>{email.attempts} attempt{email.attempts === 1 ? '' : 's'}</span>
										{email.providerMessageId ? <span className="break-all">Provider id {email.providerMessageId}</span> : null}
										<span>{new Date(email.createdAt).toLocaleString()}</span>
									</div>
									{email.failureReason ? <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{email.failureReason}</p> : null}
									{email.nextAttemptAt ? <p className="mt-1 text-xs text-slate-500">Next retry after {new Date(email.nextAttemptAt).toLocaleString()}</p> : null}
								</div>
								{email.status === 'Failed' ? (
									<Button type="button" variant="secondary" loading={pendingEmailAction === email.id} loadingLabel="Retrying..." onClick={() => retryEmail(email)}>Retry</Button>
								) : null}
							</article>
						))}
						{emails.length === 0 && !isLoadingEmails ? <p className="text-sm text-slate-600">No emails recorded yet.</p> : null}
					</div>
				</section>
			) : null}
		</div>
	);
}

function getEmailTone(status: string): 'neutral' | 'good' | 'warning' | 'bad' {
	if (status === 'Sent') {
		return 'good';
	}

	if (status === 'Failed') {
		return 'bad';
	}

	if (status === 'Pending' || status === 'Sending') {
		return 'warning';
	}

	return 'neutral';
}
