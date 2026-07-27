import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pencil, Plus, Send, Share2, Trash2, X } from 'lucide-react';
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
				<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
					<div>
						<h2 className="text-lg font-bold text-ink">Challenges</h2>
						<p className="text-sm text-slate-600">Player-to-player dares with rewards for success and penalties for refusal.</p>
					</div>
					<div className="grid grid-cols-[auto_1fr] items-center gap-2 sm:flex">
						<StatusBadge label={`Page ${page} of ${totalPages}`} />
						<Button type="button" className="w-full sm:w-auto" icon={<Plus size={16} />} onClick={openCreateChallengeModal}>Create challenge</Button>
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
							<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
								<div className="min-w-0">
									<h3 className="font-bold text-ink">{challenge.name}</h3>
									<p className="mt-1 overflow-hidden text-sm leading-6 text-slate-600 [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
										{challenge.description || 'No description yet.'}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
					<div className="grid grid-cols-2 items-center gap-3 sm:flex sm:justify-between">
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
