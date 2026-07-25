import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogIn, Trophy, UserPlus } from 'lucide-react';
import { Button } from '../components/Button';
import { CopyJoinCodeBadge } from '../components/CopyJoinCodeBadge';
import { leagueService } from '../services/leagueService';
import type { PublicLeagueView } from '../services/types';

export function PublicLeagueViewPage() {
	const { joinCode = '' } = useParams();
	const navigate = useNavigate();
	const joinQuery = joinCode ? `?joinCode=${encodeURIComponent(joinCode)}` : '';
	const [view, setView] = useState<PublicLeagueView | null>(null);
	const [codeEntry, setCodeEntry] = useState('');
	const [error, setError] = useState('');
	const leaderboard = view?.leaderboard ?? [];
	const pointsFeed = view?.pointsFeed ?? [];
	const challenges = view?.challenges ?? [];

	useEffect(() => {
		if (!joinCode) {
			return;
		}

		leagueService.publicView(joinCode).then(setView).catch((err) => setError(err.message));
	}, [joinCode]);

	function submitCode(event: FormEvent) {
		event.preventDefault();
		if (codeEntry.trim()) {
			navigate(`/view/${codeEntry.trim().toUpperCase()}`);
		}
	}

	if (!joinCode) {
		return (
			<main className="grid min-h-screen place-items-center bg-slate-50 px-4">
				<form className="grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submitCode}>
					<div>
						<h1 className="text-2xl font-bold text-ink">View a league</h1>
						<p className="mt-1 text-sm text-slate-600">Enter a join code to view the league without signing in.</p>
					</div>
					<input
						className="min-h-10 w-full rounded-md border border-slate-300 px-3 text-sm uppercase outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
						value={codeEntry}
						onChange={(event) => setCodeEntry(event.target.value)}
						placeholder="Join code"
						required
					/>
					<Button>View league</Button>
					<Link className="text-center text-sm font-semibold text-ink underline" to="/login">Sign in instead</Link>
				</form>
			</main>
		);
	}

	if (error) {
		return (
			<main className="grid min-h-screen place-items-center bg-slate-50 px-4">
				<div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
					<h1 className="text-xl font-bold text-ink">League not found</h1>
					<p className="mt-2 text-sm text-slate-600">{error}</p>
					<Link to="/login" className="mt-4 inline-block"><Button>Sign in</Button></Link>
				</div>
			</main>
		);
	}

	if (!view) {
		return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">Loading league...</main>;
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<header className="border-b border-slate-200 bg-white">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
					<div className="inline-flex items-center gap-2 font-bold text-ink"><Trophy size={22} /> The League</div>
					<div className="flex flex-wrap items-center gap-2">
						<Link to={`/login${joinQuery}`}><Button variant="secondary" icon={<LogIn size={16} />}>Sign in</Button></Link>
						<Link to={`/register${joinQuery}`}><Button icon={<UserPlus size={16} />}>Join this league</Button></Link>
					</div>
				</div>
			</header>
			<main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
				<div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
					<div>
						<h1 className="text-3xl font-bold text-ink">{view.league.name}</h1>
						{view.league.description ? <p className="mt-1 text-sm text-slate-600">{view.league.description}</p> : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<CopyJoinCodeBadge joinCode={view.league.joinCode} label="View only" />
						<Link to={`/register${joinQuery}`}><Button icon={<UserPlus size={16} />}>Join this league</Button></Link>
					</div>
				</div>
				<section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="bg-slate-50 text-xs uppercase text-slate-500">
							<tr><th className="p-3">Position</th><th className="p-3">Participant</th><th className="p-3 text-right">Points</th></tr>
						</thead>
						<tbody>
							{leaderboard.map((row) => (
								<tr key={row.leagueMemberId} className="border-t border-slate-100">
									<td className="p-3 font-bold">{row.position}</td>
									<td className="p-3">{row.displayName}</td>
									<td className="p-3 text-right font-bold">{row.approvedPoints}</td>
								</tr>
							))}
						</tbody>
					</table>
					{leaderboard.length === 0 ? <div className="border-t border-slate-100 p-8 text-center text-sm text-slate-600">No approved points yet.</div> : null}
				</section>
				<section className="grid gap-3">
					<h2 className="text-lg font-bold text-ink">Points Feed</h2>
					{pointsFeed.map((item) => (
						<article key={item.allocationId} className="rounded-lg border border-slate-200 bg-white p-4">
							<p className="font-bold text-ink">{item.displayName} {item.points >= 0 ? 'earned' : 'lost'} {Math.abs(item.points)} points</p>
							<p className="text-sm text-slate-600">{item.reason}</p>
						</article>
					))}
					{pointsFeed.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No points yet.</div> : null}
				</section>
				<section className="grid gap-3">
					<h2 className="text-lg font-bold text-ink">Challenges</h2>
					{challenges.map((challenge) => (
						<article key={challenge.id} className="rounded-lg border border-slate-200 bg-white p-4">
							<h3 className="font-bold text-ink">{challenge.name}</h3>
							<p className="mt-1 text-sm text-slate-600">{challenge.description || 'No description.'}</p>
							<div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
								<span className="rounded bg-slate-100 px-2 py-1">Aimed at {(challenge.targetNames ?? []).join(', ') || 'No targets'}</span>
								<span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">+{challenge.pointsForSuccess}</span>
								<span className="rounded bg-red-100 px-2 py-1 text-red-800">{challenge.pointsForFailure}</span>
							</div>
						</article>
					))}
					{challenges.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No challenges yet.</div> : null}
				</section>
			</main>
		</div>
	);
}
