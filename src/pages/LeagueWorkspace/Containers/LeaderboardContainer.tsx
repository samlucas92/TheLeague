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
			<section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
				<table className="min-w-[34rem] w-full text-left text-sm">
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
