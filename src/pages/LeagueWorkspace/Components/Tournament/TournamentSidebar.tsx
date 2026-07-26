import type { ReactNode } from 'react';
import { Clock, Trophy } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { Tournament, TournamentMatch, TournamentParticipant } from '../../../../services/types';
import { matchFormatLabel } from './helpers';
import { Avatar, Meta } from './Shared';

export function SideCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">{title}</h3>
			<div className="mt-3">{children}</div>
		</div>
	);
}

export function NextMatchMini({ match, memberNames }: { match: TournamentMatch; memberNames: Map<string, string> }) {
	return (
		<div className="text-left lg:text-right">
			<p className="text-xs font-semibold text-slate-500">Next match</p>
			<div className="mt-2 flex items-center gap-2 lg:justify-end">
				<Avatar name={memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD'} />
				<span className="text-xs font-bold text-slate-500">vs</span>
				<Avatar name={memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD'} tone="green" />
			</div>
		</div>
	);
}

export function NextMatchLarge({ match, memberNames, tournament, onView }: { match: TournamentMatch; memberNames: Map<string, string>; tournament?: Tournament; onView?: () => void }) {
	const playerOne = memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD';
	const playerTwo = memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD';
	return (
		<div className="grid gap-4 text-center">
			<div className="flex items-center justify-center gap-4">
				<div><Avatar name={playerOne} large /><p className="mt-1 text-xs font-semibold text-ink">{playerOne}</p></div>
				<span className="text-sm font-bold text-slate-500">vs</span>
				<div><Avatar name={playerTwo} large tone="green" /><p className="mt-1 text-xs font-semibold text-ink">{playerTwo}</p></div>
			</div>
			<div className="grid gap-2 text-left text-sm text-slate-600">
				<Meta icon={<Clock size={15} />} label="Today, 18:30" />
				<Meta icon={<Trophy size={15} />} label={tournament ? matchFormatLabel(tournament) : 'Best of 7'} />
			</div>
			<Button type="button" variant="secondary" onClick={onView}>View match</Button>
		</div>
	);
}

export function ProgressSummary({ tournament }: { tournament: Tournament }) {
	const totalMatches = tournament.matches.length || tournament.rounds.length || 1;
	const completed = tournament.matches.filter((match) => match.status === 'Completed').length || tournament.rounds.filter((round) => round.isComplete).length;
	const percent = Math.round((completed / totalMatches) * 100);
	return (
		<div className="grid gap-3 text-sm text-slate-600">
			<div className="flex justify-between font-semibold"><span>{tournament.status}</span><span>{percent}%</span></div>
			<div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div>
			<p>{completed} / {totalMatches} stages complete</p>
		</div>
	);
}

export function PlayerList({ participants }: { participants: TournamentParticipant[] }) {
	return (
		<div className="grid gap-2">
			{participants.slice(0, 6).map((participant) => (
				<div key={participant.leagueMemberId} className="flex items-center justify-between gap-2 text-sm">
					<span className="inline-flex items-center gap-2"><Avatar name={participant.displayName} /> {participant.displayName}</span>
					<StatusBadge label={participant.isEliminated ? 'Eliminated' : 'Active'} tone={participant.isEliminated ? 'neutral' : 'good'} />
				</div>
			))}
			{participants.length > 6 ? <p className="text-xs text-slate-500">+ {participants.length - 6} more players</p> : null}
		</div>
	);
}
