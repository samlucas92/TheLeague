import type { Tournament, TournamentMatch } from '../../../../services/types';
import { StatusBadge } from '../../../../components/StatusBadge';
import { breakRuleLabel, gameRulesSummary, isDartsTournament, leagueMatches, matchFormatLabel, structureLabel } from './helpers';
import { Avatar } from './Shared';

export function TournamentOverview({ tournament }: { tournament: Tournament }) {
	return (
		<div className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-2">
			<div>
				<h3 className="text-xs font-bold uppercase text-slate-500">Format</h3>
				<div className="mt-3 grid gap-2 text-sm text-slate-700">
					<p>{structureLabel(tournament)}</p>
					{gameRulesSummary(tournament).map((rule) => <p key={rule}>{rule}</p>)}
				</div>
			</div>
			<div>
				<h3 className="text-xs font-bold uppercase text-slate-500">About</h3>
				<p className="mt-3 text-sm leading-6 text-slate-600">
					{tournament.gameType === 'DartsHighestScore'
						? 'Each player has the round time limit to score as many points as possible. After each round, the lowest scoring players are eliminated.'
						: isDartsTournament(tournament)
							? 'Players reduce their score to exactly 0 to win the leg, using the selected double-in and double-out rules.'
							: 'Players compete head to head using the selected frame format and table rules.'}
				</p>
			</div>
		</div>
	);
}

export function RecentResults({ matches, memberNames, onViewAll }: { matches: TournamentMatch[]; memberNames: Map<string, string>; onViewAll: () => void }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<div className="flex justify-between gap-3">
				<h3 className="font-bold text-ink">Recent results</h3>
				<button type="button" className="text-xs font-semibold text-blue-700" onClick={onViewAll}>View all matches</button>
			</div>
			<div className="mt-3 grid gap-2">
				{matches.length === 0 ? <p className="text-sm text-slate-600">No completed matches yet.</p> : null}
				{matches.map((match) => (
					<div key={match.id} className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
						<span>{memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD'}</span>
						<span className="font-bold text-ink">{match.playerOneScore ?? '-'} - {match.playerTwoScore ?? '-'}</span>
						<span>{memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD'}</span>
						<span className="text-xs text-slate-500">{match.roundNumber === 0 ? 'League' : `Round ${match.roundNumber}`}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function LeagueStage({ tournament, memberNames, onView }: { tournament: Tournament; memberNames: Map<string, string>; onView: (match: TournamentMatch) => void }) {
	const matches = leagueMatches(tournament);
	const standings = buildLeagueStandings(tournament, matches);

	return (
		<div className="grid gap-4">
			<div className="rounded-lg border border-slate-200 p-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h3 className="font-bold text-ink">League stage</h3>
						<p className="mt-1 text-sm text-slate-600">Everyone plays once. The knockout bracket is generated from the league standings when all league matches are complete.</p>
					</div>
					<StatusBadge label={`${matches.filter((match) => match.status === 'Completed').length} / ${matches.length} matches`} tone={matches.every((match) => match.status === 'Completed') && matches.length > 0 ? 'good' : 'neutral'} />
				</div>
				<div className="mt-4 overflow-x-auto">
					<table className="w-full min-w-[34rem] text-left text-sm">
						<thead className="text-xs uppercase text-slate-500">
							<tr>
								<th className="py-2">Pos</th>
								<th className="py-2">Player</th>
								<th className="py-2 text-right">Played</th>
								<th className="py-2 text-right">Wins</th>
								<th className="py-2 text-right">For</th>
								<th className="py-2 text-right">Against</th>
								<th className="py-2 text-right">Diff</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{standings.map((row, index) => (
								<tr key={row.memberId}>
									<td className="py-2 font-semibold text-slate-500">{index + 1}</td>
									<td className="py-2">
										<span className="inline-flex items-center gap-2 font-semibold text-ink">
											<Avatar name={row.name} />
											{row.name}
										</span>
									</td>
									<td className="py-2 text-right">{row.played}</td>
									<td className="py-2 text-right">{row.wins}</td>
									<td className="py-2 text-right">{row.pointsFor}</td>
									<td className="py-2 text-right">{row.pointsAgainst}</td>
									<td className="py-2 text-right">{formatDiff(row.pointsFor - row.pointsAgainst)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			<MatchesList matches={matches} memberNames={memberNames} onView={onView} />
		</div>
	);
}

export function MatchesList({ matches, memberNames, onView }: { matches: TournamentMatch[]; memberNames: Map<string, string>; onView: (match: TournamentMatch) => void }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">Matches</h3>
			<div className="mt-3 grid gap-2">
				{matches.length === 0 ? <p className="text-sm text-slate-600">No matches have been generated yet.</p> : null}
				{matches.map((match) => (
					<button key={match.id} type="button" className="grid gap-2 rounded-md border border-slate-200 px-3 py-3 text-left hover:border-slate-300 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center" onClick={() => onView(match)}>
						<span className="font-semibold text-ink">{memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD'}</span>
						<span className="text-sm font-bold text-slate-500">{match.playerOneScore ?? '-'} - {match.playerTwoScore ?? '-'}</span>
						<span className="font-semibold text-ink">{memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD'}</span>
						<StatusBadge label={match.status} tone={match.status === 'Completed' ? 'good' : 'neutral'} />
					</button>
				))}
			</div>
		</div>
	);
}

function buildLeagueStandings(tournament: Tournament, matches: TournamentMatch[]) {
	const standings = new Map(tournament.participants.map((participant) => [participant.leagueMemberId, {
		memberId: participant.leagueMemberId,
		name: participant.displayName,
		seed: participant.seed,
		played: 0,
		wins: 0,
		pointsFor: 0,
		pointsAgainst: 0
	}]));

	for (const match of matches.filter((candidate) => candidate.status === 'Completed')) {
		const playerOne = match.playerOneMemberId ? standings.get(match.playerOneMemberId) : null;
		const playerTwo = match.playerTwoMemberId ? standings.get(match.playerTwoMemberId) : null;
		if (!playerOne || !playerTwo) {
			continue;
		}

		playerOne.played += 1;
		playerTwo.played += 1;
		playerOne.pointsFor += match.playerOneScore ?? 0;
		playerOne.pointsAgainst += match.playerTwoScore ?? 0;
		playerTwo.pointsFor += match.playerTwoScore ?? 0;
		playerTwo.pointsAgainst += match.playerOneScore ?? 0;
		if (match.winnerMemberId === playerOne.memberId) {
			playerOne.wins += 1;
		}
		if (match.winnerMemberId === playerTwo.memberId) {
			playerTwo.wins += 1;
		}
	}

	return [...standings.values()].sort((left, right) =>
		right.wins - left.wins ||
		(right.pointsFor - right.pointsAgainst) - (left.pointsFor - left.pointsAgainst) ||
		right.pointsFor - left.pointsFor ||
		left.seed - right.seed
	);
}

function formatDiff(value: number) {
	return value > 0 ? `+${value}` : value.toString();
}

export function PlayersTable({ tournament }: { tournament: Tournament }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">Players</h3>
			<div className="mt-3 divide-y divide-slate-100">
				{tournament.participants.map((participant) => (
					<div key={participant.leagueMemberId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2 text-sm">
						<span className="text-slate-500">#{participant.seed}</span>
						<span className="font-semibold text-ink">{participant.displayName}</span>
						<StatusBadge label={participant.isEliminated ? 'Eliminated' : 'Active'} tone={participant.isEliminated ? 'neutral' : 'good'} />
					</div>
				))}
			</div>
		</div>
	);
}

export function TournamentDetailsPanel({ tournament }: { tournament: Tournament }) {
	const rules = [
		`Structure: ${structureLabel(tournament)}`,
		`Match format: ${matchFormatLabel(tournament)}`,
		tournament.gameType === 'Pool' ? `Break rule: ${breakRuleLabel(tournament)}` : null,
		tournament.gameType === 'Pool' && tournament.callShotRequired ? 'Call shot required' : null,
		tournament.gameType === 'Pool' && tournament.allowRerack ? 'Re-rack allowed' : null,
		tournament.gameType === 'Pool' && tournament.pushOutAfterFouls ? 'Push out after fouls' : null,
		isDartsTournament(tournament) && tournament.startScore ? `Start score: ${tournament.startScore}` : null,
		isDartsTournament(tournament) ? `${tournament.doubleInRequired ? 'Double in required' : 'Double in not required'}` : null,
		isDartsTournament(tournament) ? `${tournament.doubleOutRequired ? 'Double out required' : 'Double out not required'}` : null,
		tournament.roundTimeLimitMinutes ? `Round time limit: ${tournament.roundTimeLimitMinutes} minutes` : null
	].filter(Boolean);

	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">Details</h3>
			<div className="mt-3 grid gap-2 text-sm text-slate-700">
				{rules.map((rule) => <p key={rule}>{rule}</p>)}
			</div>
		</div>
	);
}
