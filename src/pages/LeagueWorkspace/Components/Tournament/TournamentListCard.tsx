import { Calendar, ChevronRight, MoreVertical, Target, Trash2, Trophy, Users } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { Tournament } from '../../../../services/types';
import { formatDate, formatGameType, getNextMatch, getStatusTone } from './helpers';
import { GameArtwork, Meta } from './Shared';
import { NextMatchMini } from './TournamentSidebar';

export function TournamentListCard({ tournament, canManage, memberNames, onView, onDelete }: { tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onView: () => void; onDelete: () => Promise<void> }) {
	const nextMatch = getNextMatch(tournament);
	const winner = tournament.winnerName ?? (tournament.winnerMemberId ? memberNames.get(tournament.winnerMemberId) : null);

	return (
		<article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[8rem_minmax(0,1fr)_15rem]">
			<GameArtwork gameType={tournament.gameType} />
			<div className="min-w-0">
				<StatusBadge label={tournament.status} tone={getStatusTone(tournament.status)} />
				<h3 className="mt-2 text-xl font-bold text-ink">{tournament.name}</h3>
				<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
					<Meta icon={<Target size={15} />} label={formatGameType(tournament)} />
					<Meta icon={<Trophy size={15} />} label={tournament.format === 'SingleEliminationBracket' ? 'Knockout bracket' : `Eliminate ${tournament.eliminatePerRound} each round`} />
					<Meta icon={<Users size={15} />} label={`${tournament.participantCount} players`} />
					<Meta icon={<Calendar size={15} />} label={tournament.completedAt ? `Completed ${formatDate(tournament.completedAt)}` : `Started ${formatDate(tournament.createdAt)}`} />
				</div>
			</div>
			<div className="flex flex-col items-start justify-between gap-3 lg:items-end">
				<div className="flex w-full justify-end gap-2">
					{canManage ? <Button type="button" variant="ghost" className="px-2" icon={<Trash2 size={16} />} onClick={onDelete} aria-label="Delete tournament" /> : null}
					<Button type="button" variant="ghost" className="px-2" icon={<MoreVertical size={16} />} aria-label="Tournament actions" />
				</div>
				{winner ? (
					<div className="text-left lg:text-right">
						<p className="text-xs font-semibold text-slate-500">Winner</p>
						<p className="font-bold text-ink">{winner}</p>
					</div>
				) : nextMatch ? (
					<NextMatchMini match={nextMatch} memberNames={memberNames} />
				) : (
					<div className="text-left lg:text-right">
						<p className="text-xs font-semibold text-slate-500">Next up</p>
						<p className="font-bold text-ink">{tournament.status}</p>
					</div>
				)}
				<Button type="button" variant="secondary" className="w-full justify-center lg:max-w-48" icon={<ChevronRight size={16} />} onClick={onView}>
					{winner ? 'View results' : 'View tournament'}
				</Button>
			</div>
		</article>
	);
}
