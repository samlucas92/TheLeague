import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { Check, Copy, Mail, MessageCircle, Pencil, Plus, Send, Share2, Trash2, X } from 'lucide-react';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CopyJoinCodeBadge } from '../components/CopyJoinCodeBadge';
import { Field, SelectInput, TextArea, TextInput } from '../components/FormField';
import { LeagueNavigation } from '../components/LeagueNavigation';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { leagueService } from '../services/leagueService';
import type { Challenge, League, LeaderboardRow, Member, PointsFeedItem, Submission } from '../services/types';
import { useAuthStore } from '../store/authStore';

type WorkspaceContext = {
	league: League;
	members: Member[];
	currentMember?: Member;
	refreshLeague: () => Promise<League>;
	setLeague: (league: League) => void;
	refreshMembers: () => Promise<void>;
	dataVersion: number;
	openAddPointsModal: () => void;
	openCreateChallengeModal: () => void;
};

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
		<div className="grid gap-5">
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

function useWorkspace() {
	return useOutletContext<WorkspaceContext>();
}

export function OverviewPage() {
	const { league, members, dataVersion, openAddPointsModal, openCreateChallengeModal } = useWorkspace();
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
			<section className="rounded-lg border border-slate-200 bg-white p-5">
				<h2 className="text-lg font-bold text-ink">Top participants</h2>
				<div className="mt-4 grid gap-2">
					{isLoading ? <p className="text-sm text-slate-600">Loading leaderboard...</p> : null}
					{leaderboard.map((row) => <LeaderboardLine key={row.leagueMemberId} row={row} />)}
					{leaderboard.length === 0 && !isLoading ? <p className="text-sm text-slate-600">No approved points yet.</p> : null}
				</div>
				<div className="mt-5 flex gap-2">
					<Button type="button" icon={<Plus size={16} />} onClick={openAddPointsModal}>Add points</Button>
					<Button type="button" variant="secondary" icon={<Send size={16} />} onClick={openCreateChallengeModal}>Create challenge</Button>
					<Link to="leaderboard"><Button variant="secondary">View leaderboard</Button></Link>
				</div>
			</section>
			<section className="rounded-lg border border-slate-200 bg-white p-5">
				<h2 className="text-lg font-bold text-ink">Latest points</h2>
				<div className="mt-4 grid gap-3">
					{isLoading ? <p className="text-sm text-slate-600">Loading points...</p> : null}
					{feed.map((item) => <FeedLine key={item.allocationId} item={item} />)}
					{feed.length === 0 && !isLoading ? <p className="text-sm text-slate-600">The points feed is waiting for its first approval.</p> : null}
				</div>
			</section>
			<section className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
				<h2 className="text-lg font-bold text-ink">Members</h2>
				<p className="mt-1 text-sm text-slate-600">{members.length} members in {league.name}.</p>
			</section>
		</div>
	);
}

export function LeaderboardPage() {
	const { league } = useWorkspace();
	const [rows, setRows] = useState<LeaderboardRow[]>([]);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsLoading(true);
		setError('');
		leagueService.leaderboard(league.id)
			.then((items) => setRows(items ?? []))
			.catch((err) => setError(err instanceof Error ? err.message : 'Could not load leaderboard.'))
			.finally(() => setIsLoading(false));
	}, [league.id]);

	return (
		<div className="grid gap-3">
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			<section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
				<table className="w-full text-left text-sm">
					<thead className="bg-slate-50 text-xs uppercase text-slate-500">
						<tr><th className="p-3">Position</th><th className="p-3">Participant</th><th className="p-3 text-right">Approved</th><th className="p-3 text-right">Pending</th></tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.leagueMemberId} className="border-t border-slate-100">
								<td className="p-3 font-bold">{row.position}</td>
								<td className="p-3">{row.displayName}</td>
								<td className="p-3 text-right font-bold">{row.approvedPoints}</td>
								<td className="p-3 text-right">{row.pendingPoints}</td>
							</tr>
						))}
					</tbody>
				</table>
				{isLoading ? <div className="border-t border-slate-100 p-8 text-center text-sm text-slate-600">Loading leaderboard...</div> : null}
				{rows.length === 0 && !isLoading ? <div className="border-t border-slate-100 p-8 text-center text-sm text-slate-600">No approved points yet.</div> : null}
			</section>
		</div>
	);
}

export function PointsFeedPage() {
	const { league, members, currentMember, dataVersion, openAddPointsModal } = useWorkspace();
	const [items, setItems] = useState<PointsFeedItem[]>([]);
	const [editingItem, setEditingItem] = useState<PointsFeedItem | null>(null);
	const [selectedItem, setSelectedItem] = useState<PointsFeedItem | null>(null);
	const [memberFilter, setMemberFilter] = useState('all');
	const [sourceFilter, setSourceFilter] = useState('all');
	const [kindFilter, setKindFilter] = useState('all');
	const [page, setPage] = useState(1);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [deletingAllocationId, setDeletingAllocationId] = useState<string | null>(null);
	const [confirmingDeleteItem, setConfirmingDeleteItem] = useState<PointsFeedItem | null>(null);
	const canManagePoints = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
	const sourceOptions = useMemo(() => Array.from(new Set(items.map((item) => item.source))).sort(), [items]);
	const pageSize = 8;
	const filteredItems = useMemo(() => items.filter((item) => {
		const matchesMember = memberFilter === 'all' || item.leagueMemberId === memberFilter;
		const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
		const matchesKind = kindFilter === 'all' || (kindFilter === 'challenge' ? Boolean(item.challengeName) : !item.challengeName);
		return matchesMember && matchesSource && matchesKind;
	}), [items, kindFilter, memberFilter, sourceFilter]);
	const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
	const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

	async function refreshPoints() {
		setIsLoading(true);
		try {
			setItems(await leagueService.pointsFeed(league.id) ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not load points feed.');
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		refreshPoints();
	}, [league.id, dataVersion]);

	useEffect(() => {
		setPage(1);
	}, [kindFilter, memberFilter, sourceFilter]);

	async function deletePoints(item: PointsFeedItem) {
		setError('');
		setMessage('');
		setDeletingAllocationId(item.allocationId);
		try {
			await leagueService.deletePoints(league.id, item.allocationId);
			setMessage('Point entry deleted.');
			await refreshPoints();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not delete points.');
		} finally {
			setDeletingAllocationId(null);
		}
	}

	return (
		<div className="grid gap-5">
			<section className="grid gap-3">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 className="text-lg font-bold text-ink">Points Feed</h2>
						<p className="text-sm text-slate-600">Every official score change appears here.</p>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge label={`${filteredItems.length} of ${items.length} entries`} />
						<Button type="button" icon={<Plus size={16} />} onClick={openAddPointsModal}>Add points</Button>
					</div>
				</div>
				<div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-3">
					<Field label="Member">
						<SelectInput value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
							<option value="all">All members</option>
							{members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
						</SelectInput>
					</Field>
					<Field label="Source">
						<SelectInput value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
							<option value="all">All sources</option>
							{sourceOptions.map((source) => <option key={source} value={source}>{formatPointSource(source)}</option>)}
						</SelectInput>
					</Field>
					<Field label="Type">
						<SelectInput value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}>
							<option value="all">Manual and challenge</option>
							<option value="manual">Manual points</option>
							<option value="challenge">Challenge points</option>
						</SelectInput>
					</Field>
				</div>
				{isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading points feed...</div> : null}
				{pagedItems.map((item) => (
					<FeedLine
						key={item.allocationId}
						item={item}
						onOpen={() => setSelectedItem(item)}
						actions={canManagePoints ? (
							<div className="flex flex-wrap justify-end gap-2">
								<Button type="button" variant="secondary" className="px-3" onClick={() => setEditingItem(item)} aria-label="Edit points"><Pencil size={16} /></Button>
								<Button type="button" variant="danger" className="px-3" loading={deletingAllocationId === item.allocationId} onClick={() => setConfirmingDeleteItem(item)} aria-label="Delete points"><Trash2 size={16} /></Button>
							</div>
						) : undefined}
					/>
				))}
				{items.length === 0 && !isLoading ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No official points yet.</div> : null}
				{items.length > 0 && filteredItems.length === 0 && !isLoading ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No points match those filters.</div> : null}
				{filteredItems.length > pageSize ? (
					<div className="flex flex-wrap items-center justify-between gap-3">
						<Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button>
						<StatusBadge label={`Page ${page} of ${totalPages}`} />
						<Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</Button>
					</div>
				) : null}
			</section>
			{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			{editingItem ? (
				<EditPointsModal
					open
					league={league}
					members={members}
					item={editingItem}
					onClose={() => setEditingItem(null)}
					onSaved={async () => {
						setEditingItem(null);
						setMessage('Point entry updated.');
						await refreshPoints();
					}}
				/>
			) : null}
			{selectedItem ? (
				<PointDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
			) : null}
			{confirmingDeleteItem ? (
				<ConfirmationModal
					open
					title="Delete point entry?"
					description={
						<p>
							Delete the {confirmingDeleteItem.points >= 0 ? 'award' : 'deduction'} for <span className="font-semibold text-ink">{confirmingDeleteItem.displayName}</span>? This will remove it from the points feed and leaderboard total.
						</p>
					}
					confirmLabel="Delete entry"
					loading={deletingAllocationId === confirmingDeleteItem.allocationId}
					onCancel={() => setConfirmingDeleteItem(null)}
					onConfirm={async () => {
						await deletePoints(confirmingDeleteItem);
						setConfirmingDeleteItem(null);
					}}
				/>
			) : null}
		</div>
	);
}

export function ChallengesPage() {
	const { league, members, currentMember, dataVersion, openCreateChallengeModal } = useWorkspace();
	const { user } = useAuthStore();
	const [challenges, setChallenges] = useState<Challenge[]>([]);
	const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
	const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
	const [page, setPage] = useState(1);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [pendingAction, setPendingAction] = useState<string | null>(null);
	const [confirmingDeleteChallenge, setConfirmingDeleteChallenge] = useState<Challenge | null>(null);
	const pageSize = 5;
	const totalPages = Math.max(1, Math.ceil(challenges.length / pageSize));
	const pagedChallenges = challenges.slice((page - 1) * pageSize, page * pageSize);

	async function refreshChallenges() {
		setIsLoading(true);
		try {
			setChallenges(await leagueService.challenges(league.id) ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not load challenges.');
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		refreshChallenges();
	}, [league.id, dataVersion]);

	async function respond(challenge: Challenge, action: 'accept' | 'reject' | 'complete' | 'fail', targetMemberId?: string) {
		const actionKey = `${challenge.id}:${action}:${targetMemberId ?? 'self'}`;
		setError('');
		setPendingAction(actionKey);
		try {
			if (action === 'accept') {
				await leagueService.acceptChallenge(league.id, challenge.id);
				setMessage('Challenge accepted.');
			} else if (action === 'reject') {
				await leagueService.rejectChallenge(league.id, challenge.id);
				setMessage('Challenge rejected and penalty applied.');
			} else if (action === 'complete') {
				await leagueService.completeChallenge(league.id, challenge.id, targetMemberId);
				setMessage('Challenge completed and points awarded.');
			} else {
				await leagueService.failChallenge(league.id, challenge.id, targetMemberId);
				setMessage('Challenge failed and penalty applied.');
			}
			setSelectedChallenge(null);
			await refreshChallenges();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not update challenge.');
		} finally {
			setPendingAction(null);
		}
	}

	async function deleteChallenge(challenge: Challenge) {
		setError('');
		setMessage('');
		setPendingAction(`${challenge.id}:delete`);
		try {
			await leagueService.deleteChallenge(league.id, challenge.id);
			setMessage('Challenge deleted.');
			await refreshChallenges();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not delete challenge.');
		} finally {
			setPendingAction(null);
		}
	}

	return (
		<div className="grid gap-5">
			<section className="grid gap-3">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 className="text-lg font-bold text-ink">Challenges</h2>
						<p className="text-sm text-slate-600">Player-to-player dares with rewards for success and penalties for refusal.</p>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge label={`Page ${page} of ${totalPages}`} />
						<Button type="button" icon={<Plus size={16} />} onClick={openCreateChallengeModal}>Create challenge</Button>
					</div>
				</div>
				{isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading challenges...</div> : null}
				{pagedChallenges.map((challenge) => {
					const status = getChallengeStatus(challenge, currentMember?.id);
					const canMaintainChallenge = user?.id === challenge.createdByUserId || currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
					return (
						<article
							key={challenge.id}
							className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-ink/30 hover:shadow-md"
							onClick={() => setSelectedChallenge(challenge)}
							role="button"
							tabIndex={0}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									setSelectedChallenge(challenge);
								}
							}}
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0">
									<h3 className="font-bold text-ink">{challenge.name}</h3>
									<p className="mt-1 overflow-hidden text-sm leading-6 text-slate-600 [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
										{challenge.description || 'No description yet.'}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<StatusBadge label={status} tone={status === 'Rejected' || status === 'Failed' ? 'bad' : status === 'Accepted' || status === 'Completed' ? 'good' : 'warning'} />
									{canMaintainChallenge ? (
										<span className="flex gap-2" onClick={(event) => event.stopPropagation()}>
											<Button type="button" variant="secondary" className="px-3" onClick={() => setEditingChallenge(challenge)} aria-label="Edit challenge"><Pencil size={16} /></Button>
											<Button type="button" variant="danger" className="px-3" loading={pendingAction === `${challenge.id}:delete`} onClick={() => setConfirmingDeleteChallenge(challenge)} aria-label="Delete challenge"><Trash2 size={16} /></Button>
										</span>
									) : null}
								</div>
							</div>
							<div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
									<span className="rounded bg-slate-100 px-2 py-1">Aimed at {(challenge.targetNames ?? []).join(', ') || 'No targets'}</span>
								<span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">+{challenge.pointsForSuccess} if completed</span>
								<span className="rounded bg-red-100 px-2 py-1 text-red-800">{challenge.pointsForFailure} if rejected</span>
							</div>
						</article>
					);
				})}
				{challenges.length === 0 && !isLoading ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No challenges yet.</div> : null}
				{challenges.length > pageSize ? (
					<div className="flex items-center justify-between">
						<Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button>
						<Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</Button>
					</div>
				) : null}
			</section>
			{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			{editingChallenge ? (
				<EditChallengeModal
					open
					league={league}
					members={members}
					challenge={editingChallenge}
					onClose={() => setEditingChallenge(null)}
					onSaved={async () => {
						setEditingChallenge(null);
						setMessage('Challenge updated.');
						await refreshChallenges();
					}}
				/>
			) : null}
			{selectedChallenge ? (() => {
				const memberId = currentMember?.id;
				const isTargeted = !!memberId && selectedChallenge.targetMemberIds.includes(memberId);
				const hasResponded = !!memberId && (
					selectedChallenge.acceptedMemberIds.includes(memberId) ||
					selectedChallenge.rejectedMemberIds.includes(memberId)
				);
				const hasOutcome = !!memberId && (
					selectedChallenge.completedMemberIds.includes(memberId) ||
					selectedChallenge.failedMemberIds.includes(memberId)
				);
				const canConfirmChallenge = user?.id === selectedChallenge.createdByUserId || currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
				const outcomes = getChallengeOutcomes(selectedChallenge);

				return (
					<Modal
						open
						title={selectedChallenge.name}
						description={`Aimed at ${(selectedChallenge.targetNames ?? []).join(', ') || 'No targets'}`}
						onClose={() => setSelectedChallenge(null)}
					>
						<div>
							<p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedChallenge.description || 'No description yet.'}</p>
							<div className="mt-5 grid gap-3 sm:grid-cols-2">
								<div className="rounded-md bg-emerald-50 p-3">
									<p className="text-xs font-bold uppercase text-emerald-800">Completion reward</p>
									<p className="mt-1 text-2xl font-bold text-emerald-900">+{selectedChallenge.pointsForSuccess}</p>
								</div>
								<div className="rounded-md bg-red-50 p-3">
									<p className="text-xs font-bold uppercase text-red-800">Rejection penalty</p>
									<p className="mt-1 text-2xl font-bold text-red-900">{selectedChallenge.pointsForFailure}</p>
								</div>
							</div>
							{isTargeted && memberId ? (
								<div className="mt-5 grid gap-3">
									<div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
										Status: {getChallengeStatus(selectedChallenge, memberId)}
									</div>
									{!hasResponded && !hasOutcome ? (
										<div className="flex flex-wrap justify-end gap-2">
											<Button type="button" variant="secondary" loading={pendingAction === `${selectedChallenge.id}:reject:self`} onClick={() => respond(selectedChallenge, 'reject')} icon={<X size={16} />}>Reject</Button>
											<Button type="button" loading={pendingAction === `${selectedChallenge.id}:accept:self`} onClick={() => respond(selectedChallenge, 'accept')} icon={<Check size={16} />}>Accept</Button>
										</div>
									) : null}
								</div>
							) : (
								<p className="mt-5 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">Only challenged players can accept or reject this challenge.</p>
							)}
							<div className="mt-5 border-t border-slate-100 pt-4">
								<h3 className="text-sm font-bold text-ink">Outcome history</h3>
								<div className="mt-3 grid gap-2">
									{outcomes.map((outcome) => {
										const canMarkOutcome = canConfirmChallenge && outcome.status === 'Accepted';
										return (
											<div key={outcome.leagueMemberId} className="grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
												<div>
													<div className="flex flex-wrap items-center gap-2">
														<p className="font-semibold text-ink">{outcome.displayName}</p>
														<StatusBadge
															label={outcome.status}
															tone={outcome.status === 'Rejected' || outcome.status === 'Failed' ? 'bad' : outcome.status === 'Accepted' || outcome.status === 'Completed' ? 'good' : 'neutral'}
														/>
														{outcome.points ? <StatusBadge label={`${outcome.points > 0 ? '+' : ''}${outcome.points} pts`} tone={outcome.points > 0 ? 'good' : 'bad'} /> : null}
													</div>
													{outcome.awardedAt ? (
														<p className="mt-1 text-xs text-slate-500">
															{outcome.status} by {outcome.awardedByName ?? 'Unknown'} on {new Date(outcome.awardedAt).toLocaleString()}
														</p>
													) : (
														<p className="mt-1 text-xs text-slate-500">{outcome.status === 'Open' ? 'Waiting for response.' : 'No point allocation yet.'}</p>
													)}
												</div>
												{canMarkOutcome ? (
													<div className="flex flex-wrap justify-end gap-2">
														<Button type="button" variant="secondary" loading={pendingAction === `${selectedChallenge.id}:fail:${outcome.leagueMemberId}`} onClick={() => respond(selectedChallenge, 'fail', outcome.leagueMemberId)} icon={<X size={16} />}>Mark failed</Button>
														<Button type="button" loading={pendingAction === `${selectedChallenge.id}:complete:${outcome.leagueMemberId}`} onClick={() => respond(selectedChallenge, 'complete', outcome.leagueMemberId)} icon={<Check size={16} />}>Mark completed</Button>
													</div>
												) : null}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</Modal>
				);
			})() : null}
			{confirmingDeleteChallenge ? (
				<ConfirmationModal
					open
					title="Delete challenge?"
					description={
						<p>
							Delete <span className="font-semibold text-ink">{confirmingDeleteChallenge.name}</span>? Existing point entries will stay in the feed, but the challenge itself will no longer be available.
						</p>
					}
					confirmLabel="Delete challenge"
					loading={pendingAction === `${confirmingDeleteChallenge.id}:delete`}
					onCancel={() => setConfirmingDeleteChallenge(null)}
					onConfirm={async () => {
						await deleteChallenge(confirmingDeleteChallenge);
						setConfirmingDeleteChallenge(null);
					}}
				/>
			) : null}
		</div>
	);
}

export function AdminPage() {
	const { league, currentMember, setLeague } = useWorkspace();
	const [pending, setPending] = useState<Submission[]>([]);
	const [name, setName] = useState(league.name);
	const [description, setDescription] = useState(league.description ?? '');
	const [joinMode, setJoinMode] = useState(league.joinMode);
	const [publicViewEnabled, setPublicViewEnabled] = useState(league.publicViewEnabled);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [pendingAction, setPendingAction] = useState<string | null>(null);
	const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
	const canManageLeague = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
	const joinModeOptions = ['OpenWithCode', 'ApprovalRequired', 'InviteOnly', 'Closed'];

	async function refresh() {
		setPending(await leagueService.pendingSubmissions(league.id));
	}

	useEffect(() => {
		refresh();
	}, [league.id]);

	async function approve(submission: Submission) {
		setError('');
		setPendingAction(`${submission.id}:approve`);
		try {
			await leagueService.approveSubmission(league.id, submission.id, {
				approvedPoints: submission.requestedPoints,
				publicReviewReason: submission.publicReason
			});
			setMessage('Submission approved and allocated.');
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not approve submission.');
		} finally {
			setPendingAction(null);
		}
	}

	async function reject(submission: Submission) {
		setError('');
		setPendingAction(`${submission.id}:reject`);
		try {
			await leagueService.rejectSubmission(league.id, submission.id, {
				publicReviewReason: submission.publicReason
			});
			setMessage('Submission rejected.');
			await refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not reject submission.');
		} finally {
			setPendingAction(null);
		}
	}

	async function saveSettings(event: FormEvent) {
		event.preventDefault();
		setError('');
		setMessage('');
		setPendingAction('settings');
		try {
			const updated = await leagueService.updateSettings(league.id, {
				name,
				description,
				joinMode,
				publicViewEnabled
			});
			setLeague(updated);
			setMessage('League settings saved.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not save league settings.');
		} finally {
			setPendingAction(null);
		}
	}

	async function regenerateJoinCode() {
		setError('');
		setMessage('');
		setPendingAction('join-code');
		try {
			const updated = await leagueService.regenerateJoinCode(league.id);
			setLeague(updated);
			setMessage(`Join code regenerated: ${updated.joinCode}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not regenerate join code.');
		} finally {
			setPendingAction(null);
		}
	}

	return (
		<div className="grid gap-5">
			{canManageLeague ? (
				<section className="rounded-lg border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-ink">League settings</h2>
							<p className="mt-1 text-sm text-slate-600">Manage the league details, joins, and public view.</p>
						</div>
						<StatusBadge label={`Join code ${league.joinCode}`} tone="good" />
					</div>
					<form className="mt-5 grid gap-4" onSubmit={saveSettings}>
						<div className="grid gap-4 md:grid-cols-2">
							<Field label="Name">
								<TextInput value={name} onChange={(event) => setName(event.target.value)} required />
							</Field>
							<Field label="Join mode">
								<SelectInput value={joinMode} onChange={(event) => setJoinMode(event.target.value)}>
									{joinModeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
								</SelectInput>
							</Field>
						</div>
						<Field label="Description">
							<TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
						</Field>
						<label className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
							<input type="checkbox" checked={publicViewEnabled} onChange={(event) => setPublicViewEnabled(event.target.checked)} />
							Anonymous public view enabled
						</label>
						<div className="flex flex-wrap justify-between gap-2">
							<Button type="button" variant="secondary" loading={pendingAction === 'join-code'} onClick={() => setIsRegenerateConfirmOpen(true)}>Regenerate join code</Button>
							<Button type="submit" icon={<Check size={16} />} loading={pendingAction === 'settings'} loadingLabel="Saving...">Save settings</Button>
						</div>
					</form>
				</section>
			) : null}
			<section className="rounded-lg border border-slate-200 bg-white p-5">
				<h2 className="text-lg font-bold text-ink">Pending approvals</h2>
				<div className="mt-4 grid gap-3">
					{pending.map((submission) => (
						<div key={submission.id} className="rounded-md border border-slate-200 p-3">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div>
									<p className="font-semibold text-ink">{submission.displayName}</p>
									<p className="text-sm text-slate-600">{submission.challengeName}: {submission.publicReason}</p>
								</div>
								<div className="flex gap-2">
									<Button variant="secondary" icon={<X size={16} />} loading={pendingAction === `${submission.id}:reject`} onClick={() => reject(submission)}>Reject</Button>
									<Button icon={<Check size={16} />} loading={pendingAction === `${submission.id}:approve`} onClick={() => approve(submission)}>Approve</Button>
								</div>
							</div>
						</div>
					))}
					{pending.length === 0 ? <p className="text-sm text-slate-600">No pending submissions.</p> : null}
				</div>
			</section>
			{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			<ConfirmationModal
				open={isRegenerateConfirmOpen}
				title="Regenerate join code?"
				description={<p>Existing shared links and join codes will stop working. Anyone with the old code will need the new one.</p>}
				confirmLabel="Regenerate code"
				variant="primary"
				loading={pendingAction === 'join-code'}
				onCancel={() => setIsRegenerateConfirmOpen(false)}
				onConfirm={async () => {
					await regenerateJoinCode();
					setIsRegenerateConfirmOpen(false);
				}}
			/>
		</div>
	);
}

export function MembersPage() {
	const { league, members, refreshMembers } = useWorkspace();
	const { user } = useAuthStore();
	const [displayName, setDisplayName] = useState('');
	const [emailAddress, setEmailAddress] = useState('');
	const [role, setRole] = useState('Participant');
	const [editingMember, setEditingMember] = useState<Member | null>(null);
	const [linkingMember, setLinkingMember] = useState<Member | null>(null);
	const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [pendingAction, setPendingAction] = useState<string | null>(null);
	const [confirmingRemoveMember, setConfirmingRemoveMember] = useState<Member | null>(null);
	const currentMember = members.find((member) => member.userId === user?.id);
	const isOwner = currentMember?.role === 'Owner';
	const canManageMembers = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
	const roleOptions = isOwner ? ['Participant', 'PointApprover', 'Admin', 'Owner'] : ['Participant', 'PointApprover', 'Admin'];
	const pointTotals = useMemo(() => new Map(leaderboard.map((row) => [row.leagueMemberId, row.approvedPoints])), [leaderboard]);

	async function refreshMemberData() {
		await Promise.all([
			refreshMembers(),
			leagueService.leaderboard(league.id).then(setLeaderboard)
		]);
	}

	useEffect(() => {
		leagueService.leaderboard(league.id).then(setLeaderboard).catch(() => setLeaderboard([]));
	}, [league.id]);

	async function addOfflineMember(event: FormEvent) {
		event.preventDefault();
		setError('');
		setMessage('');
		setPendingAction('add-member');
		try {
			await leagueService.addOfflineMember(league.id, { displayName, emailAddress, role });
			setDisplayName('');
			setEmailAddress('');
			setRole('Participant');
			setMessage('Offline member added.');
			await refreshMemberData();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not add member.');
		} finally {
			setPendingAction(null);
		}
	}

	async function changeRole(member: Member, nextRole: string) {
		setError('');
		setMessage('');
		setPendingAction(`${member.id}:role`);
		try {
			await leagueService.changeMemberRole(league.id, member.id, nextRole);
			setMessage('Role updated.');
			await refreshMemberData();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not update role.');
		} finally {
			setPendingAction(null);
		}
	}

	async function removeMember(member: Member) {
		setError('');
		setMessage('');
		setPendingAction(`${member.id}:remove`);
		try {
			await leagueService.removeMember(league.id, member.id);
			setMessage('Member removed.');
			await refreshMemberData();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not remove member.');
		} finally {
			setPendingAction(null);
		}
	}

	return (
		<div className="grid gap-5">
			{canManageMembers ? (
				<form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={addOfflineMember}>
					<h2 className="text-lg font-bold text-ink">Add offline member</h2>
					<p className="mt-1 text-sm text-slate-600">Use this for people who want to play without registering. They can be linked to an account later.</p>
					<div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto] md:items-end">
						<Field label="Display name">
							<TextInput value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
						</Field>
						<Field label="Email optional">
							<TextInput type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} />
						</Field>
						<Field label="Role">
							<SelectInput value={role} onChange={(event) => setRole(event.target.value)}>
								{roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
							</SelectInput>
						</Field>
						<Button type="submit" icon={<Plus size={16} />} loading={pendingAction === 'add-member'}>Add</Button>
					</div>
				</form>
			) : null}
			<section className="grid gap-3">
				<div>
					<h2 className="text-lg font-bold text-ink">Members</h2>
					<p className="text-sm text-slate-600">{members.length} people in this league.</p>
				</div>
				{members.map((member) => (
					<div key={member.id} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[minmax(0,1fr)_12rem_10rem_auto] xl:items-center">
						<div className="min-w-0">
							<p className="font-bold text-ink">{member.displayName}</p>
							<div className="mt-2 flex flex-wrap gap-2">
								<StatusBadge label={member.isOfflineMember ? 'Offline' : 'Registered'} tone={member.isOfflineMember ? 'warning' : 'good'} />
								<StatusBadge label={member.role} tone={member.role === 'Owner' ? 'good' : member.role === 'PointApprover' ? 'warning' : 'neutral'} />
								<StatusBadge label={`${pointTotals.get(member.id) ?? 0} pts`} />
							</div>
							{member.emailAddress ? <p className="mt-2 text-sm text-slate-600">{member.emailAddress}</p> : null}
						</div>
						{canManageMembers ? (
							<SelectInput value={member.role} onChange={(event) => changeRole(member, event.target.value)} disabled={pendingAction === `${member.id}:role` || (!isOwner && (member.role === 'Owner' || member.role === 'Admin'))}>
								{(roleOptions.includes(member.role) ? roleOptions : [member.role, ...roleOptions]).map((option) => <option key={option} value={option}>{option}</option>)}
							</SelectInput>
						) : (
							<StatusBadge label={member.role} tone={member.role === 'Owner' ? 'good' : member.role === 'PointApprover' ? 'warning' : 'neutral'} />
						)}
						{canManageMembers && member.isOfflineMember ? (
							<Button type="button" variant="secondary" onClick={() => setLinkingMember(member)}>Link account</Button>
						) : (
							<div className="hidden xl:block" />
						)}
						{canManageMembers ? (
							<div className="flex flex-wrap gap-2 xl:justify-end">
								<Button type="button" variant="secondary" icon={<Pencil size={16} />} disabled={!isOwner && (member.role === 'Owner' || member.role === 'Admin')} onClick={() => setEditingMember(member)}>Edit</Button>
								<Button
									type="button"
									variant="danger"
									icon={<Trash2 size={16} />}
									loading={pendingAction === `${member.id}:remove`}
									disabled={member.id === currentMember?.id || (!isOwner && (member.role === 'Owner' || member.role === 'Admin'))}
									onClick={() => setConfirmingRemoveMember(member)}
								>
									Remove
								</Button>
							</div>
						) : (
							<div className="hidden xl:block" />
						)}
					</div>
				))}
			</section>
			{editingMember ? (
				<EditMemberModal
					open={Boolean(editingMember)}
					league={league}
					member={editingMember}
					roleOptions={roleOptions}
					onClose={() => setEditingMember(null)}
					onSaved={async () => {
						setEditingMember(null);
						setMessage('Member updated.');
						await refreshMemberData();
					}}
				/>
			) : null}
			{linkingMember ? (
				<LinkOfflineMemberModal
					open
					league={league}
					member={linkingMember}
					points={pointTotals.get(linkingMember.id) ?? 0}
					onClose={() => setLinkingMember(null)}
					onSaved={async () => {
						setLinkingMember(null);
						setMessage('Offline member linked. Their points now belong to the registered member.');
						await refreshMemberData();
					}}
				/>
			) : null}
			{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			{confirmingRemoveMember ? (
				<ConfirmationModal
					open
					title="Remove member?"
					description={
						<p>
							Remove <span className="font-semibold text-ink">{confirmingRemoveMember.displayName}</span> from this league? Their existing point history will stay in the feed.
						</p>
					}
					confirmLabel="Remove member"
					loading={pendingAction === `${confirmingRemoveMember.id}:remove`}
					onCancel={() => setConfirmingRemoveMember(null)}
					onConfirm={async () => {
						await removeMember(confirmingRemoveMember);
						setConfirmingRemoveMember(null);
					}}
				/>
			) : null}
		</div>
	);
}

function EditMemberModal({
	open,
	league,
	member,
	roleOptions,
	onClose,
	onSaved
}: {
	open: boolean;
	league: League;
	member: Member;
	roleOptions: string[];
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}) {
	const [displayName, setDisplayName] = useState(member.displayName);
	const [emailAddress, setEmailAddress] = useState(member.emailAddress ?? '');
	const [role, setRole] = useState(member.role);
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setDisplayName(member.displayName);
		setEmailAddress(member.emailAddress ?? '');
		setRole(member.role);
		setError('');
	}, [member]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			await leagueService.updateMember(league.id, member.id, {
				displayName,
				emailAddress,
				role
			});
			await onSaved();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not update member.');
			setIsSubmitting(false);
		}
	}

	return (
		<Modal open={open} title="Edit member" description="Update this member's display details and league role." onClose={onClose}>
			<form className="grid gap-4" onSubmit={submit}>
				<Field label="Display name">
					<TextInput value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
				</Field>
				<Field label="Email optional">
					<TextInput type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} />
				</Field>
				<Field label="Role">
					<SelectInput value={role} onChange={(event) => setRole(event.target.value)}>
						{roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
					</SelectInput>
				</Field>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Check size={16} />} loading={isSubmitting} loadingLabel="Saving...">Save changes</Button>
				</div>
			</form>
		</Modal>
	);
}

function LinkOfflineMemberModal({
	open,
	league,
	member,
	points,
	onClose,
	onSaved
}: {
	open: boolean;
	league: League;
	member: Member;
	points: number;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}) {
	const [emailAddress, setEmailAddress] = useState(member.emailAddress ?? '');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setEmailAddress(member.emailAddress ?? '');
		setError('');
	}, [member]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			await leagueService.linkOfflineMember(league.id, member.id, emailAddress);
			await onSaved();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not link member.');
			setIsSubmitting(false);
		}
	}

	return (
		<Modal open={open} title="Link offline member" description={`Connect ${member.displayName} to a registered account.`} onClose={onClose}>
			<form className="grid gap-4" onSubmit={submit}>
				<div className="grid gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">
					<p><span className="font-semibold text-ink">Offline member:</span> {member.displayName}</p>
					<p><span className="font-semibold text-ink">Current points:</span> {points}</p>
					<p>If this email belongs to an existing member, their points and challenge history will be merged into that registered member.</p>
				</div>
				<Field label="Registered account email">
					<TextInput type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} required />
				</Field>
				{points !== 0 ? (
					<p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
						This member has {points} points. Linking will move those points to the registered account.
					</p>
				) : null}
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Check size={16} />} loading={isSubmitting} loadingLabel="Linking...">Link account</Button>
				</div>
			</form>
		</Modal>
	);
}

export function MySubmissionsPage() {
	const { league } = useWorkspace();
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsLoading(true);
		setError('');
		leagueService.mySubmissions(league.id)
			.then((items) => setSubmissions(items ?? []))
			.catch((err) => setError(err instanceof Error ? err.message : 'Could not load submissions.'))
			.finally(() => setIsLoading(false));
	}, [league.id]);

	return (
		<div className="grid gap-3">
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			{isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading submissions...</div> : null}
			{submissions.map((submission) => (
				<div key={submission.id} className="rounded-lg border border-slate-200 bg-white p-4">
					<div className="flex flex-wrap justify-between gap-2">
						<div>
							<h2 className="font-bold text-ink">{submission.challengeName}</h2>
							<p className="text-sm text-slate-600">{submission.publicReason}</p>
						</div>
						<StatusBadge label={submission.status} tone={submission.status === 'Approved' ? 'good' : submission.status === 'Rejected' ? 'bad' : 'warning'} />
					</div>
				</div>
			))}
			{submissions.length === 0 && !isLoading ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No submissions yet.</div> : null}
		</div>
	);
}

function AddPointsModal({
	open,
	league,
	members,
	currentMember,
	onClose,
	onSaved
}: {
	open: boolean;
	league: League;
	members: Member[];
	currentMember?: Member;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [selectedMemberId, setSelectedMemberId] = useState('');
	const [points, setPoints] = useState('10');
	const [reason, setReason] = useState('');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const appliesImmediately = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';

	useEffect(() => {
		if (open && members.length > 0 && !selectedMemberId) {
			setSelectedMemberId(members[0].id);
		}
	}, [open, members, selectedMemberId]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);

		try {
			const result = await leagueService.addPoints(league.id, {
				leagueMemberId: selectedMemberId,
				points: Number(points),
				reason
			});
			setReason('');
			onSaved();
			onClose();
			return result;
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not add points.');
			setIsSubmitting(false);
		}
	}

	return (
		<Modal
			open={open}
			title="Add points"
			description={appliesImmediately ? 'Award or deduct points directly from the official feed.' : 'Submit a point change for an admin or point approver to review.'}
			onClose={onClose}
		>
			<form className="grid gap-4" onSubmit={submit}>
				<div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
					<Field label="Person">
						<SelectInput value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} required>
							{members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
						</SelectInput>
					</Field>
					<Field label="Amount">
						<TextInput type="number" value={points} onChange={(event) => setPoints(event.target.value)} required />
					</Field>
				</div>
				<Field label="Reason">
					<TextArea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Won round one, late arrival, bonus..." required />
				</Field>
				<div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					Use positive numbers for awards and negative numbers for deductions. {appliesImmediately ? 'This will be applied immediately.' : 'This will appear in pending approvals.'}
				</div>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Plus size={16} />} loading={isSubmitting} loadingLabel={appliesImmediately ? 'Adding...' : 'Submitting...'} disabled={!selectedMemberId}>{appliesImmediately ? 'Add points' : 'Submit request'}</Button>
				</div>
			</form>
		</Modal>
	);
}

function EditPointsModal({
	open,
	league,
	members,
	item,
	onClose,
	onSaved
}: {
	open: boolean;
	league: League;
	members: Member[];
	item: PointsFeedItem;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}) {
	const [selectedMemberId, setSelectedMemberId] = useState(item.leagueMemberId);
	const [points, setPoints] = useState(String(item.points));
	const [reason, setReason] = useState(item.reason);
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setSelectedMemberId(item.leagueMemberId);
		setPoints(String(item.points));
		setReason(item.reason);
	}, [item]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			await leagueService.updatePoints(league.id, item.allocationId, {
				leagueMemberId: selectedMemberId,
				points: Number(points),
				reason
			});
			await onSaved();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not update points.');
			setIsSubmitting(false);
		}
	}

	return (
		<Modal open={open} title="Edit point entry" description="Correct the person, amount, or reason for this official feed entry." onClose={onClose}>
			<form className="grid gap-4" onSubmit={submit}>
				<div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
					<Field label="Person">
						<SelectInput value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} required>
							{members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
						</SelectInput>
					</Field>
					<Field label="Amount">
						<TextInput type="number" value={points} onChange={(event) => setPoints(event.target.value)} required />
					</Field>
				</div>
				<Field label="Reason">
					<TextArea value={reason} onChange={(event) => setReason(event.target.value)} required />
				</Field>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Check size={16} />} loading={isSubmitting} loadingLabel="Saving...">Save changes</Button>
				</div>
			</form>
		</Modal>
	);
}

function CreateChallengeModal({
	open,
	league,
	members,
	onClose,
	onSaved
}: {
	open: boolean;
	league: League;
	members: Member[];
	onClose: () => void;
	onSaved: () => void;
}) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [targetMemberIds, setTargetMemberIds] = useState<string[]>([]);
	const [pointsForSuccess, setPointsForSuccess] = useState('10');
	const [pointsForFailure, setPointsForFailure] = useState('-10');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	function toggleTarget(memberId: string) {
		setTargetMemberIds((current) =>
			current.includes(memberId)
				? current.filter((id) => id !== memberId)
				: [...current, memberId]
		);
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);

		try {
			await leagueService.createChallenge(league.id, {
				name,
				description,
				targetMemberIds,
				pointsForSuccess: Number(pointsForSuccess),
				pointsForFailure: Number(pointsForFailure)
			});
			setName('');
			setDescription('');
			setTargetMemberIds([]);
			onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not create challenge.');
			setIsSubmitting(false);
		}
	}

	return (
		<Modal
			open={open}
			title="Create challenge"
			description="Set a player-to-player dare, who it is aimed at, and the reward or rejection penalty."
			onClose={onClose}
		>
			<form className="grid gap-4" onSubmit={submit}>
				<Field label="Title">
					<TextInput value={name} onChange={(event) => setName(event.target.value)} required />
				</Field>
				<Field label="Description">
					<TextArea value={description} onChange={(event) => setDescription(event.target.value)} required />
				</Field>
				<div className="grid gap-2">
					<p className="text-sm font-medium text-slate-700">Aimed at</p>
					<div className="grid max-h-48 gap-2 overflow-auto rounded-md border border-slate-200 p-2">
						{members.map((member) => (
							<label key={member.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
								<input type="checkbox" checked={targetMemberIds.includes(member.id)} onChange={() => toggleTarget(member.id)} />
								{member.displayName}
							</label>
						))}
					</div>
				</div>
				<div className="grid min-w-0 gap-4 sm:grid-cols-2">
					<Field label="Points for completion">
						<TextInput type="number" value={pointsForSuccess} onChange={(event) => setPointsForSuccess(event.target.value)} required />
					</Field>
					<Field label="Points lost for rejection">
						<TextInput type="number" value={pointsForFailure} onChange={(event) => setPointsForFailure(event.target.value)} required />
					</Field>
				</div>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Plus size={16} />} loading={isSubmitting} loadingLabel="Creating..." disabled={targetMemberIds.length === 0}>Create challenge</Button>
				</div>
			</form>
		</Modal>
	);
}

function EditChallengeModal({
	open,
	league,
	members,
	challenge,
	onClose,
	onSaved
}: {
	open: boolean;
	league: League;
	members: Member[];
	challenge: Challenge;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}) {
	const [name, setName] = useState(challenge.name);
	const [description, setDescription] = useState(challenge.description ?? '');
	const [targetMemberIds, setTargetMemberIds] = useState<string[]>(challenge.targetMemberIds);
	const [pointsForSuccess, setPointsForSuccess] = useState(String(challenge.pointsForSuccess));
	const [pointsForFailure, setPointsForFailure] = useState(String(challenge.pointsForFailure));
	const [isActive, setIsActive] = useState(challenge.isActive);
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setName(challenge.name);
		setDescription(challenge.description ?? '');
		setTargetMemberIds(challenge.targetMemberIds);
		setPointsForSuccess(String(challenge.pointsForSuccess));
		setPointsForFailure(String(challenge.pointsForFailure));
		setIsActive(challenge.isActive);
	}, [challenge]);

	function toggleTarget(memberId: string) {
		setTargetMemberIds((current) =>
			current.includes(memberId)
				? current.filter((id) => id !== memberId)
				: [...current, memberId]
		);
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			await leagueService.updateChallenge(league.id, challenge.id, {
				name,
				description,
				targetMemberIds,
				pointsForSuccess: Number(pointsForSuccess),
				pointsForFailure: Number(pointsForFailure),
				isActive
			});
			await onSaved();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not update challenge.');
			setIsSubmitting(false);
		}
	}

	return (
		<Modal open={open} title="Edit challenge" description="Update the challenge details, targets, points, or visibility." onClose={onClose}>
			<form className="grid gap-4" onSubmit={submit}>
				<Field label="Title">
					<TextInput value={name} onChange={(event) => setName(event.target.value)} required />
				</Field>
				<Field label="Description">
					<TextArea value={description} onChange={(event) => setDescription(event.target.value)} required />
				</Field>
				<div className="grid gap-2">
					<p className="text-sm font-medium text-slate-700">Aimed at</p>
					<div className="grid max-h-48 gap-2 overflow-auto rounded-md border border-slate-200 p-2">
						{members.map((member) => (
							<label key={member.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
								<input type="checkbox" checked={targetMemberIds.includes(member.id)} onChange={() => toggleTarget(member.id)} />
								{member.displayName}
							</label>
						))}
					</div>
				</div>
				<div className="grid min-w-0 gap-4 sm:grid-cols-2">
					<Field label="Points for completion">
						<TextInput type="number" value={pointsForSuccess} onChange={(event) => setPointsForSuccess(event.target.value)} required />
					</Field>
					<Field label="Points lost for rejection">
						<TextInput type="number" value={pointsForFailure} onChange={(event) => setPointsForFailure(event.target.value)} required />
					</Field>
				</div>
				<label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
					<input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
					Active challenge
				</label>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Check size={16} />} loading={isSubmitting} loadingLabel="Saving..." disabled={targetMemberIds.length === 0}>Save changes</Button>
				</div>
			</form>
		</Modal>
	);
}

function ShareLeagueModal({ open, league, onClose }: { open: boolean; league: League; onClose: () => void }) {
	const [message, setMessage] = useState('');
	const shareUrl = typeof window === 'undefined'
		? `/view/${league.joinCode}`
		: `${window.location.origin}/view/${league.joinCode}`;
	const shareText = `View ${league.name} on The League`;
	const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${shareUrl}`)}`;
	const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Use this link to view the league:\n\n${shareUrl}\n\nJoin code: ${league.joinCode}`)}`;

	async function copyLink() {
		setMessage('');
		try {
			await navigator.clipboard.writeText(shareUrl);
			setMessage('Link copied.');
		} catch {
			setMessage('Copy failed. Select the link and copy it manually.');
		}
	}

	return (
		<Modal
			open={open}
			title="Share league"
			description="Send a view-only link. People can see the league without signing in, but cannot take actions."
			onClose={onClose}
		>
			<div className="grid gap-4">
				<Field label="Share link">
					<TextInput value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
				</Field>
				<div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					Join code: <span className="font-bold text-ink">{league.joinCode}</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<Button type="button" variant="secondary" icon={<Copy size={16} />} onClick={copyLink}>Copy link</Button>
					<a href={whatsappUrl} target="_blank" rel="noreferrer">
						<Button type="button" variant="secondary" icon={<MessageCircle size={16} />} className="w-full">WhatsApp</Button>
					</a>
					<a href={emailUrl}>
						<Button type="button" variant="secondary" icon={<Mail size={16} />} className="w-full">Email</Button>
					</a>
				</div>
				{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
				<div className="flex justify-end">
					<Button type="button" onClick={onClose}>Done</Button>
				</div>
			</div>
		</Modal>
	);
}

function getChallengeStatus(challenge: Challenge, memberId?: string) {
	if (!memberId || !challenge.targetMemberIds.includes(memberId)) {
		return 'Open';
	}

	if (challenge.completedMemberIds.includes(memberId)) {
		return 'Completed';
	}

	if (challenge.failedMemberIds.includes(memberId)) {
		return 'Failed';
	}

	if (challenge.rejectedMemberIds.includes(memberId)) {
		return 'Rejected';
	}

	if (challenge.acceptedMemberIds.includes(memberId)) {
		return 'Accepted';
	}

	return 'Open';
}

function getChallengeOutcomes(challenge: Challenge) {
	if (Array.isArray(challenge.outcomes)) {
		return challenge.outcomes;
	}

	return challenge.targetMemberIds.map((memberId, index) => ({
		leagueMemberId: memberId,
		displayName: challenge.targetNames[index] ?? 'Unknown member',
		status: getChallengeStatus(challenge, memberId),
		awardedAt: null,
		awardedByName: null,
		points: null
	}));
}

function LeaderboardLine({ row }: { row: LeaderboardRow }) {
	return (
		<div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
			<span className="font-semibold text-ink">#{row.position} {row.displayName}</span>
			<span className="font-bold">{row.approvedPoints} pts</span>
		</div>
	);
}

function PointDetailModal({ item, onClose }: { item: PointsFeedItem; onClose: () => void }) {
	const positive = item.points >= 0;
	return (
		<Modal
			open
			title={`${item.displayName} ${positive ? 'earned' : 'lost'} ${Math.abs(item.points)} points`}
			description={getFeedAttribution(item)}
			onClose={onClose}
		>
			<div className="grid gap-4">
				<div className="grid gap-3 sm:grid-cols-2">
					<div className={positive ? 'rounded-md bg-emerald-50 p-3' : 'rounded-md bg-red-50 p-3'}>
						<p className={positive ? 'text-xs font-bold uppercase text-emerald-800' : 'text-xs font-bold uppercase text-red-800'}>Points</p>
						<p className={positive ? 'mt-1 text-3xl font-bold text-emerald-900' : 'mt-1 text-3xl font-bold text-red-900'}>{positive ? '+' : ''}{item.points}</p>
					</div>
					<div className="rounded-md bg-slate-50 p-3">
						<p className="text-xs font-bold uppercase text-slate-500">Source</p>
						<p className="mt-1 font-bold text-ink">{formatPointSource(item.source)}</p>
						<p className="mt-1 text-sm text-slate-600">{item.challengeName ?? 'Manual points'}</p>
					</div>
				</div>
				<div>
					<p className="text-sm font-bold text-ink">Reason</p>
					<p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{item.reason}</p>
				</div>
				<div className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					<p><span className="font-semibold text-ink">Member:</span> {item.displayName}</p>
					<p><span className="font-semibold text-ink">{getAttributionLabel(item)}:</span> {item.awardedByName}</p>
					<p><span className="font-semibold text-ink">Date:</span> {new Date(item.awardedAt).toLocaleString()}</p>
				</div>
				<div className="flex justify-end">
					<Button type="button" onClick={onClose}>Done</Button>
				</div>
			</div>
		</Modal>
	);
}

function FeedLine({ item, actions, onOpen }: { item: PointsFeedItem; actions?: ReactNode; onOpen?: () => void }) {
	const positive = item.points >= 0;
	return (
		<article
			className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-ink/30 hover:shadow-sm"
			onClick={onOpen}
			role={onOpen ? 'button' : undefined}
			tabIndex={onOpen ? 0 : undefined}
			onKeyDown={(event) => {
				if (onOpen && (event.key === 'Enter' || event.key === ' ')) {
					onOpen();
				}
			}}
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-bold text-ink">{item.displayName} {positive ? 'earned' : 'lost'} {Math.abs(item.points)} points</p>
					<p className="text-sm text-slate-600">{item.reason}</p>
					<p className="mt-1 text-xs text-slate-500">{getFeedAttribution(item)}</p>
				</div>
				<div className="flex items-center gap-2">
					<StatusBadge label={`${positive ? '+' : ''}${item.points}`} tone={positive ? 'good' : 'bad'} />
					{actions ? <span onClick={(event) => event.stopPropagation()}>{actions}</span> : null}
				</div>
			</div>
		</article>
	);
}

function getFeedAttribution(item: PointsFeedItem) {
	const source = formatPointSource(item.source);
	const context = item.challengeName ?? 'Manual points';
	return `${context} · ${source} · ${getAttributionLabel(item)} ${item.awardedByName}`;
}

function getAttributionLabel(item: PointsFeedItem) {
	if (item.source === 'ApprovedSubmission') {
		return 'Requested by';
	}

	if (item.source === 'Adjustment') {
		return 'Adjusted by';
	}

	if (item.challengeName) {
		return 'Confirmed by';
	}

	if (item.source === 'AdminAward' || item.source === 'AdminPenalty') {
		return 'Created by';
	}

	return 'Recorded by';
}

function formatPointSource(source: string) {
	return source
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/^Admin /, '')
		.trim();
}
