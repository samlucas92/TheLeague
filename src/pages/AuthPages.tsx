import { FormEvent, ReactNode, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/FormField';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
	const [emailAddress, setEmailAddress] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
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
		try {
			const nextUser = await authService.login(emailAddress, password);
			setUser(nextUser);
			navigate(signedInTarget);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed.');
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
				<Button icon={<LogIn size={16} />}>Sign in</Button>
				{joinCode ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">After signing in, you will join with code {joinCode}.</p> : null}
				<p className="text-sm text-slate-600">
					New here? <Link className="font-semibold text-ink underline" to={`/register${authSuffix}`}>Create an account</Link>
				</p>
			</form>
		</AuthShell>
	);
}

export function RegisterPage() {
	const [name, setName] = useState('');
	const [emailAddress, setEmailAddress] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
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
		try {
			const nextUser = await authService.register(name, emailAddress, password);
			setUser(nextUser);
			navigate(signedInTarget);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed.');
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
				<Button icon={<UserPlus size={16} />}>Create account</Button>
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
