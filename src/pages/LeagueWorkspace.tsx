import { FormEvent, useEffect, useState } from 'react';
import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { Check, Copy, Mail, MessageCircle, Plus, Send, Share2, X } from 'lucide-react';
import { Button } from '../components/Button';
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

	async function refreshMembers() {
		if (leagueId) {
			setMembers(await leagueService.members(leagueId));
		}
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

	useEffect(() => {
		Promise.all([leagueService.leaderboard(league.id), leagueService.pointsFeed(league.id)]).then(([rows, items]) => {
			setLeaderboard(rows.slice(0, 3));
			setFeed(items.slice(0, 5));
		});
	}, [league.id, dataVersion]);

	return (
		<div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
			<section className="rounded-lg border border-slate-200 bg-white p-5">
				<h2 className="text-lg font-bold text-ink">Top participants</h2>
				<div className="mt-4 grid gap-2">
					{leaderboard.map((row) => <LeaderboardLine key={row.leagueMemberId} row={row} />)}
					{leaderboard.length === 0 ? <p className="text-sm text-slate-600">No approved points yet.</p> : null}
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
					{feed.map((item) => <FeedLine key={item.allocationId} item={item} />)}
					{feed.length === 0 ? <p className="text-sm text-slate-600">The points feed is waiting for its first approval.</p> : null}
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

	useEffect(() => {
		leagueService.leaderboard(league.id).then(setRows);
	}, [league.id]);

	return (
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
		</section>
	);
}

export function PointsFeedPage() {
	const { league, dataVersion, openAddPointsModal } = useWorkspace();
	const [items, setItems] = useState<PointsFeedItem[]>([]);

	useEffect(() => {
		leagueService.pointsFeed(league.id).then(setItems);
	}, [league.id, dataVersion]);

	return (
		<div className="grid gap-5">
			<section className="grid gap-3">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h2 className="text-lg font-bold text-ink">Points Feed</h2>
						<p className="text-sm text-slate-600">Every official score change appears here.</p>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge label={`${items.length} entries`} />
						<Button type="button" icon={<Plus size={16} />} onClick={openAddPointsModal}>Add points</Button>
					</div>
				</div>
				{items.map((item) => <FeedLine key={item.allocationId} item={item} />)}
				{items.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No official points yet.</div> : null}
			</section>
		</div>
	);
}

export function ChallengesPage() {
	const { league, members, dataVersion, openCreateChallengeModal } = useWorkspace();
	const { user } = useAuthStore();
	const [challenges, setChallenges] = useState<Challenge[]>([]);
	const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
	const [page, setPage] = useState(1);
	const [message, setMessage] = useState('');
	const currentMember = members.find((member) => member.userId === user?.id);
	const pageSize = 5;
	const totalPages = Math.max(1, Math.ceil(challenges.length / pageSize));
	const pagedChallenges = challenges.slice((page - 1) * pageSize, page * pageSize);

	async function refreshChallenges() {
		setChallenges(await leagueService.challenges(league.id));
	}

	useEffect(() => {
		refreshChallenges();
	}, [league.id, dataVersion]);

	async function respond(challenge: Challenge, action: 'accept' | 'reject' | 'complete' | 'fail') {
		if (action === 'accept') {
			await leagueService.acceptChallenge(league.id, challenge.id);
			setMessage('Challenge accepted.');
		} else if (action === 'reject') {
			await leagueService.rejectChallenge(league.id, challenge.id);
			setMessage('Challenge rejected and penalty applied.');
		} else if (action === 'complete') {
			await leagueService.completeChallenge(league.id, challenge.id);
			setMessage('Challenge completed and points awarded.');
		} else {
			await leagueService.failChallenge(league.id, challenge.id);
			setMessage('Challenge failed and penalty applied.');
		}
		setSelectedChallenge(null);
		await refreshChallenges();
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
				{pagedChallenges.map((challenge) => {
					const status = getChallengeStatus(challenge, currentMember?.id);
					return (
						<button
							key={challenge.id}
							className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-ink/30 hover:shadow-md"
							onClick={() => setSelectedChallenge(challenge)}
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0">
									<h3 className="font-bold text-ink">{challenge.name}</h3>
									<p className="mt-1 overflow-hidden text-sm leading-6 text-slate-600 [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
										{challenge.description || 'No description yet.'}
									</p>
								</div>
								<StatusBadge label={status} tone={status === 'Rejected' || status === 'Failed' ? 'bad' : status === 'Accepted' || status === 'Completed' ? 'good' : 'warning'} />
							</div>
							<div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
								<span className="rounded bg-slate-100 px-2 py-1">Aimed at {challenge.targetNames.join(', ')}</span>
								<span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">+{challenge.pointsForSuccess} if completed</span>
								<span className="rounded bg-red-100 px-2 py-1 text-red-800">{challenge.pointsForFailure} if rejected</span>
							</div>
						</button>
					);
				})}
				{challenges.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No challenges yet.</div> : null}
				{challenges.length > pageSize ? (
					<div className="flex items-center justify-between">
						<Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button>
						<Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</Button>
					</div>
				) : null}
			</section>
			{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
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

				return (
					<Modal
						open
						title={selectedChallenge.name}
						description={`Aimed at ${selectedChallenge.targetNames.join(', ')}`}
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
											<Button type="button" variant="secondary" onClick={() => respond(selectedChallenge, 'reject')} icon={<X size={16} />}>Reject</Button>
											<Button type="button" onClick={() => respond(selectedChallenge, 'accept')} icon={<Check size={16} />}>Accept</Button>
										</div>
									) : null}
									{selectedChallenge.acceptedMemberIds.includes(memberId) && !hasOutcome ? (
										<div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
											<Button type="button" variant="secondary" onClick={() => respond(selectedChallenge, 'fail')} icon={<X size={16} />}>Mark failed</Button>
											<Button type="button" onClick={() => respond(selectedChallenge, 'complete')} icon={<Check size={16} />}>Mark completed</Button>
										</div>
									) : null}
								</div>
							) : (
								<p className="mt-5 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">Only challenged players can action this challenge.</p>
							)}
						</div>
					</Modal>
				);
			})() : null}
		</div>
	);
}

export function AdminPage() {
	const { league } = useWorkspace();
	const [pending, setPending] = useState<Submission[]>([]);
	const [message, setMessage] = useState('');

	async function refresh() {
		setPending(await leagueService.pendingSubmissions(league.id));
	}

	useEffect(() => {
		refresh();
	}, [league.id]);

	async function approve(submission: Submission) {
		await leagueService.approveSubmission(league.id, submission.id, {
			approvedPoints: submission.requestedPoints,
			publicReviewReason: submission.publicReason
		});
		setMessage('Submission approved and allocated.');
		await refresh();
	}

	return (
		<div className="grid gap-5">
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
								<Button icon={<Check size={16} />} onClick={() => approve(submission)}>Approve</Button>
							</div>
						</div>
					))}
					{pending.length === 0 ? <p className="text-sm text-slate-600">No pending submissions.</p> : null}
				</div>
			</section>
			{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
		</div>
	);
}

export function MembersPage() {
	const { league, members, refreshMembers } = useWorkspace();
	const { user } = useAuthStore();
	const [displayName, setDisplayName] = useState('');
	const [emailAddress, setEmailAddress] = useState('');
	const [role, setRole] = useState('Participant');
	const [linkEmails, setLinkEmails] = useState<Record<string, string>>({});
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const currentMember = members.find((member) => member.userId === user?.id);
	const canManageMembers = currentMember?.role === 'Owner' || currentMember?.role === 'Admin';
	const roleOptions = ['Participant', 'PointApprover', 'Admin', 'Owner'];

	async function addOfflineMember(event: FormEvent) {
		event.preventDefault();
		setError('');
		setMessage('');
		try {
			await leagueService.addOfflineMember(league.id, { displayName, emailAddress, role });
			setDisplayName('');
			setEmailAddress('');
			setRole('Participant');
			setMessage('Offline member added.');
			await refreshMembers();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not add member.');
		}
	}

	async function changeRole(member: Member, nextRole: string) {
		setError('');
		setMessage('');
		try {
			await leagueService.changeMemberRole(league.id, member.id, nextRole);
			setMessage('Role updated.');
			await refreshMembers();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not update role.');
		}
	}

	async function linkMember(member: Member) {
		setError('');
		setMessage('');
		try {
			await leagueService.linkOfflineMember(league.id, member.id, linkEmails[member.id] ?? '');
			setMessage('Offline member linked. Their points now belong to the registered member.');
			await refreshMembers();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not link member.');
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
						<Button type="submit" icon={<Plus size={16} />}>Add</Button>
					</div>
				</form>
			) : null}
			<section className="grid gap-3">
				<div>
					<h2 className="text-lg font-bold text-ink">Members</h2>
					<p className="text-sm text-slate-600">{members.length} people in this league.</p>
				</div>
				{members.map((member) => (
					<div key={member.id} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_14rem_minmax(0,24rem)] lg:items-center">
						<div className="min-w-0">
							<p className="font-bold text-ink">{member.displayName}</p>
							<p className="text-sm text-slate-600">
								{member.isOfflineMember ? 'Offline member' : 'Registered member'}
								{member.emailAddress ? ` · ${member.emailAddress}` : ''}
							</p>
						</div>
						{canManageMembers ? (
							<SelectInput value={member.role} onChange={(event) => changeRole(member, event.target.value)}>
								{roleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
							</SelectInput>
						) : (
							<StatusBadge label={member.role} tone={member.role === 'Owner' ? 'good' : member.role === 'PointApprover' ? 'warning' : 'neutral'} />
						)}
						{canManageMembers && member.isOfflineMember ? (
							<div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
								<TextInput
									type="email"
									placeholder="Registered email to link"
									value={linkEmails[member.id] ?? ''}
									onChange={(event) => setLinkEmails((current) => ({ ...current, [member.id]: event.target.value }))}
								/>
								<Button type="button" variant="secondary" onClick={() => linkMember(member)}>Link</Button>
							</div>
						) : (
							<div className="hidden lg:block" />
						)}
					</div>
				))}
			</section>
			{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
		</div>
	);
}

export function MySubmissionsPage() {
	const { league } = useWorkspace();
	const [submissions, setSubmissions] = useState<Submission[]>([]);

	useEffect(() => {
		leagueService.mySubmissions(league.id).then(setSubmissions);
	}, [league.id]);

	return (
		<div className="grid gap-3">
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
			{submissions.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No submissions yet.</div> : null}
		</div>
	);
}

function AddPointsModal({
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
	const [selectedMemberId, setSelectedMemberId] = useState('');
	const [points, setPoints] = useState('10');
	const [reason, setReason] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		if (open && members.length > 0 && !selectedMemberId) {
			setSelectedMemberId(members[0].id);
		}
	}, [open, members, selectedMemberId]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');

		try {
			await leagueService.addPoints(league.id, {
				leagueMemberId: selectedMemberId,
				points: Number(points),
				reason
			});
			setReason('');
			onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not add points.');
		}
	}

	return (
		<Modal
			open={open}
			title="Add points"
			description="Award or deduct points directly from the official feed."
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
				<div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">Use positive numbers for awards and negative numbers for deductions.</div>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Plus size={16} />} disabled={!selectedMemberId}>Add points</Button>
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
					<Button type="submit" icon={<Plus size={16} />} disabled={targetMemberIds.length === 0}>Create challenge</Button>
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

function LeaderboardLine({ row }: { row: LeaderboardRow }) {
	return (
		<div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
			<span className="font-semibold text-ink">#{row.position} {row.displayName}</span>
			<span className="font-bold">{row.approvedPoints} pts</span>
		</div>
	);
}

function FeedLine({ item }: { item: PointsFeedItem }) {
	const positive = item.points >= 0;
	return (
		<article className="rounded-lg border border-slate-200 bg-white p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-bold text-ink">{item.displayName} {positive ? 'earned' : 'lost'} {Math.abs(item.points)} points</p>
					<p className="text-sm text-slate-600">{item.reason}</p>
					<p className="mt-1 text-xs text-slate-500">{item.challengeName ?? item.source} · Awarded by {item.awardedByName}</p>
				</div>
				<StatusBadge label={`${positive ? '+' : ''}${item.points}`} tone={positive ? 'good' : 'bad'} />
			</div>
		</article>
	);
}
