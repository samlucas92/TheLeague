import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leagueService } from '../../../services/leagueService';
import type { Tournament } from '../../../services/types';
import { filterTournaments, TournamentDetail, TournamentList, type TournamentFilter } from '../Components/Tournament';
import { useWorkspace } from '../context';

export function TournamentsPage() {
	const { league, members, currentMember, dataVersion, openCreateTournamentModal } = useWorkspace();
	const { tournamentId } = useParams();
	const navigate = useNavigate();
	const [tournaments, setTournaments] = useState<Tournament[]>([]);
	const [filter, setFilter] = useState<TournamentFilter>('All');
	const [gameFilter, setGameFilter] = useState('All games');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const canManage = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
	const memberNames = useMemo(() => new Map(members.map((member) => [member.id, member.displayName])), [members]);
	const selectedTournament = tournaments.find((tournament) => tournament.id === tournamentId) ?? null;
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
		navigate(`/leagues/${league.id}/tournaments`);
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
				onBack={() => navigate(`/leagues/${league.id}/tournaments`)}
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
			onView={(tournament) => navigate(`/leagues/${league.id}/tournaments/${tournament.id}`)}
			onDelete={deleteTournament}
		/>
	);
}
