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
						<Button type="submit" className="w-full md:w-auto" icon={<Plus size={16} />} loading={pendingAction === 'add-member'}>Add</Button>
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
							<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
								<Button type="button" className="w-full sm:w-auto" variant="secondary" icon={<Pencil size={16} />} disabled={!isOwner && (member.role === 'Owner' || member.role === 'Admin')} onClick={() => setEditingMember(member)}>Edit</Button>
								<Button
									type="button"
									className="w-full sm:w-auto"
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
