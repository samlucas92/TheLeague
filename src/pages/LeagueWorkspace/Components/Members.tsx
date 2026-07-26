import { FormEvent, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, SelectInput, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import { leagueService } from '../../../services/leagueService';
import type { League, Member } from '../../../services/types';

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
