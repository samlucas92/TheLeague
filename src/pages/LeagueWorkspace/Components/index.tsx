import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Check, Copy, Mail, MessageCircle, Plus, Send, X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, SelectInput, TextArea, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { leagueService } from '../../../services/leagueService';
import type { Challenge, League, LeaderboardRow, Member, PointsFeedItem } from '../../../services/types';

export function EditMemberModal({
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



export function LinkOfflineMemberModal({
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



export function AddPointsModal({
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



export function EditPointsModal({
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



export function CreateChallengeModal({
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



export function EditChallengeModal({
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



export function ShareLeagueModal({ open, league, onClose }: { open: boolean; league: League; onClose: () => void }) {
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



export function getChallengeStatus(challenge: Challenge, memberId?: string) {
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



export function getChallengeOutcomes(challenge: Challenge) {
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



export function LeaderboardLine({ row }: { row: LeaderboardRow }) {
	return (
		<div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
			<span className="font-semibold text-ink">#{row.position} {row.displayName}</span>
			<span className="font-bold">{row.approvedPoints} pts</span>
		</div>
	);
}



export function PointDetailModal({ item, onClose }: { item: PointsFeedItem; onClose: () => void }) {
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



export function FeedLine({ item, actions, onOpen }: { item: PointsFeedItem; actions?: ReactNode; onOpen?: () => void }) {
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



export function getFeedAttribution(item: PointsFeedItem) {
	const source = formatPointSource(item.source);
	const context = item.challengeName ?? 'Manual points';
	return `${context} · ${source} · ${getAttributionLabel(item)} ${item.awardedByName}`;
}



export function formatAuditAction(action: string) {
	return action
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.trim();
}



export function getAuditTone(action: string): 'neutral' | 'good' | 'warning' | 'bad' {
	if (action.includes('Deleted') || action.includes('Removed') || action.includes('Rejected') || action.includes('Deducted') || action.includes('Failed')) {
		return 'bad';
	}

	if (action.includes('Created') || action.includes('Approved') || action.includes('Awarded') || action.includes('Completed') || action.includes('Linked') || action.includes('Joined')) {
		return 'good';
	}

	if (action.includes('Changed') || action.includes('Edited') || action.includes('Regenerated') || action.includes('Updated') || action.includes('Requested')) {
		return 'warning';
	}

	return 'neutral';
}



export function getAttributionLabel(item: PointsFeedItem) {
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



export function formatPointSource(source: string) {
	return source
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/^Admin /, '')
		.trim();
}


export function EmptyState({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
	return (
		<div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
			<h2 className="text-lg font-bold text-ink">{title}</h2>
			<p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
			{actions ? <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div> : null}
		</div>
	);
}
