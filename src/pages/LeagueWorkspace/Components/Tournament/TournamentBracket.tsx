import { useMemo } from 'react';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { bracketMatches, groupMatchesByRound, matchFormatLabel, roundTitle } from './helpers';

export function BracketPanel({ tournament, memberNames, onViewMatch }: { leagueId: string; tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void>; onViewMatch?: (match: TournamentMatch) => void }) {
	const rounds = useMemo(() => groupMatchesByRound(bracketMatches(tournament)), [tournament]);
	return (
		<div className="overflow-x-auto rounded-lg border border-slate-200 p-4">
			<div className="grid min-w-[760px] gap-8" style={{ gridTemplateColumns: `repeat(${Math.max(rounds.length, 1)}, minmax(12rem, 1fr))` }}>
				{rounds.map(([roundNumber, matches]) => (
					<div key={roundNumber} className="grid content-start gap-3">
						<div>
							<h3 className="text-sm font-bold text-ink">{roundTitle(roundNumber, rounds.length)}</h3>
							<p className="text-xs text-slate-500">{matches[0] ? matchFormatLabel(tournament, matches[0]) : matchFormatLabel(tournament)}</p>
						</div>
						{matches.map((match) => (
							<BracketMatch key={match.id} tournament={tournament} match={match} memberNames={memberNames} onViewMatch={onViewMatch} />
						))}
					</div>
				))}
			</div>
			<div className="mt-4 flex gap-4 text-xs font-semibold text-slate-500">
				<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Won</span>
				<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Scheduled</span>
				<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-100 ring-1 ring-slate-200" /> TBD</span>
			</div>
		</div>
	);
}

function BracketMatch({ tournament, match, memberNames, onViewMatch }: { tournament: Tournament; match: TournamentMatch; memberNames: Map<string, string>; onViewMatch?: (match: TournamentMatch) => void }) {
	const canOpen = Boolean(onViewMatch && match.playerOneMemberId && match.playerTwoMemberId);
	return (
		<button
			type="button"
			disabled={!canOpen}
			className={`relative grid gap-2 rounded-md border border-slate-200 bg-white p-2 text-left text-sm shadow-sm after:absolute after:left-full after:top-1/2 after:hidden after:h-px after:w-8 after:bg-slate-200 last:after:hidden md:after:block ${canOpen ? 'hover:border-ink/30' : 'cursor-default'}`}
			onClick={() => canOpen && onViewMatch?.(match)}
		>
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs font-semibold text-slate-500">{match.groupName ?? matchFormatLabel(tournament, match)}</span>
				<StatusBadge label={match.status} tone={match.status === 'Completed' ? 'good' : 'neutral'} />
			</div>
			<BracketPlayer name={memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD'} score={match.playerOneScore} won={match.winnerMemberId === match.playerOneMemberId} />
			<BracketPlayer name={memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD'} score={match.playerTwoScore} won={match.winnerMemberId === match.playerTwoMemberId} muted={!match.playerTwoMemberId} />
		</button>
	);
}

function BracketPlayer({ name, score, won, muted = false }: { name: string; score?: number | null; won: boolean; muted?: boolean }) {
	return (
		<div className={`flex items-center justify-between gap-2 rounded px-2 py-1 ${won ? 'bg-emerald-50 font-bold text-emerald-900' : muted ? 'text-slate-400' : 'text-slate-700'}`}>
			<span>{name}</span>
			<span className="font-bold">{score ?? '-'}</span>
		</div>
	);
}
