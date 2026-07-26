import { FormEvent, ReactNode, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, KeyRound, LogIn, Send, UserPlus } from 'lucide-react';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/FormField';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
	const [emailAddress, setEmailAddress] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { user, setUser } = useAuthStore();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const joinCode = searchParams.get('joinCode')?.trim().toUpperCase() ?? '';
	const authSuffix = joinCode ? `?joinCode=${encodeURIComponent(joinCode)}` : '';
	const signedInTarget = joinCode ? `/join${authSuffix}` : '/leagues';

	if (user) {
		return <Navigate to={signedInTarget} replace />;
	}

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			const nextUser = await authService.login(emailAddress, password);
			setUser(nextUser);
			navigate(signedInTarget);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed.');
			setIsSubmitting(false);
		}
	}

	return (
		<AuthShell title="Welcome back" subtitle="Sign in to manage and play in your leagues.">
			<form className="grid gap-4" onSubmit={onSubmit}>
				<Field label="Email">
					<TextInput type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} required />
				</Field>
				<Field label="Password">
					<TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
				</Field>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<Button icon={<LogIn size={16} />} loading={isSubmitting} loadingLabel="Signing in...">Sign in</Button>
				{joinCode ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">After signing in, you will join with code {joinCode}.</p> : null}
				<Link className="text-sm font-semibold text-ink underline" to="/forgot-password">Forgot password?</Link>
				<p className="text-sm text-slate-600">
					New here? <Link className="font-semibold text-ink underline" to={`/register${authSuffix}`}>Create an account</Link>
				</p>
			</form>
		</AuthShell>
	);
}

export function ForgotPasswordPage() {
	const [emailAddress, setEmailAddress] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setMessage('');
		setIsSubmitting(true);
		try {
			const response = await authService.forgotPassword(emailAddress);
			setMessage(response.message);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not request password reset.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
			<form className="grid gap-4" onSubmit={onSubmit}>
				<Field label="Email">
					<TextInput type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} required />
				</Field>
				{message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<Button icon={<Send size={16} />} loading={isSubmitting} loadingLabel="Sending...">Send reset link</Button>
				<Link className="text-sm font-semibold text-ink underline" to="/login">Back to sign in</Link>
			</form>
		</AuthShell>
	);
}

export function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const token = searchParams.get('token') ?? '';

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setMessage('');
		if (newPassword !== confirmPassword) {
			setError('New passwords do not match.');
			return;
		}

		setIsSubmitting(true);
		try {
			await authService.resetPassword(token, newPassword);
			setNewPassword('');
			setConfirmPassword('');
			setMessage('Password reset. You can sign in with your new password.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not reset password.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<AuthShell title="Choose a new password" subtitle="Use the reset link from your password reset request.">
			<form className="grid gap-4" onSubmit={onSubmit}>
				{!token ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Reset token is missing. Request a new reset link.</p> : null}
				<Field label="New password">
					<TextInput type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
				</Field>
				<Field label="Confirm new password">
					<TextInput type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
				</Field>
				{message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<Button icon={<KeyRound size={16} />} loading={isSubmitting} loadingLabel="Resetting..." disabled={!token}>Reset password</Button>
				<Link className="text-sm font-semibold text-ink underline" to="/login">Back to sign in</Link>
			</form>
		</AuthShell>
	);
}

export function VerifyEmailPage() {
	const [searchParams] = useSearchParams();
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const token = searchParams.get('token') ?? '';
	const { user, setUser } = useAuthStore();

	async function verifyEmail() {
		setError('');
		setMessage('');
		setIsSubmitting(true);
		try {
			await authService.verifyEmail(token);
			setMessage('Email verified. You are good to go.');
			if (user) {
				setUser({ ...user, isEmailVerified: true });
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not verify email.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<AuthShell title="Verify your email" subtitle="Confirm this email address for your account.">
			<div className="grid gap-4">
				{!token ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Verification token is missing. Request a new verification email from your account page.</p> : null}
				{message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<Button icon={<Check size={16} />} loading={isSubmitting} loadingLabel="Verifying..." disabled={!token || Boolean(message)} onClick={verifyEmail}>Verify email</Button>
				<Link className="text-sm font-semibold text-ink underline" to={user ? '/account' : '/login'}>{user ? 'Back to account' : 'Back to sign in'}</Link>
			</div>
		</AuthShell>
	);
}

export function RegisterPage() {
	const [name, setName] = useState('');
	const [emailAddress, setEmailAddress] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { user, setUser } = useAuthStore();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const joinCode = searchParams.get('joinCode')?.trim().toUpperCase() ?? '';
	const authSuffix = joinCode ? `?joinCode=${encodeURIComponent(joinCode)}` : '';
	const signedInTarget = joinCode ? `/join${authSuffix}` : '/leagues';

	if (user) {
		return <Navigate to={signedInTarget} replace />;
	}

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			const nextUser = await authService.register(name, emailAddress, password);
			setUser(nextUser);
			navigate(signedInTarget);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed.');
			setIsSubmitting(false);
		}
	}

	return (
		<AuthShell title="Create your account" subtitle="One account can own, admin, and join different leagues.">
			<form className="grid gap-4" onSubmit={onSubmit}>
				<Field label="Name">
					<TextInput value={name} onChange={(event) => setName(event.target.value)} required />
				</Field>
				<Field label="Email">
					<TextInput type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} required />
				</Field>
				<Field label="Password">
					<TextInput type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
				</Field>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				{joinCode ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">After creating your account, you will join with code {joinCode}.</p> : null}
				<Button icon={<UserPlus size={16} />} loading={isSubmitting} loadingLabel="Creating account...">Create account</Button>
				<p className="text-sm text-slate-600">
					Already registered? <Link className="font-semibold text-ink underline" to={`/login${authSuffix}`}>Sign in</Link>
				</p>
			</form>
		</AuthShell>
	);
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
	return (
		<main className="grid min-h-screen place-items-center bg-slate-50 px-4">
			<section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
				<h1 className="text-2xl font-bold text-ink">{title}</h1>
				<p className="mt-1 text-sm text-slate-600">{subtitle}</p>
				<div className="mt-6">{children}</div>
			</section>
		</main>
	);
}
