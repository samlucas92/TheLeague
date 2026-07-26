import { FormEvent, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { Field, TextInput } from '../../../../components/FormField';
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
	const [turnHistory, setTurnHistory] = useState<Array<{ activePlayerId: string; playerOneRemaining: number; playerTwoRemaining: number; playerOneLegs: number; playerTwoLegs: number; pendingDarts: PendingDart[] }>>([]);
	const [error, setError] = useState('');
	const [isCompleting, setIsCompleting] = useState(false);
	const activePlayerName = activePlayerId === playerTwoId ? playerTwo : activePlayerId === playerOneId ? playerOne : 'Choose who throws first';
	const activeRemaining = activePlayerId === playerTwoId ? playerTwoRemaining : playerOneRemaining;
	const matchComplete = match.status === 'Completed' || playerOneLegs >= targetLegs || playerTwoLegs >= targetLegs;

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
		if (score > currentRemaining || nextRemaining === 1 || (nextRemaining === 0 && tournament.doubleOutRequired && !finishedOnDouble)) {
			setTurnHistory((history) => [...history, { activePlayerId, playerOneRemaining, playerTwoRemaining, playerOneLegs, playerTwoLegs, pendingDarts: dartsForTurn }]);
			setError(nextRemaining === 0 ? 'Bust. Checkout must finish on a double.' : 'Bust.');
			setVisitScore('');
			setManualCheckoutDouble(false);
			setPendingDarts([]);
			changeTurn();
			return;
		}

		setTurnHistory((history) => [...history, { activePlayerId, playerOneRemaining, playerTwoRemaining, playerOneLegs, playerTwoLegs, pendingDarts: dartsForTurn }]);
		setError('');
		setVisitScore('');
		setManualCheckoutDouble(false);
		setPendingDarts([]);

		if (nextRemaining === 0) {
			const nextPlayerOneLegs = playerOneLegs + (activePlayerId === playerOneId ? 1 : 0);
			const nextPlayerTwoLegs = playerTwoLegs + (activePlayerId === playerTwoId ? 1 : 0);
			setPlayerOneLegs(nextPlayerOneLegs);
			setPlayerTwoLegs(nextPlayerTwoLegs);
			setPlayerOneRemaining(startScore);
			setPlayerTwoRemaining(startScore);
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
		if (!canManage || !gameStarted || matchComplete || pendingDarts.length >= 2) {
			return;
		}

		const nextPendingDarts = [...pendingDarts, dart];
		const turnScore = nextPendingDarts.reduce((total, item) => total + item.score, 0);
		const currentRemaining = activePlayerId === playerOneId ? playerOneRemaining : playerTwoRemaining;
		const nextRemaining = currentRemaining - turnScore;
		if (nextRemaining === 0 || nextPendingDarts.length === 2 || nextRemaining < 1) {
			recordVisit(turnScore, dart.isDouble, nextPendingDarts);
			return;
		}

		setPendingDarts(nextPendingDarts);
		setError('');
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
		setPendingDarts(previous.pendingDarts);
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
				<DartsPlayerPanel name={playerOne} score={startScore} remaining={playerOneRemaining} active={gameStarted && activePlayerId === playerOneId} legs={playerOneLegs} />
				<div className="rounded-lg border border-slate-200 p-4">
					<p className="text-xs font-bold uppercase text-slate-500">Legs</p>
					<p className="mt-2 text-4xl font-bold text-ink">{playerOneLegs} - {playerTwoLegs}</p>
					<p className="mt-1 text-sm font-semibold text-slate-500">First to {targetLegs}</p>
					<div className="mt-4 grid gap-2 text-left text-xs text-slate-600">
						<p>{tournament.doubleInRequired ? 'Double in required' : 'Double in not required'}</p>
						<p>{tournament.doubleOutRequired ? 'Double out required' : 'Double out not required'}</p>
					</div>
				</div>
				<DartsPlayerPanel name={playerTwo} score={startScore} remaining={playerTwoRemaining} active={gameStarted && activePlayerId === playerTwoId} legs={playerTwoLegs} tone="green" />
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
			<form className="grid gap-4 rounded-lg border border-slate-200 p-4 text-left" onSubmit={submitVisit}>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h3 className="font-bold text-ink">Scorer</h3>
						<p className="mt-1 text-sm text-slate-600">{gameStarted ? `${activePlayerName} to throw.` : 'Choose who throws first, then start the game.'}</p>
					</div>
					<div className="rounded-md bg-slate-50 px-4 py-2 text-right">
						<p className="text-xs font-bold uppercase text-slate-500">Remaining</p>
						<p className="text-2xl font-bold text-ink">{gameStarted ? activeRemaining : '-'}</p>
					</div>
				</div>
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
					<div className="grid gap-3">
						<Field label="Score this visit">
							<TextInput className="min-h-16 text-center text-3xl font-bold" type="number" min="0" max="180" value={visitScore} onChange={(event) => setVisitScore(event.target.value)} disabled={!canManage || !gameStarted || matchComplete} placeholder="0" />
						</Field>
						{Number(visitScore) === activeRemaining && tournament.doubleOutRequired ? (
							<label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
								<input type="checkbox" checked={manualCheckoutDouble} onChange={(event) => setManualCheckoutDouble(event.target.checked)} disabled={!canManage || !gameStarted || matchComplete} />
								Manual score finished on a double
							</label>
						) : null}
						<div className="grid gap-3 rounded-md bg-slate-50 p-3">
							<div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
								<div className="flex items-center justify-between gap-3 text-xs font-bold uppercase text-slate-500">
									<span>Darts this turn</span>
									<span>{pendingDarts.reduce((total, dart) => total + dart.score, 0)} scored</span>
								</div>
								<div className="grid grid-cols-2 gap-2">
									{[0, 1].map((index) => {
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
							<div className="grid grid-cols-3 gap-2">
								{(['Single', 'Double', 'Treble'] as DartMultiplier[]).map((multiplier) => (
									<button key={multiplier} type="button" className={selectedMultiplier === multiplier ? 'min-h-11 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white' : 'min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:bg-slate-50'} onClick={() => setSelectedMultiplier(multiplier)} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 2}>
										{multiplier}
									</button>
								))}
							</div>
							<div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
								{Array.from({ length: 20 }, (_, index) => index + 1).map((number) => (
									<button key={number} type="button" className="min-h-12 rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-bold text-ink hover:bg-slate-50 disabled:opacity-50" onClick={() => scoreDart(number, selectedMultiplier)} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 2}>
										{number}
									</button>
								))}
							</div>
							<div className="grid grid-cols-2 gap-2">
								<button type="button" className="min-h-12 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:bg-slate-50 disabled:opacity-50" onClick={() => recordDart({ label: '25', score: 25, isDouble: false })} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 2}>25</button>
								<button type="button" className="min-h-12 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:bg-slate-50 disabled:opacity-50" onClick={() => recordDart({ label: 'Bull', score: 50, isDouble: true })} disabled={!canManage || !gameStarted || matchComplete || pendingDarts.length >= 2}>Bull</button>
							</div>
						</div>
					</div>
					<div className="grid content-start gap-2">
						<Button type="submit" disabled={!canManage || !gameStarted || matchComplete}>Enter score</Button>
						<Button type="button" variant="secondary" icon={<RotateCcw size={16} />} onClick={undoLastTurn} disabled={!canManage || turnHistory.length === 0 || match.status === 'Completed'}>Undo last dart</Button>
						<Button type="button" loading={isCompleting} loadingLabel="Completing..." disabled={!canManage || !matchComplete || match.status === 'Completed'} onClick={completeMatch}>Complete match</Button>
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

function DartsPlayerPanel({ name, score, remaining, active, legs, tone = 'blue' }: { name: string; score: number; remaining: number; active: boolean; legs: number; tone?: 'blue' | 'green' }) {
	return (
		<div className={active ? 'rounded-lg border border-blue-500 bg-blue-50/30 p-4 text-center' : 'rounded-lg border border-slate-200 p-4 text-center'}>
			<Avatar name={name} large tone={tone === 'green' ? 'green' : 'blue'} />
			<p className="mt-2 font-bold text-ink">{name}</p>
			<p className="mt-4 rounded-md border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600">{score}</p>
			<p className="mt-4 text-xs font-bold uppercase text-slate-500">Current score</p>
			<p className="mt-1 text-3xl font-bold text-ink">{remaining}</p>
			<p className="mt-2 text-xs font-semibold text-slate-500">{legs} legs won</p>
		</div>
	);
}
