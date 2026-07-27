import { Calendar, ChevronRight, MoreVertical, Target, Trash2, Trophy, Users } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { Tournament } from '../../../../services/types';
import { formatDate, formatGameType, gameRulesSummary, getNextMatch, getStatusTone, matchFormatLabel } from './helpers';
import { GameArtwork, Meta } from './Shared';
import { NextMatchMini } from './TournamentSidebar';

export function TournamentListCard({ tournament, canManage, memberNames, onView, onDelete }: { tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onView: () => void; onDelete: () => Promise<void> }) {
	const nextMatch = getNextMatch(tournament);
	const winner = tournament.winnerName ?? (tournament.winnerMemberId ? memberNames.get(tournament.winnerMemberId) : null);
	const pubGolfProgress = getPubGolfProgress(tournament);

	return (
		<article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[6rem_minmax(0,1fr)] lg:grid-cols-[8rem_minmax(0,1fr)_15rem]">
			<div className="max-w-28 sm:max-w-none">
				<GameArtwork gameType={tournament.gameType} />
			</div>
			<div className="min-w-0">
				<StatusBadge label={tournament.status} tone={getStatusTone(tournament.status)} />
				<h3 className="mt-2 text-xl font-bold text-ink">{tournament.name}</h3>
				<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
					<Meta icon={<Target size={15} />} label={formatGameType(tournament)} />
					<Meta icon={<Trophy size={15} />} label={tournament.format === 'SingleEliminationBracket' ? matchFormatLabel(tournament) : gameRulesSummary(tournament).at(-1) ?? 'Round elimination'} />
					<Meta icon={<Users size={15} />} label={`${tournament.participantCount} players`} />
					<Meta icon={<Calendar size={15} />} label={tournament.completedAt ? `Completed ${formatDate(tournament.completedAt)}` : `Started ${formatDate(tournament.createdAt)}`} />
				</div>
			</div>
			<div className="flex flex-col items-start justify-between gap-3 sm:col-span-2 lg:col-span-1 lg:items-end">
				<div className="flex w-full justify-end gap-2">
					{canManage ? <Button type="button" variant="ghost" className="px-2" icon={<Trash2 size={16} />} onClick={onDelete} aria-label="Delete tournament" /> : null}
					<Button type="button" variant="ghost" className="px-2" icon={<MoreVertical size={16} />} aria-label="Tournament actions" />
				</div>
				{winner ? (
					<div className="text-left lg:text-right">
						<p className="text-xs font-semibold text-slate-500">Winner</p>
						<p className="font-bold text-ink">{winner}</p>
					</div>
				) : tournament.gameType === 'PubGolf' && pubGolfProgress ? (
					<div className="text-left lg:text-right">
						<p className="text-xs font-semibold text-slate-500">Current hole</p>
						<p className="font-bold text-ink">{pubGolfProgress.currentHole.holeNumber} - {pubGolfProgress.currentHole.venue}</p>
						<p className="text-sm text-slate-600">Par {pubGolfProgress.currentHole.par}</p>
						<p className="mt-1 text-xs font-semibold text-slate-500">{pubGolfProgress.completed} / {pubGolfProgress.total} holes completed</p>
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

function getPubGolfProgress(tournament: Tournament) {
	if (tournament.gameType !== 'PubGolf' || tournament.pubGolfHoles.length === 0) {
		return null;
	}

	const completed = tournament.pubGolfHoles.filter((hole) =>
		tournament.participants.length > 0 &&
		tournament.participants.every((participant) =>
			tournament.pubGolfScores.some((score) => score.holeId === hole.id && score.leagueMemberId === participant.leagueMemberId && score.score != null)
		)
	).length;
	return {
		completed,
		total: tournament.pubGolfHoles.length,
		currentHole: tournament.pubGolfHoles[Math.min(completed, tournament.pubGolfHoles.length - 1)]
	};
}
