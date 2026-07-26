import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { CopyJoinCodeBadge } from '../../components/CopyJoinCodeBadge';
import { LeagueNavigation } from '../../components/LeagueNavigation';
import { PageHeader } from '../../components/PageHeader';
import { leagueService } from '../../services/leagueService';
import type { League, Member } from '../../services/types';
import { useAuthStore } from '../../store/authStore';
import { AddPointsModal, CreateChallengeModal, ShareLeagueModal } from './Components';
import type { WorkspaceContext } from './context';

export function LeagueWorkspace() {
	const { leagueId } = useParams();
	const [league, setLeague] = useState<League | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [error, setError] = useState('');
	const [dataVersion, setDataVersion] = useState(0);
	const [isAddPointsOpen, setIsAddPointsOpen] = useState(false);
	const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
	const [isShareOpen, setIsShareOpen] = useState(false);
	const { user } = useAuthStore();
	const currentMember = members.find((member) => member.userId === user?.id);

	async function refreshMembers() {
		if (leagueId) {
			setMembers(await leagueService.members(leagueId));
		}
	}

	async function refreshLeague() {
		if (!leagueId) {
			throw new Error('League id is missing.');
		}

		const nextLeague = await leagueService.get(leagueId);
		setLeague(nextLeague);
		return nextLeague;
	}

	useEffect(() => {
		if (!leagueId) {
			return;
		}

		Promise.all([leagueService.get(leagueId), leagueService.members(leagueId)])
			.then(([nextLeague, nextMembers]) => {
				setLeague(nextLeague);
				setMembers(nextMembers);
			})
			.catch((err) => setError(err.message));
	}, [leagueId]);

	if (error) {
		return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
	}

	if (!league) {
		return <p className="text-sm text-slate-600">Loading league...</p>;
	}

	function notifyDataChanged() {
		setDataVersion((current) => current + 1);
	}

	return (
		<div className="grid gap-5 pb-24 sm:pb-0">
			<PageHeader
				title={league.name}
				description={league.description ?? undefined}
				actions={
					<>
						<CopyJoinCodeBadge joinCode={league.joinCode} />
						<Button type="button" variant="secondary" icon={<Share2 size={16} />} onClick={() => setIsShareOpen(true)}>Share</Button>
					</>
				}
			/>
			<LeagueNavigation />
			<Outlet
				context={{
					league,
					members,
					currentMember,
					refreshLeague,
					setLeague,
					refreshMembers,
					dataVersion,
					openAddPointsModal: () => setIsAddPointsOpen(true),
					openCreateChallengeModal: () => setIsCreateChallengeOpen(true)
				} satisfies WorkspaceContext}
			/>
			<AddPointsModal
				open={isAddPointsOpen}
				league={league}
				members={members}
				currentMember={currentMember}
				onClose={() => setIsAddPointsOpen(false)}
				onSaved={notifyDataChanged}
			/>
			<CreateChallengeModal
				open={isCreateChallengeOpen}
				league={league}
				members={members}
				onClose={() => setIsCreateChallengeOpen(false)}
				onSaved={notifyDataChanged}
			/>
			<ShareLeagueModal open={isShareOpen} league={league} onClose={() => setIsShareOpen(false)} />
		</div>
	);
}

export { AdminPage, ChallengesPage, LeaderboardPage, MembersPage, MySubmissionsPage, OverviewPage, PointsFeedPage } from './Containers';
