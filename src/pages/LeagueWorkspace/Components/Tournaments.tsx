import { FormEvent, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, SelectInput, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import { leagueService } from '../../../services/leagueService';
import type { League, Member } from '../../../services/types';

export function CreateTournamentModal({
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
	onSaved: () => void | Promise<void>;
}) {
	const [name, setName] = useState('');
	const [gameType, setGameType] = useState<'Pool' | 'DartsHighestScore'>('Pool');
	const [participantMemberIds, setParticipantMemberIds] = useState<string[]>([]);
	const [winnerPoints, setWinnerPoints] = useState('20');
	const [runnerUpPoints, setRunnerUpPoints] = useState('10');
	const [matchWinPoints, setMatchWinPoints] = useState('0');
	const [eliminatePerRound, setEliminatePerRound] = useState('1');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		setError('');
		if (participantMemberIds.length === 0) {
			setParticipantMemberIds(members.map((member) => member.id));
		}
	}, [open, members, participantMemberIds.length]);

	function toggleParticipant(memberId: string) {
		setParticipantMemberIds((current) =>
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
			await leagueService.createTournament(league.id, {
				name,
				gameType,
				format: gameType === 'Pool' ? 'SingleEliminationBracket' : 'RoundElimination',
				participantMemberIds,
				winnerPoints: Number(winnerPoints),
				runnerUpPoints: Number(runnerUpPoints),
				matchWinPoints: Number(matchWinPoints),
				eliminatePerRound: Number(eliminatePerRound)
			});
			setName('');
			await onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not create tournament.');
			setIsSubmitting(false);
		}
	}

	return (
		<Modal
			open={open}
			title="Create tournament"
			description="Create a pool knockout bracket or a highest-score darts elimination game."
			onClose={onClose}
		>
			<form className="grid gap-4" onSubmit={submit}>
				<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
					<Field label="Name">
						<TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Pool knockout" required />
					</Field>
					<Field label="Game">
						<SelectInput value={gameType} onChange={(event) => setGameType(event.target.value as 'Pool' | 'DartsHighestScore')}>
							<option value="Pool">Pool knockout</option>
							<option value="DartsHighestScore">Darts highest score</option>
						</SelectInput>
					</Field>
				</div>
				<div className="grid gap-2">
					<p className="text-sm font-medium text-slate-700">Players</p>
					<div className="grid max-h-48 gap-2 overflow-auto rounded-md border border-slate-200 p-2 sm:grid-cols-2">
						{members.map((member) => (
							<label key={member.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
								<input type="checkbox" checked={participantMemberIds.includes(member.id)} onChange={() => toggleParticipant(member.id)} />
								{member.displayName}
							</label>
						))}
					</div>
				</div>
				<div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Field label="Winner points">
						<TextInput type="number" value={winnerPoints} onChange={(event) => setWinnerPoints(event.target.value)} />
					</Field>
					<Field label="Runner-up points">
						<TextInput type="number" value={runnerUpPoints} onChange={(event) => setRunnerUpPoints(event.target.value)} />
					</Field>
					<Field label="Match win points">
						<TextInput type="number" value={matchWinPoints} onChange={(event) => setMatchWinPoints(event.target.value)} />
					</Field>
					<Field label="Eliminate per round">
						<TextInput type="number" min="1" value={eliminatePerRound} onChange={(event) => setEliminatePerRound(event.target.value)} disabled={gameType === 'Pool'} />
					</Field>
				</div>
				<div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					{gameType === 'Pool'
						? 'Pool creates a single-elimination bracket. Record each match winner to advance the bracket.'
						: 'Darts highest score records one score per active player each round, then eliminates the lowest scores.'}
				</div>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
					<Button type="submit" icon={<Trophy size={16} />} loading={isSubmitting} loadingLabel="Creating..." disabled={participantMemberIds.length < 2}>Create tournament</Button>
				</div>
			</form>
		</Modal>
	);
}
