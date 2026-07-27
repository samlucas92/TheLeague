import { useEffect, useMemo, useState } from 'react';
import { leagueService } from '../../../services/leagueService';
import type { Tournament } from '../../../services/types';
import { filterTournaments, TournamentDetail, TournamentList, type TournamentFilter } from '../Components/Tournament';
import { useWorkspace } from '../context';

export function TournamentsPage() {
	const { league, members, currentMember, dataVersion, openCreateTournamentModal } = useWorkspace();
	const [tournaments, setTournaments] = useState<Tournament[]>([]);
	const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
	const [filter, setFilter] = useState<TournamentFilter>('All');
	const [gameFilter, setGameFilter] = useState('All games');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const canManage = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
	const memberNames = useMemo(() => new Map(members.map((member) => [member.id, member.displayName])), [members]);
	const selectedTournament = tournaments.find((tournament) => tournament.id === selectedTournamentId) ?? null;
	const filteredTournaments = useMemo(() => filterTournaments(tournaments, filter, gameFilter), [tournaments, filter, gameFilter]);

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
		setSelectedTournamentId(null);
		await refresh();
	}

	if (selectedTournament) {
		return (
			<TournamentDetail
				leagueId={league.id}
				tournament={selectedTournament}
				canManage={canManage}
				currentMemberId={currentMember?.id}
				memberNames={memberNames}
				onBack={() => setSelectedTournamentId(null)}
				onChanged={refresh}
				onDelete={() => deleteTournament(selectedTournament)}
			/>
		);
	}

	return (
		<TournamentList
			tournaments={filteredTournaments}
			filter={filter}
			gameFilter={gameFilter}
			isLoading={isLoading}
			error={error}
			canManage={canManage}
			memberNames={memberNames}
			onFilterChange={setFilter}
			onGameFilterChange={setGameFilter}
			onCreate={openCreateTournamentModal}
			onView={(tournament) => setSelectedTournamentId(tournament.id)}
			onDelete={deleteTournament}
		/>
	);
}
