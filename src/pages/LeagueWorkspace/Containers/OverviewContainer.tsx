import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pencil, Plus, Send, Share2, Trash2, Trophy, X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Field, SelectInput, TextArea, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { leagueService } from '../../../services/leagueService';
import type { Challenge, LeagueAuditItem, LeaderboardRow, Member, PointsFeedItem, Submission } from '../../../services/types';
import { useAuthStore } from '../../../store/authStore';
import { EditChallengeModal, EditMemberModal, EditPointsModal, EmptyState, FeedLine, formatAuditAction, formatPointSource, getAuditTone, getChallengeOutcomes, getChallengeStatus, LeaderboardLine, LinkOfflineMemberModal, PointDetailModal } from '../Components';
import { useWorkspace } from '../context';

export function OverviewPage() {
	const { league, members, dataVersion, openAddPointsModal, openCreateChallengeModal, openCreateTournamentModal } = useWorkspace();
	const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
	const [feed, setFeed] = useState<PointsFeedItem[]>([]);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsLoading(true);
		setError('');
		Promise.all([leagueService.leaderboard(league.id), leagueService.pointsFeed(league.id)])
			.then(([rows, items]) => {
				setLeaderboard((rows ?? []).slice(0, 3));
				setFeed((items ?? []).slice(0, 5));
			})
			.catch((err) => setError(err instanceof Error ? err.message : 'Could not load overview.'))
			.finally(() => setIsLoading(false));
	}, [league.id, dataVersion]);

	return (
		<div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2">{error}</p> : null}
			{!isLoading && leaderboard.length === 0 && feed.length === 0 ? (
				<section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
						<div>
							<h2 className="text-lg font-bold text-ink">Set up the first score</h2>
							<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Invite people with the join code, create a side challenge, or add an opening points entry to get the league moving.</p>
						</div>
						<div className="flex flex-wrap gap-2 lg:justify-end">
							<Button type="button" icon={<Plus size={16} />} onClick={openAddPointsModal}>Add points</Button>
							<Button type="button" variant="secondary" icon={<Send size={16} />} onClick={openCreateChallengeModal}>Create challenge</Button>
							<Button type="button" variant="secondary" icon={<Trophy size={16} />} onClick={openCreateTournamentModal}>Create tournament</Button>
							<Link to="members"><Button type="button" variant="secondary">View members</Button></Link>
						</div>
					</div>
				</section>
			) : null}
			<section className="rounded-lg border border-slate-200 bg-white p-5">
				<h2 className="text-lg font-bold text-ink">Top participants</h2>
				<div className="mt-4 grid gap-2">
					{isLoading ? <p className="text-sm text-slate-600">Loading leaderboard...</p> : null}
					{leaderboard.map((row) => <LeaderboardLine key={row.leagueMemberId} row={row} />)}
					{leaderboard.length === 0 && !isLoading ? <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">No approved points yet. The first approved score will appear here.</p> : null}
				</div>
				<div className="mt-5 flex gap-2">
					<Button type="button" icon={<Plus size={16} />} onClick={openAddPointsModal}>Add points</Button>
					<Button type="button" variant="secondary" icon={<Send size={16} />} onClick={openCreateChallengeModal}>Create challenge</Button>
					<Button type="button" variant="secondary" icon={<Trophy size={16} />} onClick={openCreateTournamentModal}>Create tournament</Button>
					<Link to="leaderboard"><Button variant="secondary">View leaderboard</Button></Link>
				</div>
			</section>
			<section className="rounded-lg border border-slate-200 bg-white p-5">
				<h2 className="text-lg font-bold text-ink">Latest points</h2>
				<div className="mt-4 grid gap-3">
					{isLoading ? <p className="text-sm text-slate-600">Loading points...</p> : null}
					{feed.map((item) => <FeedLine key={item.allocationId} item={item} />)}
					{feed.length === 0 && !isLoading ? <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">The points feed is waiting for its first score.</p> : null}
				</div>
			</section>
			<section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
				<h2 className="text-lg font-bold text-ink">Members</h2>
				<p className="mt-1 text-sm text-slate-600">{members.length} members in {league.name}.</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<Link to="members"><Button type="button" variant="secondary">Manage members</Button></Link>
					<Button type="button" variant="secondary" icon={<Share2 size={16} />} onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/view/${league.joinCode}`)}>Copy public link</Button>
				</div>
			</section>
		</div>
	);
}
