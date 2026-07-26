import { FormEvent, useMemo, useState } from 'react';
import { Button } from '../../../../components/Button';
import { SelectInput, TextInput } from '../../../../components/FormField';
import { leagueService } from '../../../../services/leagueService';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { groupMatchesByRound, roundTitle } from './helpers';
import { PlayerScoreRow } from './Shared';

export function BracketPanel({ leagueId, tournament, canManage, memberNames, onChanged }: { leagueId: string; tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void> }) {
	const rounds = useMemo(() => groupMatchesByRound(tournament.matches), [tournament.matches]);
	return (
		<div className="overflow-x-auto rounded-lg border border-slate-200 p-4">
			<div className="grid min-w-[720px] gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(rounds.length, 1)}, minmax(10rem, 1fr))` }}>
				{rounds.map(([roundNumber, matches]) => (
					<div key={roundNumber} className="grid content-start gap-3">
						<div>
							<h3 className="text-sm font-bold text-ink">{roundTitle(roundNumber, rounds.length)}</h3>
							<p className="text-xs text-slate-500">Best of 7</p>
						</div>
						{matches.map((match) => (
							<BracketMatch key={match.id} leagueId={leagueId} tournament={tournament} match={match} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
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

function BracketMatch({ leagueId, tournament, match, canManage, memberNames, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void> }) {
	const [winnerMemberId, setWinnerMemberId] = useState(match.playerOneMemberId ?? '');
	const [playerOneScore, setPlayerOneScore] = useState(match.playerOneScore?.toString() ?? '');
	const [playerTwoScore, setPlayerTwoScore] = useState(match.playerTwoScore?.toString() ?? '');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const players = [match.playerOneMemberId, match.playerTwoMemberId].filter(Boolean) as string[];

	async function submit(event: FormEvent) {
		event.preventDefault();
		setIsSubmitting(true);
		await leagueService.completeTournamentMatch(leagueId, tournament.id, match.id, {
			winnerMemberId,
			playerOneScore: playerOneScore ? Number(playerOneScore) : null,
			playerTwoScore: playerTwoScore ? Number(playerTwoScore) : null
		});
		await onChanged();
		setIsSubmitting(false);
	}

	return (
		<div className="rounded-md border border-slate-200 bg-white text-sm shadow-sm">
			<PlayerScoreRow name={memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD'} score={match.playerOneScore} won={match.winnerMemberId === match.playerOneMemberId} />
			<PlayerScoreRow name={memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD'} score={match.playerTwoScore} won={match.winnerMemberId === match.playerTwoMemberId} muted={!match.playerTwoMemberId} />
			{canManage && match.status !== 'Completed' && players.length > 1 ? (
				<form className="grid gap-2 border-t border-slate-100 p-2" onSubmit={submit}>
					<SelectInput value={winnerMemberId} onChange={(event) => setWinnerMemberId(event.target.value)}>
						{players.map((playerId) => <option key={playerId} value={playerId}>{memberNames.get(playerId)}</option>)}
					</SelectInput>
					<div className="grid grid-cols-[1fr_1fr_auto] gap-2">
						<TextInput type="number" value={playerOneScore} onChange={(event) => setPlayerOneScore(event.target.value)} placeholder="P1" />
						<TextInput type="number" value={playerTwoScore} onChange={(event) => setPlayerTwoScore(event.target.value)} placeholder="P2" />
						<Button type="submit" loading={isSubmitting} loadingLabel="Saving...">Save</Button>
					</div>
				</form>
			) : null}
		</div>
	);
}
