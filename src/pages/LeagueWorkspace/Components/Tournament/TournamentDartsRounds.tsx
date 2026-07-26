import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../../../../components/Button';
import { Field, TextInput } from '../../../../components/FormField';
import { leagueService } from '../../../../services/leagueService';
import type { Tournament } from '../../../../services/types';
import { PlayerStanding } from './Shared';

export function DartsPanel({ leagueId, tournament, activeRound, canManage, memberNames, onChanged }: { leagueId: string; tournament: Tournament; activeRound: Tournament['rounds'][number] | undefined; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void> }) {
	const [scores, setScores] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setScores(Object.fromEntries((activeRound?.scores ?? []).map((score) => [score.leagueMemberId, score.score?.toString() ?? ''])));
	}, [activeRound]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setIsSubmitting(true);
		await leagueService.scoreTournamentRound(leagueId, tournament.id, Object.fromEntries(Object.entries(scores).map(([memberId, score]) => [memberId, Number(score)])));
		await onChanged();
		setIsSubmitting(false);
	}

	return (
		<div className="grid gap-4 rounded-lg border border-slate-200 p-4">
			<div className="grid gap-2 sm:grid-cols-2">
				{tournament.participants.map((participant) => (
					<PlayerStanding key={participant.leagueMemberId} participant={participant} />
				))}
			</div>
			{canManage && activeRound && tournament.status !== 'Completed' ? (
				<form className="grid gap-3 rounded-md bg-slate-50 p-3" onSubmit={submit}>
					<h3 className="text-sm font-bold text-ink">Round {activeRound.roundNumber}</h3>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{activeRound.scores.map((entry) => (
							<Field key={entry.leagueMemberId} label={memberNames.get(entry.leagueMemberId) ?? 'Unknown player'}>
								<TextInput type="number" value={scores[entry.leagueMemberId] ?? ''} onChange={(event) => setScores((current) => ({ ...current, [entry.leagueMemberId]: event.target.value }))} required />
							</Field>
						))}
					</div>
					<div className="flex justify-end">
						<Button type="submit" loading={isSubmitting} loadingLabel="Scoring...">Score round</Button>
					</div>
				</form>
			) : null}
		</div>
	);
}
