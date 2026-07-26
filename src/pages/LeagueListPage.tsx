import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { leagueService } from '../services/leagueService';
import type { LeagueSummary } from '../services/types';

export function LeagueListPage() {
	const [leagues, setLeagues] = useState<LeagueSummary[]>([]);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		leagueService.list()
			.then((items) => setLeagues(items ?? []))
			.catch((err) => setError(err.message))
			.finally(() => setIsLoading(false));
	}, []);

	return (
		<div className="grid gap-6">
			<PageHeader
				title="My Leagues"
				description="Create a league, share the code, then run challenges and approvals from one workspace."
				actions={
					<>
						<Link to="/join"><Button variant="secondary" icon={<Search size={16} />}>Join</Button></Link>
						<Link to="/leagues/create"><Button icon={<Plus size={16} />}>Create</Button></Link>
					</>
				}
			/>
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			<div className="grid gap-3">
				{isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading your leagues...</div> : null}
				{leagues.map((league) => (
					<Link key={league.id} to={`/leagues/${league.id}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-ink/40">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h2 className="text-lg font-bold text-ink">{league.name}</h2>
							<div className="flex gap-2">
								<StatusBadge label={league.role} tone={league.role === 'Owner' ? 'good' : 'neutral'} />
								<StatusBadge label={league.membershipStatus} tone={league.membershipStatus === 'Pending' ? 'warning' : 'neutral'} />
							</div>
						</div>
						<p className="text-sm text-slate-600">{league.description || 'No description yet.'}</p>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Join code {league.joinCode}</p>
					</Link>
				))}
				{leagues.length === 0 && !error && !isLoading ? (
					<div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
						<h2 className="text-lg font-bold text-ink">Start your first league</h2>
						<p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Create a league for your group, or join one with a code someone has shared with you.</p>
						<div className="mt-5 flex flex-wrap justify-center gap-2">
							<Link to="/leagues/create"><Button icon={<Plus size={16} />}>Create league</Button></Link>
							<Link to="/join"><Button variant="secondary" icon={<Search size={16} />}>Join with code</Button></Link>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
