import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Trash2, Trophy } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, SelectInput, TextInput } from '../../../components/FormField';
import { StatusBadge } from '../../../components/StatusBadge';
import { leagueService } from '../../../services/leagueService';
import type { Tournament, TournamentMatch } from '../../../services/types';
import { useWorkspace } from '../context';
import { EmptyState } from '../Components';

export function TournamentsPage() {
	const { league, members, currentMember, dataVersion, openCreateTournamentModal } = useWorkspace();
	const [tournaments, setTournaments] = useState<Tournament[]>([]);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const canManage = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';

	async function refresh() {
		setIsLoading(true);
		try {
			setTournaments(await leagueService.tournaments(league.id) ?? []);
			setError('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not load tournaments.');
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		refresh();
	}, [league.id, dataVersion]);

	async function deleteTournament(tournament: Tournament) {
		await leagueService.deleteTournament(league.id, tournament.id);
		await refresh();
	}

	return (
		<section className="grid gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold text-ink">Tournaments</h2>
					<p className="text-sm text-slate-600">Run pool knockouts and highest-score darts eliminations from your league members.</p>
				</div>
				<Button type="button" icon={<Trophy size={16} />} onClick={openCreateTournamentModal}>Create tournament</Button>
			</div>
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			{isLoading ? <p className="text-sm text-slate-600">Loading tournaments...</p> : null}
			{!isLoading && tournaments.length === 0 ? (
				<EmptyState
					title="No tournaments yet."
					description="Create a pool knockout or darts highest-score game when the group is ready to play."
					actions={<Button type="button" icon={<Trophy size={16} />} onClick={openCreateTournamentModal}>Create tournament</Button>}
				/>
			) : null}
			<div className="grid gap-4">
				{tournaments.map((tournament) => (
					<TournamentCard
						key={tournament.id}
						tournament={tournament}
						canManage={canManage}
						memberNames={new Map(members.map((member) => [member.id, member.displayName]))}
						onChanged={refresh}
						onDelete={() => deleteTournament(tournament)}
					/>
				))}
			</div>
		</section>
	);
}

function TournamentCard({
	tournament,
	canManage,
	memberNames,
	onChanged,
	onDelete
}: {
	tournament: Tournament;
	canManage: boolean;
	memberNames: Map<string, string>;
	onChanged: () => Promise<void>;
	onDelete: () => Promise<void>;
}) {
	const { league } = useWorkspace();
	const activeRound = tournament.rounds.find((round) => !round.isComplete);

	return (
		<article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-bold text-ink">{tournament.name}</h3>
					<p className="text-sm text-slate-600">{formatGameType(tournament.gameType)} · {tournament.participantCount} players</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<StatusBadge label={tournament.status} tone={tournament.status === 'Completed' ? 'good' : 'neutral'} />
					{tournament.winnerName ? <StatusBadge label={`Winner: ${tournament.winnerName}`} tone="good" /> : null}
					{canManage ? <Button type="button" variant="ghost" icon={<Trash2 size={16} />} onClick={onDelete}>Delete</Button> : null}
				</div>
			</div>
			<div className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:grid-cols-3">
				<p><span className="font-semibold text-ink">Winner:</span> {formatSignedPoints(tournament.winnerPoints)}</p>
				<p><span className="font-semibold text-ink">Runner-up:</span> {formatSignedPoints(tournament.runnerUpPoints)}</p>
				<p><span className="font-semibold text-ink">Match win:</span> {formatSignedPoints(tournament.matchWinPoints)}</p>
			</div>
			{tournament.format === 'SingleEliminationBracket' ? (
				<BracketView leagueId={league.id} tournament={tournament} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
			) : (
				<DartsRoundView leagueId={league.id} tournament={tournament} activeRound={activeRound} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
			)}
		</article>
	);
}

function BracketView({ leagueId, tournament, canManage, memberNames, onChanged }: { leagueId: string; tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void> }) {
	const rounds = useMemo(() => {
		const grouped = new Map<number, TournamentMatch[]>();
		for (const match of tournament.matches) {
			grouped.set(match.roundNumber, [...(grouped.get(match.roundNumber) ?? []), match]);
		}
		return [...grouped.entries()].sort(([left], [right]) => left - right);
	}, [tournament.matches]);

	return (
		<div className="grid gap-3 lg:grid-cols-2">
			{rounds.map(([roundNumber, matches]) => (
				<div key={roundNumber} className="grid gap-2">
					<h4 className="text-sm font-bold text-ink">Round {roundNumber}</h4>
					{matches.map((match) => (
						<MatchCard key={match.id} leagueId={leagueId} tournament={tournament} match={match} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
					))}
				</div>
			))}
		</div>
	);
}

function MatchCard({ leagueId, tournament, match, canManage, memberNames, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void> }) {
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
	}

	return (
		<form className="grid gap-3 rounded-md border border-slate-200 p-3" onSubmit={submit}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="font-semibold text-ink">Match {match.matchNumber}</p>
				<StatusBadge label={match.status} tone={match.status === 'Completed' ? 'good' : 'neutral'} />
			</div>
			<div className="grid gap-2 text-sm text-slate-700">
				{players.map((playerId, index) => (
					<div key={playerId} className={match.winnerMemberId === playerId ? 'rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-900' : 'rounded-md bg-slate-50 px-2 py-1'}>
						{index === 0 ? 'Player 1' : 'Player 2'}: {memberNames.get(playerId) ?? 'Unknown player'}
					</div>
				))}
			</div>
			{canManage && match.status !== 'Completed' && players.length > 1 ? (
				<div className="grid gap-3 sm:grid-cols-[1fr_5rem_5rem_auto]">
					<Field label="Winner">
						<SelectInput value={winnerMemberId} onChange={(event) => setWinnerMemberId(event.target.value)}>
							{players.map((playerId) => <option key={playerId} value={playerId}>{memberNames.get(playerId)}</option>)}
						</SelectInput>
					</Field>
					<Field label="P1">
						<TextInput type="number" value={playerOneScore} onChange={(event) => setPlayerOneScore(event.target.value)} />
					</Field>
					<Field label="P2">
						<TextInput type="number" value={playerTwoScore} onChange={(event) => setPlayerTwoScore(event.target.value)} />
					</Field>
					<Button type="submit" loading={isSubmitting} loadingLabel="Saving...">Save</Button>
				</div>
			) : null}
		</form>
	);
}

function DartsRoundView({ leagueId, tournament, activeRound, canManage, memberNames, onChanged }: { leagueId: string; tournament: Tournament; activeRound: Tournament['rounds'][number] | undefined; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void> }) {
	const [scores, setScores] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setScores(Object.fromEntries((activeRound?.scores ?? []).map((score) => [score.leagueMemberId, score.score?.toString() ?? ''])));
	}, [activeRound]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setIsSubmitting(true);
		await leagueService.scoreTournamentRound(
			leagueId,
			tournament.id,
			Object.fromEntries(Object.entries(scores).map(([memberId, score]) => [memberId, Number(score)]))
		);
		await onChanged();
	}

	return (
		<div className="grid gap-4">
			<div className="grid gap-2 sm:grid-cols-2">
				{tournament.participants.map((participant) => (
					<div key={participant.leagueMemberId} className={participant.isEliminated ? 'rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-400' : 'rounded-md bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200'}>
						<span className="font-semibold text-ink">{participant.displayName}</span>
						<span className="ml-2">{participant.totalScore} total</span>
						{participant.isEliminated ? <span className="ml-2 font-semibold">Eliminated</span> : null}
					</div>
				))}
			</div>
			{canManage && activeRound && tournament.status !== 'Completed' ? (
				<form className="grid gap-3 rounded-md border border-slate-200 p-3" onSubmit={submit}>
					<h4 className="text-sm font-bold text-ink">Round {activeRound.roundNumber}</h4>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{activeRound.scores.map((entry) => (
							<Field key={entry.leagueMemberId} label={memberNames.get(entry.leagueMemberId) ?? 'Unknown player'}>
								<TextInput type="number" value={scores[entry.leagueMemberId] ?? ''} onChange={(event) => setScores((current) => ({ ...current, [entry.leagueMemberId]: event.target.value }))} required />
							</Field>
						))}
					</div>
					<div className="flex justify-end">
						<Button type="submit" loading={isSubmitting} loadingLabel="Scoring...">Score round</Button>
					</div>
				</form>
			) : null}
			{tournament.rounds.filter((round) => round.isComplete).map((round) => (
				<div key={round.roundNumber} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					Round {round.roundNumber}: winner {memberNames.get(round.roundWinnerMemberId ?? '') ?? 'Unknown'}, eliminated {round.eliminatedMemberIds.map((id) => memberNames.get(id) ?? 'Unknown').join(', ')}
				</div>
			))}
		</div>
	);
}

function formatGameType(gameType: Tournament['gameType']) {
	return gameType === 'Pool' ? 'Pool knockout' : 'Darts highest score';
}

function formatSignedPoints(points: number) {
	return `${points > 0 ? '+' : ''}${points} pts`;
}
