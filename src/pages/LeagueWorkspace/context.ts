import { useOutletContext } from 'react-router-dom';
import type { League, Member } from '../../services/types';

export type WorkspaceContext = {
	league: League;
	members: Member[];
	currentMember?: Member;
	refreshLeague: () => Promise<League>;
	setLeague: (league: League) => void;
	refreshMembers: () => Promise<void>;
	dataVersion: number;
	openAddPointsModal: () => void;
	openCreateChallengeModal: () => void;
	openCreateTournamentModal: () => void;
};

export function useWorkspace() {
	return useOutletContext<WorkspaceContext>();
}
