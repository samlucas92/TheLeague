import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pencil, Plus, Send, Share2, Trash2, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Field, SelectInput, TextArea, TextInput } from '../../components/FormField';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { leagueService } from '../../services/leagueService';
import type { Challenge, LeagueAuditItem, LeaderboardRow, Member, PointsFeedItem, Submission } from '../../services/types';
import { useAuthStore } from '../../store/authStore';
import { EditChallengeModal, EditMemberModal, EditPointsModal, EmptyState, FeedLine, formatAuditAction, formatPointSource, getAuditTone, getChallengeOutcomes, getChallengeStatus, LeaderboardLine, LinkOfflineMemberModal, PointDetailModal } from './Components';
import { useWorkspace } from './context';

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
				{rows.length === 0 && !isLoading ? (
					<div className="border-t border-slate-100 p-8 text-center">
						<h2 className="text-lg font-bold text-ink">No leaderboard yet</h2>
						<p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Approved points will rank members here. Add points or approve submissions to build the board.</p>
					</div>
				) : null}
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
				{items.length === 0 && !isLoading ? (
					<EmptyState
						title="No official points yet"
						description="Add a manual points entry or approve a request. Every confirmed change will appear here."
						actions={<Button type="button" icon={<Plus size={16} />} onClick={openAddPointsModal}>Add points</Button>}
					/>
				) : null}
				{items.length > 0 && filteredItems.length === 0 && !isLoading ? (
					<EmptyState title="No points match those filters" description="Clear or change the filters to see more entries." />
				) : null}
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
				{challenges.length === 0 && !isLoading ? (
					<EmptyState
						title="No challenges yet"
						description="Create a side challenge for one or more members. Targets can accept or reject, then completion can be marked later."
						actions={<Button type="button" icon={<Plus size={16} />} onClick={openCreateChallengeModal}>Create challenge</Button>}
					/>
				) : null}
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
	const [audit, setAudit] = useState<LeagueAuditItem[]>([]);
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
		const [pendingItems, auditItems] = await Promise.all([
			leagueService.pendingSubmissions(league.id),
			leagueService.audit(league.id)
		]);
		setPending(pendingItems ?? []);
		setAudit(auditItems ?? []);
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
					{pending.length === 0 ? <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">No pending submissions. Point requests that need review will appear here.</p> : null}
					</div>
				</section>
				<section className="rounded-lg border border-slate-200 bg-white p-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-ink">Recent activity</h2>
							<p className="mt-1 text-sm text-slate-600">Admin-visible history of league changes and scoring actions.</p>
						</div>
						<StatusBadge label={`${audit.length} events`} />
					</div>
					<div className="mt-4 grid gap-3">
						{audit.map((entry) => (
							<article key={entry.id} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<StatusBadge label={formatAuditAction(entry.action)} tone={getAuditTone(entry.action)} />
										<p className="text-sm font-semibold text-ink">{entry.performedByName}</p>
									</div>
									<p className="mt-1 text-sm text-slate-700">{entry.summary}</p>
									<p className="mt-1 text-xs text-slate-500">{entry.entityType}</p>
								</div>
								<p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
							</article>
						))}
						{audit.length === 0 ? <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">No activity recorded yet. Settings changes, scoring actions, and member updates will appear here.</p> : null}
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
				{members.length <= 1 ? (
					<EmptyState
						title="Invite the group"
						description="Share the join code with registered players, or add offline members for people who do not want to sign up yet."
						actions={canManageMembers ? <Button type="button" variant="secondary" icon={<Share2 size={16} />} onClick={() => navigator.clipboard?.writeText(league.joinCode)}>Copy join code</Button> : undefined}
					/>
				) : null}
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

