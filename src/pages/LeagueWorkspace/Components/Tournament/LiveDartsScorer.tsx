import { FormEvent, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { TextInput } from '../../../../components/FormField';
import { leagueService } from '../../../../services/leagueService';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { Avatar } from './Shared';

type DartMultiplier = 'Single' | 'Double' | 'Treble';
type PendingDart = { label: string; score: number; isDouble: boolean };

export function LiveDartsScorer({ leagueId, tournament, match, canManage, playerOne, playerTwo, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; playerOne: string; playerTwo: string; onChanged: () => Promise<void> }) {
	const startScore = tournament.startScore ?? (tournament.gameType === 'Darts501' ? 501 : 301);
	const targetLegs = tournament.matchRule === 'BestOf' ? Math.floor((tournament.framesOrLegs || 1) / 2) + 1 : tournament.framesOrLegs || 1;
	const playerOneId = match.playerOneMemberId ?? '';
	const playerTwoId = match.playerTwoMemberId ?? '';
	const [throwFirstMemberId, setThrowFirstMemberId] = useState(playerOneId);
	const [gameStarted, setGameStarted] = useState(match.status === 'Completed');
	const [activePlayerId, setActivePlayerId] = useState(match.status === 'Completed' ? playerOneId : '');
	const [playerOneRemaining, setPlayerOneRemaining] = useState(startScore);
	const [playerTwoRemaining, setPlayerTwoRemaining] = useState(startScore);
	const [playerOneLegs, setPlayerOneLegs] = useState(match.playerOneScore ?? 0);
	const [playerTwoLegs, setPlayerTwoLegs] = useState(match.playerTwoScore ?? 0);
	const [visitScore, setVisitScore] = useState('');
	const [pendingDarts, setPendingDarts] = useState<PendingDart[]>([]);
	const [selectedMultiplier, setSelectedMultiplier] = useState<DartMultiplier>('Single');
	const [manualCheckoutDouble, setManualCheckoutDouble] = useState(false);
	const [playerOneLastScore, setPlayerOneLastScore] = useState(0);
	const [playerTwoLastScore, setPlayerTwoLastScore] = useState(0);
	const [playerOneDartsThisLeg, setPlayerOneDartsThisLeg] = useState(0);
	const [playerTwoDartsThisLeg, setPlayerTwoDartsThisLeg] = useState(0);
	const [turnHistory, setTurnHistory] = useState<Array<{
		activePlayerId: string;
		playerOneRemaining: number;
		playerTwoRemaining: number;
		playerOneLegs: number;
		playerTwoLegs: number;
		playerOneLastScore: number;
		playerTwoLastScore: number;
		playerOneDartsThisLeg: number;
		playerTwoDartsThisLeg: number;
		pendingDarts: PendingDart[];
	}>>([]);
	const [error, setError] = useState('');
	const [isCompleting, setIsCompleting] = useState(false);
	const activePlayerName = activePlayerId === playerTwoId ? playerTwo : activePlayerId === playerOneId ? playerOne : 'Choose who throws first';
	const activeRemaining = activePlayerId === playerTwoId ? playerTwoRemaining : playerOneRemaining;
	const matchComplete = match.status === 'Completed' || playerOneLegs >= targetLegs || playerTwoLegs >= targetLegs;
	const currentTurnScore = pendingDarts.reduce((total, dart) => total + dart.score, 0);
	const checkoutRemaining = gameStarted ? activeRemaining - currentTurnScore : null;
	const checkoutRoute = checkoutRemaining && checkoutRemaining > 1
		? getCheckoutRoute(checkoutRemaining, tournament.doubleOutRequired, 3 - pendingDarts.length)
		: null;

	function startGame() {
		setActivePlayerId(throwFirstMemberId);
		setGameStarted(true);
		setError('');
	}

	function changeTurn() {
		setActivePlayerId((current) => current === playerOneId ? playerTwoId : playerOneId);
	}

	function recordVisit(score: number, finishedOnDouble: boolean, dartsForTurn = pendingDarts) {
		if (!canManage || !gameStarted || matchComplete || !Number.isInteger(score) || score < 0 || score > 180) {
			setError('Enter a score between 0 and 180.');
			return;
		}

		const currentRemaining = activePlayerId === playerOneId ? playerOneRemaining : playerTwoRemaining;
		const nextRemaining = currentRemaining - score;
		const dartsUsed = Math.max(1, dartsForTurn.length || 3);
		const historyEntry = {
			activePlayerId,
			playerOneRemaining,
			playerTwoRemaining,
			playerOneLegs,
			playerTwoLegs,
			playerOneLastScore,
			playerTwoLastScore,
			playerOneDartsThisLeg,
			playerTwoDartsThisLeg,
			pendingDarts: dartsForTurn
		};
		if (score > currentRemaining || nextRemaining === 1 || (nextRemaining === 0 && tournament.doubleOutRequired && !finishedOnDouble)) {
			setTurnHistory((history) => [...history, historyEntry]);
			setError(nextRemaining === 0 ? 'Bust. Checkout must finish on a double.' : 'Bust.');
			setVisitScore('');
			setManualCheckoutDouble(false);
			setPendingDarts([]);
			updateLastScoreAndDarts(score, dartsUsed, false);
			changeTurn();
			return;
		}

		setTurnHistory((history) => [...history, historyEntry]);
		setError('');
		setVisitScore('');
		setManualCheckoutDouble(false);
		setPendingDarts([]);
		updateLastScoreAndDarts(score, dartsUsed, nextRemaining === 0);

		if (nextRemaining === 0) {
			const nextPlayerOneLegs = playerOneLegs + (activePlayerId === playerOneId ? 1 : 0);
			const nextPlayerTwoLegs = playerTwoLegs + (activePlayerId === playerTwoId ? 1 : 0);
			setPlayerOneLegs(nextPlayerOneLegs);
			setPlayerTwoLegs(nextPlayerTwoLegs);
			setPlayerOneRemaining(startScore);
			setPlayerTwoRemaining(startScore);
			setPlayerOneDartsThisLeg(0);
			setPlayerTwoDartsThisLeg(0);
			changeTurn();
			return;
		}

		if (activePlayerId === playerOneId) {
			setPlayerOneRemaining(nextRemaining);
		} else {
			setPlayerTwoRemaining(nextRemaining);
		}
		changeTurn();
	}

	function updateLastScoreAndDarts(score: number, dartsUsed: number, resetLegDarts: boolean) {
		if (activePlayerId === playerOneId) {
			setPlayerOneLastScore(score);
			setPlayerOneDartsThisLeg((current) => resetLegDarts ? 0 : current + dartsUsed);
			return;
		}

		setPlayerTwoLastScore(score);
		setPlayerTwoDartsThisLeg((current) => resetLegDarts ? 0 : current + dartsUsed);
	}

	function submitVisit(event: FormEvent) {
		event.preventDefault();
		const score = Number(visitScore);
		recordVisit(score, manualCheckoutDouble);
	}

	function scoreDart(value: number, multiplier: DartMultiplier) {
		const multiplierValue = multiplier === 'Treble' ? 3 : multiplier === 'Double' ? 2 : 1;
		recordDart({
			label: multiplier === 'Single' ? `${value}` : `${multiplier[0]}${value}`,
			score: value * multiplierValue,
			isDouble: multiplier === 'Double'
		});
	}

	function recordDart(dart: PendingDart) {
		if (!canManage || !gameStarted || matchComplete || pendingDarts.length >= 3) {
			return;
		}

		const nextPendingDarts = [...pendingDarts, dart];
		const turnScore = nextPendingDarts.reduce((total, item) => total + item.score, 0);
		const currentRemaining = activePlayerId === playerOneId ? playerOneRemaining : playerTwoRemaining;
		const nextRemaining = currentRemaining - turnScore;
		if (nextRemaining === 0 || nextPendingDarts.length === 3 || nextRemaining < 1) {
			recordVisit(turnScore, dart.isDouble, nextPendingDarts);
			return;
		}

		setPendingDarts(nextPendingDarts);
		setError('');
	}

	function undoLastTurn() {
		if (pendingDarts.length > 0) {
			setPendingDarts((darts) => darts.slice(0, -1));
			setError('');
			return;
		}

		const previous = turnHistory.at(-1);
		if (!previous) {
			return;
		}

		setActivePlayerId(previous.activePlayerId);
		setPlayerOneRemaining(previous.playerOneRemaining);
		setPlayerTwoRemaining(previous.playerTwoRemaining);
		setPlayerOneLegs(previous.playerOneLegs);
		setPlayerTwoLegs(previous.playerTwoLegs);
		setPlayerOneLastScore(previous.playerOneLastScore);
		setPlayerTwoLastScore(previous.playerTwoLastScore);
		setPlayerOneDartsThisLeg(previous.playerOneDartsThisLeg);
		setPlayerTwoDartsThisLeg(previous.playerTwoDartsThisLeg);
		setPendingDarts(previous.pendingDarts.slice(0, -1));
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
			<div className="grid grid-cols-2 gap-3 lg:gap-4">
				<DartsPlayerPanel name={playerOne} remaining={playerOneRemaining} active={gameStarted && activePlayerId === playerOneId} lastScore={playerOneLastScore} dartsThisLeg={playerOneDartsThisLeg} />
				<DartsPlayerPanel name={playerTwo} remaining={playerTwoRemaining} active={gameStarted && activePlayerId === playerTwoId} lastScore={playerTwoLastScore} dartsThisLeg={playerTwoDartsThisLeg} tone="green" />
			</div>
			{gameStarted || match.status === 'Completed' ? null : (
				<div className="rounded-lg border border-slate-200 p-4 text-left">
					<h3 className="font-bold text-ink">Throw first</h3>
					<div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
						<ThrowFirstButton name={playerOne} selected={throwFirstMemberId === playerOneId} onClick={() => setThrowFirstMemberId(playerOneId)} />
						<ThrowFirstButton name={playerTwo} selected={throwFirstMemberId === playerTwoId} onClick={() => setThrowFirstMemberId(playerTwoId)} />
						<Button type="button" className="sm:self-end" onClick={startGame} disabled={!canManage || !throwFirstMemberId}>Start game</Button>
					</div>
				</div>
			)}
			<form className="grid gap-3 rounded-lg border border-slate-200 p-3 text-left sm:p-4" onSubmit={submitVisit}>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-xs font-bold uppercase text-slate-500">Legs</p>
						<p className="text-2xl font-bold text-ink">{playerOneLegs} - {playerTwoLegs}</p>
						<p className="text-xs font-semibold text-slate-500">First to {targetLegs}</p>
					</div>
					<div className="min-w-0 text-right">
						<p className="text-sm font-semibold text-slate-700">{gameStarted ? `${activePlayerName} to throw` : 'Choose who throws first'}</p>
						<p className="mt-1 text-xs text-slate-500">
							{tournament.doubleInRequired ? 'Double in required' : 'Double in not required'} · {tournament.doubleOutRequired ? 'Double out required' : 'Double out not required'}
						</p>
						{checkoutRoute ? (
							<p className="mt-2 inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-bold text-emerald-700">
								Checkout: {checkoutRoute}
							</p>
						) : null}
					</div>
				</div>
				<div className="grid gap-3 rounded-md bg-slate-50 p-3">
					<div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
						<div className="flex items-center justify-between gap-3 text-xs font-bold uppercase text-slate-500">
							<span>Darts this turn</span>
							<span>{currentTurnScore} scored</span>
						</div>
						<div className="grid grid-cols-3 gap-2">
							{[0, 1, 2].map((index) => {
								const dart = pendingDarts[index];
								return (
									<div key={index} className="rounded-md bg-slate-50 px-3 py-2 text-center">
										<p className="text-xs font-semibold text-slate-500">Dart {index + 1}</p>
										<p className="text-lg font-bold text-ink">{dart ? `${dart.label} (${dart.score})` : '-'}</p>
									</div>
								);
							})}
						</div>
					</div>
					<div className="grid gap-2 rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_9rem] sm:items-center">
						<TextInput className="min-h-11 rounded-md border-0 bg-slate-50 text-center text-xl font-bold shadow-none focus:ring-0" type="number" min="0" max="180" value={visitScore} onChange={(event) => setVisitScore(event.target.value)} disabled={!canManage || !gameStarted || matchComplete} placeholder="Manual score" aria-label="Manual score" />
						<Button type="submit" disabled={!canManage || !gameStarted || matchComplete}>Submit</Button>
					</div>
					{Number(visitScore) === activeRemaining && tournament.doubleOutRequired ? (
						<label className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-700">
							<input type="checkbox" checked={manualCheckoutDouble} onChange={(event) => setManualCheckoutDouble(event.target.checked)} disabled={!canManage || !gameStarted || matchComplete} />
							Manual score finished on a double
						</label>
					) : null}
					<div className="grid grid-cols-5 overflow-hidden rounded-md border border-slate-200 bg-white">
						{(['Single', 'Double', 'Treble'] as DartMultiplier[]).map((multiplier) => (
							<button key={multiplier} type="button" className={selectedMultiplier === multiplier ? 'min-h-14 border-b-2 border-ink px-2 py-2 text-sm font-bold text-ink' : 'min-h-14 px-2 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50'} onClick={() => setSelectedMultiplier(multiplier)} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 3}>
								{multiplier}
							</button>
						))}
						<button type="button" className="min-h-14 px-2 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => recordDart({ label: 'Bull', score: 50, isDouble: true })} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 3}>Bull<br /><span className="font-semibold">50</span></button>
						<button type="button" className="min-h-14 px-2 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => recordDart({ label: '25', score: 25, isDouble: false })} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 3}>Outer<br /><span className="font-semibold">25</span></button>
					</div>
					<div className="grid grid-cols-5 overflow-hidden rounded-md border border-slate-200 bg-white">
						{Array.from({ length: 20 }, (_, index) => index + 1).map((number) => (
							<button key={number} type="button" className="grid min-h-16 place-items-center border-b border-r border-slate-200 px-1 py-2 text-2xl font-bold text-ink hover:bg-slate-50 disabled:opacity-50" onClick={() => scoreDart(number, selectedMultiplier)} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 3}>
								{formatDartButtonLabel(number, selectedMultiplier)}
							</button>
						))}
					</div>
					<div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-200 bg-white">
						<button type="button" className="min-h-14 border-r border-slate-200 px-3 py-2 font-bold text-ink hover:bg-slate-50" onClick={undoLastTurn} disabled={!canManage || (turnHistory.length === 0 && pendingDarts.length === 0) || match.status === 'Completed'}>
							<span className="inline-flex items-center gap-2"><RotateCcw size={16} /> Undo</span>
						</button>
						<button type="button" className="min-h-14 border-r border-slate-200 px-3 py-2 font-bold text-ink hover:bg-slate-50 disabled:opacity-50" onClick={() => recordDart({ label: 'Miss', score: 0, isDouble: false })} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 3}>Miss</button>
						<Button type="button" className="min-h-14 rounded-none" loading={isCompleting} loadingLabel="Completing..." disabled={!canManage || !matchComplete || match.status === 'Completed'} onClick={completeMatch}>Complete</Button>
					</div>
				</div>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
			</form>
		</div>
	);
}

function ThrowFirstButton({ name, selected, onClick }: { name: string; selected: boolean; onClick: () => void }) {
	return (
		<button type="button" className={selected ? 'rounded-md border border-blue-600 bg-blue-50 px-4 py-3 text-left font-bold text-ink' : 'rounded-md border border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-50'} onClick={onClick}>
			{name}
		</button>
	);
}

function formatDartButtonLabel(number: number, multiplier: DartMultiplier) {
	if (multiplier === 'Single') {
		return <span>{number}</span>;
	}

	const multiplierValue = multiplier === 'Treble' ? 3 : 2;
	return (
		<span className="inline-flex items-baseline gap-1">
			<span>{number}</span>
			<span className="text-sm font-semibold text-slate-500">{number * multiplierValue}</span>
		</span>
	);
}

function getCheckoutRoute(target: number, mustFinishOnDouble: boolean, dartsAvailable: number) {
	if (target < 2 || target > 180 || dartsAvailable < 1) {
		return null;
	}

	const darts = getCheckoutDarts();
	for (const first of darts) {
		if (first.score === target && (!mustFinishOnDouble || first.isDouble)) {
			return first.label;
		}
	}

	if (dartsAvailable < 2) {
		return null;
	}

	for (const first of darts) {
		for (const second of darts) {
			if (first.score + second.score === target && (!mustFinishOnDouble || second.isDouble)) {
				return `${first.label}, ${second.label}`;
			}
		}
	}

	if (dartsAvailable < 3) {
		return null;
	}

	for (const first of darts) {
		for (const second of darts) {
			for (const third of darts) {
				if (first.score + second.score + third.score === target && (!mustFinishOnDouble || third.isDouble)) {
					return `${first.label}, ${second.label}, ${third.label}`;
				}
			}
		}
	}

	return null;
}

function getCheckoutDarts(): PendingDart[] {
	const numbers = Array.from({ length: 20 }, (_, index) => 20 - index);
	return [
		...numbers.map((number) => ({ label: `T${number}`, score: number * 3, isDouble: false })),
		{ label: 'Bull', score: 50, isDouble: true },
		...numbers.map((number) => ({ label: `D${number}`, score: number * 2, isDouble: true })),
		{ label: '25', score: 25, isDouble: false },
		...numbers.map((number) => ({ label: `${number}`, score: number, isDouble: false }))
	];
}

function DartsPlayerPanel({ name, remaining, active, lastScore, dartsThisLeg, tone = 'blue' }: { name: string; remaining: number; active: boolean; lastScore: number; dartsThisLeg: number; tone?: 'blue' | 'green' }) {
	return (
		<div className={active ? 'min-w-0 rounded-lg border border-blue-500 bg-blue-50/30 p-2 text-center sm:p-4' : 'min-w-0 rounded-lg border border-slate-200 p-2 text-center sm:p-4'}>
			<div className="flex items-center justify-center gap-2">
				<span className="hidden sm:inline-grid"><Avatar name={name} large tone={tone === 'green' ? 'green' : 'blue'} /></span>
				<p className="truncate text-sm font-bold text-ink sm:text-base">{name}</p>
			</div>
			<p className="mt-2 text-xs font-bold uppercase text-slate-500">Current</p>
			<p className="text-3xl font-bold text-ink sm:text-4xl">{remaining}</p>
			<div className="mt-2 grid grid-cols-2 gap-1 text-xs font-semibold text-slate-500">
				<span>Last {lastScore}</span>
				<span>{dartsThisLeg} darts</span>
			</div>
		</div>
	);
}
