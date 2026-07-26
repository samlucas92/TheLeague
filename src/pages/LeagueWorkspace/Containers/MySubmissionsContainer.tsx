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

export function MySubmissionsPage() {
	const { league } = useWorkspace();
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		setIsLoading(true);
		setError('');
		leagueService.mySubmissions(league.id)
			.then((items) => setSubmissions(items ?? []))
			.catch((err) => setError(err instanceof Error ? err.message : 'Could not load submissions.'))
			.finally(() => setIsLoading(false));
	}, [league.id]);

	return (
		<div className="grid gap-3">
			{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			{isLoading ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading submissions...</div> : null}
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
			{submissions.length === 0 && !isLoading ? <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No submissions yet.</div> : null}
		</div>
	);
}
