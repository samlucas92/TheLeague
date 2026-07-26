import { FormEvent, useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, TextArea, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import { leagueService } from '../../../services/leagueService';
import type { Challenge, League, Member } from '../../../services/types';

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
