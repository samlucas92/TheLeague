import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Check, Plus, Send, X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, SelectInput, TextArea, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { leagueService } from '../../../services/leagueService';
import type { League, Member, PointsFeedItem } from '../../../services/types';

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
			<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
				<div className="min-w-0">
					<p className="font-bold text-ink">{item.displayName} {positive ? 'earned' : 'lost'} {Math.abs(item.points)} points</p>
					<p className="text-sm text-slate-600">{item.reason}</p>
					<p className="mt-1 text-xs text-slate-500">{getFeedAttribution(item)}</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
