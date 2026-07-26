import { FormEvent, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { Field, SelectInput, TextInput } from '../../../../components/FormField';
import { leagueService } from '../../../../services/leagueService';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { formatGameType, matchFormatLabel } from './helpers';
import { Avatar } from './Shared';
import { LiveDartsScorer } from './LiveDartsScorer';

export function TournamentMatchView({ leagueId, tournament, match, canManage, memberNames, onBack, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; memberNames: Map<string, string>; onBack: () => void; onChanged: () => Promise<void> }) {
	const playerOne = memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD';
	const playerTwo = memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD';
	const isLiveDartsMatch = tournament.gameType === 'Darts301' || tournament.gameType === 'Darts501';

	return (
		<section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink" onClick={onBack}>
					<ArrowLeft size={16} /> Back to tournament
				</button>
				<Button type="button" variant="ghost" className="px-2" icon={<X size={16} />} onClick={onBack} aria-label="Close match" />
			</div>
			<div className="mt-6 grid gap-5 text-center">
				{isLiveDartsMatch ? (
					<LiveDartsScorer
						leagueId={leagueId}
						tournament={tournament}
						match={match}
						canManage={canManage}
						playerOne={playerOne}
						playerTwo={playerTwo}
						onChanged={onChanged}
					/>
				) : (
					<>
						<MatchScoreHeader tournament={tournament} match={match} playerOne={playerOne} playerTwo={playerTwo} />
						<SimpleMatchScoreForm
							leagueId={leagueId}
							tournament={tournament}
							match={match}
							canManage={canManage}
							playerOne={playerOne}
							playerTwo={playerTwo}
							onChanged={onChanged}
						/>
					</>
				)}
			</div>
		</section>
	);
}

function MatchScoreHeader({ tournament, match, playerOne, playerTwo }: { tournament: Tournament; match: TournamentMatch; playerOne: string; playerTwo: string }) {
	return (
		<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
			<div><Avatar name={playerOne} large /><p className="mt-2 font-bold text-ink">{playerOne}</p></div>
			<div>
				<p className="text-3xl font-bold text-ink">{match.playerOneScore ?? 0} - {match.playerTwoScore ?? 0}</p>
				<p className="mt-1 text-sm font-semibold text-slate-500">{matchFormatLabel(tournament)}</p>
			</div>
			<div><Avatar name={playerTwo} large tone="green" /><p className="mt-2 font-bold text-ink">{playerTwo}</p></div>
		</div>
	);
}

function SimpleMatchScoreForm({ leagueId, tournament, match, canManage, playerOne, playerTwo, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; playerOne: string; playerTwo: string; onChanged: () => Promise<void> }) {
	const [winnerMemberId, setWinnerMemberId] = useState(match.winnerMemberId ?? match.playerOneMemberId ?? '');
	const [playerOneScore, setPlayerOneScore] = useState(match.playerOneScore?.toString() ?? '');
	const [playerTwoScore, setPlayerTwoScore] = useState(match.playerTwoScore?.toString() ?? '');
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!winnerMemberId || !canManage || match.status === 'Completed') {
			return;
		}

		setIsSaving(true);
		setError('');
		try {
			await leagueService.completeTournamentMatch(leagueId, tournament.id, match.id, {
				winnerMemberId,
				playerOneScore: playerOneScore ? Number(playerOneScore) : null,
				playerTwoScore: playerTwoScore ? Number(playerTwoScore) : null
			});
			await onChanged();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not save match.');
			setIsSaving(false);
		}
	}

	return (
		<div className="grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
			<div className="rounded-lg border border-slate-200 p-4 text-left">
				<h3 className="font-bold text-ink">Match info</h3>
				<div className="mt-3 grid gap-2 text-sm text-slate-600">
					<p>Round {match.roundNumber}</p>
					<p>{formatGameType(tournament)}</p>
					<p>{matchFormatLabel(tournament)}</p>
				</div>
			</div>
			<form className="grid gap-3 rounded-lg border border-slate-200 p-4 text-left" onSubmit={submit}>
				<h3 className="font-bold text-ink">Enter / update score</h3>
				<Field label="Winner">
					<SelectInput value={winnerMemberId} onChange={(event) => setWinnerMemberId(event.target.value)} disabled={!canManage || match.status === 'Completed'}>
						{match.playerOneMemberId ? <option value={match.playerOneMemberId}>{playerOne}</option> : null}
						{match.playerTwoMemberId ? <option value={match.playerTwoMemberId}>{playerTwo}</option> : null}
					</SelectInput>
				</Field>
				<div className="grid gap-3 sm:grid-cols-2">
					<Field label={playerOne}>
						<TextInput type="number" value={playerOneScore} onChange={(event) => setPlayerOneScore(event.target.value)} disabled={!canManage || match.status === 'Completed'} />
					</Field>
					<Field label={playerTwo}>
						<TextInput type="number" value={playerTwoScore} onChange={(event) => setPlayerTwoScore(event.target.value)} disabled={!canManage || match.status === 'Completed'} />
					</Field>
				</div>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<Button type="submit" loading={isSaving} loadingLabel="Saving..." disabled={!canManage || match.status === 'Completed'}>Save match</Button>
			</form>
		</div>
	);
}
