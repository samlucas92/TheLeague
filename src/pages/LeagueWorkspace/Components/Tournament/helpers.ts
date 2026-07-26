import type { Tournament, TournamentMatch } from '../../../../services/types';

export type TournamentFilter = 'All' | 'Upcoming' | 'Active' | 'Completed' | 'Drafts' | 'Cancelled';

export const tournamentFilters: TournamentFilter[] = ['All', 'Upcoming', 'Active', 'Completed', 'Drafts', 'Cancelled'];

export function filterTournaments(tournaments: Tournament[], filter: TournamentFilter, gameFilter: string) {
	return tournaments.filter((tournament) => {
		const statusMatches =
			filter === 'All' ||
			(filter === 'Drafts' ? tournament.status === 'Draft' : tournament.status === filter);
		const gameMatches =
			gameFilter === 'All games' ||
			(gameFilter === 'Pool' && tournament.gameType === 'Pool') ||
			(gameFilter === 'Darts' && isDartsTournament(tournament));
		return statusMatches && gameMatches;
	});
}

export function groupMatchesByRound(matches: TournamentMatch[]) {
	const grouped = new Map<number, TournamentMatch[]>();
	for (const match of matches) {
		grouped.set(match.roundNumber, [...(grouped.get(match.roundNumber) ?? []), match]);
	}
	return [...grouped.entries()].sort(([left], [right]) => left - right);
}

export function getNextMatch(tournament: Tournament) {
	return tournament.matches.find((match) => match.status === 'Ready' && match.playerOneMemberId && match.playerTwoMemberId) ?? null;
}

export function roundTitle(roundNumber: number, roundCount: number) {
	if (roundNumber === roundCount) {
		return 'Final';
	}
	if (roundNumber === roundCount - 1) {
		return 'Semi-finals';
	}
	if (roundNumber === roundCount - 2) {
		return 'Quarter-finals';
	}
	return `Round ${roundNumber}`;
}

export function formatGameType(tournament: Tournament) {
	if (tournament.gameType === 'Darts301') {
		return 'Darts (301)';
	}

	if (tournament.gameType === 'Darts501') {
		return 'Darts (501)';
	}

	if (tournament.gameType === 'DartsHighestScore') {
		return 'Darts (Highest score)';
	}

	return 'Pool (1 vs 1)';
}

export function getStatusTone(status: Tournament['status']) {
	if (status === 'Completed') {
		return 'good';
	}
	if (status === 'Cancelled') {
		return 'bad';
	}
	if (status === 'Draft') {
		return 'neutral';
	}
	return 'good';
}

export function formatDate(date: string) {
	return new Date(date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isDartsTournament(tournament: Tournament) {
	return tournament.gameType === 'Darts301' || tournament.gameType === 'Darts501' || tournament.gameType === 'DartsHighestScore';
}

export function matchFormatLabel(tournament: Tournament) {
	return isDartsTournament(tournament) ? 'Best of 7 legs' : 'Best of 7 frames';
}

export function gameRulesSummary(tournament: Tournament) {
	if (tournament.gameType === 'Darts301') {
		return ['301', 'Double in', 'Double out', 'Best of 7 legs'];
	}

	if (tournament.gameType === 'Darts501') {
		return ['501', 'Double in', 'Double out', 'Best of 7 legs'];
	}

	if (tournament.gameType === 'DartsHighestScore') {
		return ['Highest score', `Eliminate ${tournament.eliminatePerRound} each round`];
	}

	return ['Pool (1 vs 1)', 'Best of 7 frames'];
}
