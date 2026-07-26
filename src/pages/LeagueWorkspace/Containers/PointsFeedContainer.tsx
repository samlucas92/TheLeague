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
