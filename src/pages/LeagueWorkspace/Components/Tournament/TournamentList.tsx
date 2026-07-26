import { Target, Trophy } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { SelectInput } from '../../../../components/FormField';
import type { Tournament } from '../../../../services/types';
import { EmptyState } from '../Shared';
import { tournamentFilters, type TournamentFilter } from './helpers';
import { TournamentListCard } from './TournamentListCard';

export function TournamentList({
	tournaments,
	filter,
	gameFilter,
	isLoading,
	error,
	canManage,
	memberNames,
	onFilterChange,
	onGameFilterChange,
	onCreate,
	onView,
	onDelete
}: {
	tournaments: Tournament[];
	filter: TournamentFilter;
	gameFilter: string;
	isLoading: boolean;
	error: string;
	canManage: boolean;
	memberNames: Map<string, string>;
	onFilterChange: (filter: TournamentFilter) => void;
	onGameFilterChange: (filter: string) => void;
	onCreate: () => void;
	onView: (tournament: Tournament) => void;
	onDelete: (tournament: Tournament) => Promise<void>;
}) {
	return (
		<section className="grid gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold text-ink">Tournaments</h2>
					<p className="text-sm text-slate-600">Run pool knockouts and highest-score darts eliminations from your league members.</p>
				</div>
				<Button type="button" icon={<Trophy size={16} />} onClick={onCreate}>Create tournament</Button>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-1 rounded-md bg-slate-50 p-1">
					{tournamentFilters.map((item) => (
						<button
							key={item}
							type="button"
							className={`min-h-9 rounded px-3 text-sm font-semibold ${filter === item ? 'bg-white text-ink shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-ink'}`}
							onClick={() => onFilterChange(item)}
						>
							{item}
						</button>
					))}
				</div>
				<SelectInput className="max-w-44" value={gameFilter} onChange={(event) => onGameFilterChange(event.target.value)}>
					<option>All games</option>
					<option>Pool</option>
					<option>Darts</option>
				</SelectInput>
			</div>
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			{isLoading ? <p className="text-sm text-slate-600">Loading tournaments...</p> : null}
			{!isLoading && tournaments.length === 0 ? (
				<EmptyState
					title="No tournaments here."
					description="Create a pool knockout or darts highest-score game when the group is ready to play."
					actions={<Button type="button" icon={<Target size={16} />} onClick={onCreate}>Create tournament</Button>}
				/>
			) : null}
			<div className="grid gap-3">
				{tournaments.map((tournament) => (
					<TournamentListCard key={tournament.id} tournament={tournament} canManage={canManage} memberNames={memberNames} onView={() => onView(tournament)} onDelete={() => onDelete(tournament)} />
				))}
			</div>
			{!isLoading && tournaments.length > 0 ? <p className="text-xs text-slate-500">Showing 1 to {tournaments.length} of {tournaments.length} tournaments</p> : null}
		</section>
	);
}

