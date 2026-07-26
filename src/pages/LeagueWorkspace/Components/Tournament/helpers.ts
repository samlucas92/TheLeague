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
			(gameFilter === 'Darts' && tournament.gameType === 'DartsHighestScore');
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
	return tournament.gameType === 'Pool' ? 'Pool (1 vs 1)' : 'Darts (Highest score)';
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

