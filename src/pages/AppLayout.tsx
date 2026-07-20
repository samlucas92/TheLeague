import { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function AppLayout() {
	const { user, isLoading, loadMe, setUser } = useAuthStore();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		loadMe();
	}, [loadMe]);

	async function signout() {
		await authService.signout();
		setUser(null);
		navigate('/login');
	}

	if (isLoading) {
		return <main className="grid min-h-screen place-items-center text-sm text-slate-600">Loading...</main>;
	}

	if (!user) {
		return <Navigate to={`/login${location.search}`} replace />;
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<header className="border-b border-slate-200 bg-white">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
					<Link to="/leagues" className="inline-flex items-center gap-2 font-bold text-ink"><Trophy size={22} /> The League</Link>
					<div className="flex items-center gap-3">
						<span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
						<Button variant="secondary" onClick={signout}>Sign out</Button>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-6">
				<Outlet />
			</main>
		</div>
	);
}
