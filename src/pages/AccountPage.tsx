import { FormEvent, useEffect, useState } from 'react';
import { Check, KeyRound, MailCheck, Send, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import type { EmailAuditItem, SiteUserAdminItem } from '../services/types';
import { useAuthStore } from '../store/authStore';

export function AccountPage() {
	const { user, setUser } = useAuthStore();
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [deactivatePassword, setDeactivatePassword] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeactivating, setIsDeactivating] = useState(false);
	const [deactivateError, setDeactivateError] = useState('');
	const [verificationMessage, setVerificationMessage] = useState('');
	const [verificationError, setVerificationError] = useState('');
	const [isSendingVerification, setIsSendingVerification] = useState(false);
	const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'emails'>('profile');
	const [emails, setEmails] = useState<EmailAuditItem[]>([]);
	const [siteUsers, setSiteUsers] = useState<SiteUserAdminItem[]>([]);
	const [emailError, setEmailError] = useState('');
	const [emailMessage, setEmailMessage] = useState('');
	const [pendingEmailAction, setPendingEmailAction] = useState<string | null>(null);
	const [isLoadingEmails, setIsLoadingEmails] = useState(false);
	const [usersError, setUsersError] = useState('');
	const [usersMessage, setUsersMessage] = useState('');
	const [pendingUserAction, setPendingUserAction] = useState<string | null>(null);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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

		if (activeTab === 'users') {
			loadSiteUsers();
		}
	}, [activeTab, user?.isSiteAdmin]);

	async function loadSiteUsers() {
		if (!user?.isSiteAdmin) {
			return;
		}

		setUsersError('');
		setIsLoadingUsers(true);
		try {
			setSiteUsers(await adminService.users());
		} catch (err) {
			setUsersError(err instanceof Error ? err.message : 'Could not load users.');
		} finally {
			setIsLoadingUsers(false);
		}
	}

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

	async function deactivateAccount(event: FormEvent) {
		event.preventDefault();
		setDeactivateError('');
		setIsDeactivating(true);
		try {
			await authService.deactivate(deactivatePassword);
			setUser(null);
		} catch (err) {
			setDeactivateError(err instanceof Error ? err.message : 'Could not deactivate account.');
			setIsDeactivating(false);
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

	async function setSiteAdminStatus(siteUser: SiteUserAdminItem, isSiteAdmin: boolean) {
		setUsersError('');
		setUsersMessage('');
		setPendingUserAction(siteUser.id);
		try {
			await adminService.setSiteAdmin(siteUser.id, isSiteAdmin);
			setUsersMessage(`${siteUser.name} updated.`);
			await loadSiteUsers();
		} catch (err) {
			setUsersError(err instanceof Error ? err.message : 'Could not update user.');
		} finally {
			setPendingUserAction(null);
		}
	}

	return (
		<div className="grid gap-6">
			<PageHeader title="Account" description="Manage your sign-in details." />
			{user?.isSiteAdmin ? (
				<div className="flex flex-wrap gap-2 border-b border-slate-200">
					<button className={activeTab === 'profile' ? 'border-b-2 border-ink px-3 py-2 text-sm font-bold text-ink' : 'px-3 py-2 text-sm font-bold text-slate-500'} onClick={() => setActiveTab('profile')}>Profile</button>
					<button className={activeTab === 'users' ? 'border-b-2 border-ink px-3 py-2 text-sm font-bold text-ink' : 'px-3 py-2 text-sm font-bold text-slate-500'} onClick={() => setActiveTab('users')}>Users</button>
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
				<form className="grid gap-4 border-t border-slate-100 pt-5" onSubmit={deactivateAccount}>
					<div>
						<h2 className="text-lg font-bold text-ink">Danger zone</h2>
						<p className="mt-1 text-sm text-slate-600">Deactivate your account to block future sign-in. Your existing league history is kept for scoring and audit continuity.</p>
					</div>
					<Field label="Current password">
						<TextInput type="password" value={deactivatePassword} onChange={(event) => setDeactivatePassword(event.target.value)} required />
					</Field>
					{deactivateError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{deactivateError}</p> : null}
					<div className="flex justify-end">
						<Button type="submit" variant="secondary" icon={<Trash2 size={16} />} loading={isDeactivating} loadingLabel="Deactivating...">Deactivate account</Button>
					</div>
				</form>
			</section>
			) : null}
			{user?.isSiteAdmin && activeTab === 'users' ? (
				<section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-ink">Users</h2>
							<p className="mt-1 text-sm text-slate-600">Registered accounts and platform admin access.</p>
						</div>
						<div className="flex items-center gap-2">
							<StatusBadge label={`${siteUsers.length} users`} />
							<Button type="button" variant="secondary" loading={isLoadingUsers} loadingLabel="Loading..." onClick={loadSiteUsers}>Refresh</Button>
						</div>
					</div>
					{usersMessage ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{usersMessage}</p> : null}
					{usersError ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{usersError}</p> : null}
					<div className="mt-4 grid gap-3">
						{siteUsers.map((siteUser) => (
							<article key={siteUser.id} className="grid gap-3 rounded-md border border-slate-200 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-semibold text-ink">{siteUser.name}</p>
										<StatusBadge label={siteUser.isEmailVerified ? 'Verified' : 'Unverified'} tone={siteUser.isEmailVerified ? 'good' : 'warning'} />
										{siteUser.isSiteAdmin ? <StatusBadge label="Site admin" tone="good" /> : null}
										{siteUser.isDeleted ? <StatusBadge label="Deactivated" tone="bad" /> : null}
									</div>
									<p className="mt-1 break-all text-sm text-slate-700">{siteUser.emailAddress}</p>
									<p className="mt-1 text-xs text-slate-500">Joined {new Date(siteUser.createdAt).toLocaleString()}</p>
									{siteUser.deletedAt ? <p className="mt-1 text-xs text-red-600">Deactivated {new Date(siteUser.deletedAt).toLocaleString()}</p> : null}
								</div>
								<Button
									type="button"
									variant={siteUser.isSiteAdmin ? 'secondary' : 'primary'}
									loading={pendingUserAction === siteUser.id}
									loadingLabel="Updating..."
									disabled={siteUser.id === user.id && siteUser.isSiteAdmin}
									onClick={() => setSiteAdminStatus(siteUser, !siteUser.isSiteAdmin)}
								>
									{siteUser.isSiteAdmin ? 'Remove admin' : 'Make admin'}
								</Button>
							</article>
						))}
						{siteUsers.length === 0 && !isLoadingUsers ? <p className="text-sm text-slate-600">No users found.</p> : null}
					</div>
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
