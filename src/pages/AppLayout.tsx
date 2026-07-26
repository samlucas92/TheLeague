import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, UserCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function AppLayout() {
	const { user, setUser } = useAuthStore();
	const navigate = useNavigate();
	const location = useLocation();

	async function signout() {
		await authService.signout();
		setUser(null);
		navigate('/login');
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
						<Link to="/account" className="hidden text-sm font-semibold text-slate-600 hover:text-ink sm:inline">{user.name}</Link>
						<Link to="/account" className="sm:hidden" aria-label="Account"><Button type="button" variant="ghost" className="px-2"><UserCircle size={20} /></Button></Link>
						<Button variant="secondary" onClick={signout}>Sign out</Button>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-6xl px-4 py-6">
				<Outlet />
			</main>
			<footer className="mx-auto flex max-w-6xl justify-end gap-4 px-4 pb-6 text-sm">
				<Link className="font-semibold text-slate-500 hover:text-ink" to="/terms">Terms and Conditions</Link>
				<Link className="font-semibold text-slate-500 hover:text-ink" to="/privacy">Privacy</Link>
			</footer>
		</div>
	);
}
