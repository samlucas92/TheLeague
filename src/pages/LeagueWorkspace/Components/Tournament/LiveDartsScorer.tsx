import { FormEvent, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { Field, TextInput } from '../../../../components/FormField';
import { leagueService } from '../../../../services/leagueService';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { Avatar } from './Shared';

type DartsLegResult = {
	winnerMemberId: string;
	winnerName: string;
	playerOneRemaining: number;
	playerTwoRemaining: number;
	playerOneLegs: number;
	playerTwoLegs: number;
};

export function LiveDartsScorer({ leagueId, tournament, match, canManage, playerOne, playerTwo, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; playerOne: string; playerTwo: string; onChanged: () => Promise<void> }) {
	const startScore = tournament.startScore ?? (tournament.gameType === 'Darts501' ? 501 : 301);
	const targetLegs = tournament.matchRule === 'BestOf' ? Math.floor((tournament.framesOrLegs || 1) / 2) + 1 : tournament.framesOrLegs || 1;
	const [activePlayerId, setActivePlayerId] = useState(match.playerOneMemberId ?? '');
	const [playerOneRemaining, setPlayerOneRemaining] = useState(startScore);
	const [playerTwoRemaining, setPlayerTwoRemaining] = useState(startScore);
	const [playerOneLegs, setPlayerOneLegs] = useState(match.playerOneScore ?? 0);
	const [playerTwoLegs, setPlayerTwoLegs] = useState(match.playerTwoScore ?? 0);
	const [visitScore, setVisitScore] = useState('');
	const [legHistory, setLegHistory] = useState<DartsLegResult[]>([]);
	const [turnHistory, setTurnHistory] = useState<Array<{ activePlayerId: string; playerOneRemaining: number; playerTwoRemaining: number; playerOneLegs: number; playerTwoLegs: number; legHistory: DartsLegResult[] }>>([]);
	const [error, setError] = useState('');
	const [isCompleting, setIsCompleting] = useState(false);
	const playerOneId = match.playerOneMemberId ?? '';
	const playerTwoId = match.playerTwoMemberId ?? '';
	const activePlayerName = activePlayerId === playerTwoId ? playerTwo : playerOne;
	const matchComplete = match.status === 'Completed' || playerOneLegs >= targetLegs || playerTwoLegs >= targetLegs;

	function changeTurn() {
		setActivePlayerId((current) => current === playerOneId ? playerTwoId : playerOneId);
	}

	function submitVisit(event: FormEvent) {
		event.preventDefault();
		const score = Number(visitScore);
		if (!canManage || matchComplete || !Number.isInteger(score) || score < 0 || score > 180) {
			setError('Enter a score between 0 and 180.');
			return;
		}

		const currentRemaining = activePlayerId === playerOneId ? playerOneRemaining : playerTwoRemaining;
		if (score > currentRemaining) {
			setError('Bust. Score cannot be higher than the remaining total.');
			return;
		}

		setTurnHistory((history) => [...history, { activePlayerId, playerOneRemaining, playerTwoRemaining, playerOneLegs, playerTwoLegs, legHistory }]);
		setError('');
		setVisitScore('');

		if (score === currentRemaining) {
			const nextPlayerOneLegs = playerOneLegs + (activePlayerId === playerOneId ? 1 : 0);
			const nextPlayerTwoLegs = playerTwoLegs + (activePlayerId === playerTwoId ? 1 : 0);
			const winnerName = activePlayerId === playerOneId ? playerOne : playerTwo;
			setPlayerOneLegs(nextPlayerOneLegs);
			setPlayerTwoLegs(nextPlayerTwoLegs);
			setLegHistory((history) => [...history, {
				winnerMemberId: activePlayerId,
				winnerName,
				playerOneRemaining: activePlayerId === playerOneId ? 0 : playerOneRemaining,
				playerTwoRemaining: activePlayerId === playerTwoId ? 0 : playerTwoRemaining,
				playerOneLegs: nextPlayerOneLegs,
				playerTwoLegs: nextPlayerTwoLegs
			}]);
			setPlayerOneRemaining(startScore);
			setPlayerTwoRemaining(startScore);
			changeTurn();
			return;
		}

		if (activePlayerId === playerOneId) {
			setPlayerOneRemaining(currentRemaining - score);
		} else {
			setPlayerTwoRemaining(currentRemaining - score);
		}
		changeTurn();
	}

	function undoLastTurn() {
		const previous = turnHistory.at(-1);
		if (!previous) {
			return;
		}

		setActivePlayerId(previous.activePlayerId);
		setPlayerOneRemaining(previous.playerOneRemaining);
		setPlayerTwoRemaining(previous.playerTwoRemaining);
		setPlayerOneLegs(previous.playerOneLegs);
		setPlayerTwoLegs(previous.playerTwoLegs);
		setLegHistory(previous.legHistory);
		setTurnHistory((history) => history.slice(0, -1));
		setError('');
	}

	async function completeMatch() {
		const winnerMemberId = playerOneLegs > playerTwoLegs ? playerOneId : playerTwoId;
		setIsCompleting(true);
		setError('');
		try {
			await leagueService.completeTournamentMatch(leagueId, tournament.id, match.id, {
				winnerMemberId,
				playerOneScore: playerOneLegs,
				playerTwoScore: playerTwoLegs
			});
			await onChanged();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not complete match.');
			setIsCompleting(false);
		}
	}

	return (
		<div className="grid gap-4 border-t border-slate-100 pt-4">
			<div className="grid gap-4 lg:grid-cols-[1fr_18rem_1fr]">
				<DartsPlayerPanel name={playerOne} score={startScore} remaining={playerOneRemaining} active={activePlayerId === playerOneId} />
				<div className="rounded-lg border border-slate-200 p-4">
					<p className="text-xs font-bold uppercase text-slate-500">Legs</p>
					<p className="mt-2 text-4xl font-bold text-ink">{playerOneLegs} - {playerTwoLegs}</p>
					<p className="mt-1 text-sm font-semibold text-slate-500">First to {targetLegs}</p>
					<div className="mt-4 grid gap-2 text-left text-xs text-slate-600">
						<p>{tournament.doubleInRequired ? 'Double in required' : 'Double in not required'}</p>
						<p>{tournament.doubleOutRequired ? 'Double out required' : 'Double out not required'}</p>
					</div>
				</div>
				<DartsPlayerPanel name={playerTwo} score={startScore} remaining={playerTwoRemaining} active={activePlayerId === playerTwoId} tone="green" />
			</div>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div className="rounded-lg border border-slate-200 p-4">
					<h3 className="font-bold text-ink">Leg history</h3>
					<div className="mt-3 grid gap-2 text-sm">
						{Array.from({ length: Math.max(targetLegs * 2 - 1, tournament.framesOrLegs || 1) }).map((_, index) => {
							const leg = legHistory[index];
							return (
								<div key={index} className="grid grid-cols-[4rem_1fr_auto] rounded-md bg-slate-50 px-3 py-2 text-left">
									<span className="text-slate-500">Leg {index + 1}</span>
									<span className="font-semibold text-ink">{leg?.winnerName ?? '-'}</span>
									<span className="text-slate-500">{leg ? `${leg.playerOneLegs} - ${leg.playerTwoLegs}` : 'Not started'}</span>
								</div>
							);
						})}
					</div>
				</div>
				<form className="grid content-start gap-3 rounded-lg border border-slate-200 p-4 text-left" onSubmit={submitVisit}>
					<h3 className="font-bold text-ink">Current throw</h3>
					<p className="text-sm text-slate-600">{activePlayerName} to throw.</p>
					<Field label="Score this visit">
						<TextInput type="number" min="0" max="180" value={visitScore} onChange={(event) => setVisitScore(event.target.value)} disabled={!canManage || matchComplete} placeholder="e.g. 60" />
					</Field>
					<div className="grid grid-cols-3 gap-2">
						{[26, 41, 60, 85, 100, 140, 180].map((score) => (
							<button key={score} type="button" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50" onClick={() => setVisitScore(String(score))} disabled={!canManage || matchComplete}>{score}</button>
						))}
					</div>
					{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
					<Button type="submit" disabled={!canManage || matchComplete}>Enter score</Button>
					<Button type="button" variant="secondary" icon={<RotateCcw size={16} />} onClick={undoLastTurn} disabled={!canManage || turnHistory.length === 0 || match.status === 'Completed'}>Undo last dart</Button>
					<Button type="button" loading={isCompleting} loadingLabel="Completing..." disabled={!canManage || !matchComplete || match.status === 'Completed'} onClick={completeMatch}>Complete match</Button>
				</form>
			</div>
		</div>
	);
}

function DartsPlayerPanel({ name, score, remaining, active, tone = 'blue' }: { name: string; score: number; remaining: number; active: boolean; tone?: 'blue' | 'green' }) {
	return (
		<div className={active ? 'rounded-lg border border-blue-500 bg-blue-50/30 p-4 text-center' : 'rounded-lg border border-slate-200 p-4 text-center'}>
			<Avatar name={name} large tone={tone === 'green' ? 'green' : 'blue'} />
			<p className="mt-2 font-bold text-ink">{name}</p>
			<p className="mt-4 rounded-md border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600">{score}</p>
			<p className="mt-4 text-xs font-bold uppercase text-slate-500">Current score</p>
			<p className="mt-1 text-3xl font-bold text-ink">{remaining}</p>
			<p className="mt-2 text-xs font-semibold text-slate-500">{active ? 'To throw' : 'Waiting'}</p>
		</div>
	);
}
