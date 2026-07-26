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
