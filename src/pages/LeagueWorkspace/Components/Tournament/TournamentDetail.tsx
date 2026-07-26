import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, RotateCcw, Target, Trash2, Trophy, Users, X } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { Field, SelectInput, TextInput } from '../../../../components/FormField';
import { StatusBadge } from '../../../../components/StatusBadge';
import { leagueService } from '../../../../services/leagueService';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { breakRuleLabel, formatDate, formatGameType, gameRulesSummary, getNextMatch, getStatusTone, isDartsTournament, matchFormatLabel, structureLabel } from './helpers';
import { Avatar, GameArtwork, Meta } from './Shared';
import { BracketPanel } from './TournamentBracket';
import { DartsPanel } from './TournamentDartsRounds';
import { NextMatchLarge, PlayerList, ProgressSummary, SideCard } from './TournamentSidebar';

export function TournamentDetail({ leagueId, tournament, canManage, memberNames, onBack, onChanged, onDelete }: { leagueId: string; tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onBack: () => void; onChanged: () => Promise<void>; onDelete: () => Promise<void> }) {
	const [activeTab, setActiveTab] = useState<'Overview' | 'League' | 'Knockout Bracket' | 'Matches' | 'Players' | 'Details'>('Overview');
	const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
	const [actionsOpen, setActionsOpen] = useState(false);
	const nextMatch = getNextMatch(tournament);
	const recentResults = tournament.matches.filter((match) => match.status === 'Completed').slice(-4).reverse();
	const activeRound = tournament.rounds.find((round) => !round.isComplete);
	const selectedMatch = useMemo(
		() => tournament.matches.find((match) => match.id === selectedMatchId) ?? null,
		[tournament.matches, selectedMatchId]
	);

	if (selectedMatch) {
		return (
			<TournamentMatchView
				leagueId={leagueId}
				tournament={tournament}
				match={selectedMatch}
				canManage={canManage}
				memberNames={memberNames}
				onBack={() => setSelectedMatchId(null)}
				onChanged={async () => {
					await onChanged();
					setSelectedMatchId(null);
				}}
			/>
		);
	}

	const tabs = Array.from(new Set([
		'Overview',
		tournament.structure === 'LeagueAndKnockout' ? 'League' : null,
		tournament.format === 'SingleEliminationBracket' ? 'Knockout Bracket' : null,
		'Matches',
		`Players (${tournament.participantCount})`,
		'Details'
	].filter(Boolean) as string[]));

	return (
		<section className="grid gap-4">
			<button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink" onClick={onBack}>
				<ArrowLeft size={16} /> Back to tournaments
			</button>
			<article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<header className="grid gap-4 border-b border-slate-200 p-4 lg:grid-cols-[7rem_minmax(0,1fr)_auto]">
					<GameArtwork gameType={tournament.gameType} compact />
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge label={tournament.status} tone={getStatusTone(tournament.status)} />
							<h2 className="text-xl font-bold text-ink">{tournament.name}</h2>
						</div>
						<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
							<Meta icon={<Target size={15} />} label={formatGameType(tournament)} />
							<Meta icon={<Trophy size={15} />} label={tournament.format === 'SingleEliminationBracket' ? matchFormatLabel(tournament) : `Eliminate ${tournament.eliminatePerRound} each round`} />
							<Meta icon={<Users size={15} />} label={`${tournament.participantCount} players`} />
							<Meta icon={<Calendar size={15} />} label={`Started ${formatDate(tournament.createdAt)}`} />
						</div>
					</div>
					<div className="relative flex items-start gap-2">
						<Button type="button" variant="secondary" icon={<ChevronDown size={16} />} onClick={() => setActionsOpen((open) => !open)}>Actions</Button>
						{actionsOpen ? (
							<div className="absolute right-10 top-11 z-10 grid min-w-48 gap-1 rounded-md border border-slate-200 bg-white p-2 text-sm font-semibold shadow-lg">
								<button type="button" className="rounded px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setActiveTab('Details'); setActionsOpen(false); }}>View details</button>
								{tournament.format === 'SingleEliminationBracket' ? <button type="button" className="rounded px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setActiveTab('Knockout Bracket'); setActionsOpen(false); }}>View bracket</button> : null}
								<button type="button" className="rounded px-3 py-2 text-left hover:bg-slate-50" onClick={() => { setActiveTab('Matches'); setActionsOpen(false); }}>View matches</button>
								{canManage ? <button type="button" className="rounded px-3 py-2 text-left text-red-700 hover:bg-red-50" onClick={onDelete}>Delete tournament</button> : null}
							</div>
						) : null}
						{canManage ? <Button type="button" variant="ghost" className="px-2" icon={<Trash2 size={16} />} onClick={onDelete} aria-label="Delete tournament" /> : null}
					</div>
				</header>
				<div className="border-b border-slate-200 px-4">
					<div className="flex gap-6 overflow-x-auto text-sm font-semibold">
						{tabs.map((tab) => {
							const tabKey = tab.startsWith('Players') ? 'Players' : tab;
							const isActive = activeTab === tabKey;
							return (
								<button key={tab} type="button" className={isActive ? 'border-b-2 border-ink py-3 text-ink' : 'py-3 text-slate-500 hover:text-ink'} onClick={() => setActiveTab(tabKey as typeof activeTab)}>
									{tab}
								</button>
							);
						})}
					</div>
				</div>
				<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div className="grid gap-4">
						{activeTab === 'Overview' ? <TournamentOverview tournament={tournament} /> : null}
						{activeTab === 'League' ? <LeagueStagePlaceholder tournament={tournament} /> : null}
						{activeTab === 'Knockout Bracket' && tournament.format === 'SingleEliminationBracket' ? (
							<BracketPanel leagueId={leagueId} tournament={tournament} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
						) : null}
						{activeTab === 'Knockout Bracket' && tournament.format !== 'SingleEliminationBracket' ? (
							<DartsPanel leagueId={leagueId} tournament={tournament} activeRound={activeRound} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
						) : null}
						{activeTab === 'Matches' ? <MatchesList matches={tournament.matches} memberNames={memberNames} onView={(match) => setSelectedMatchId(match.id)} /> : null}
						{activeTab === 'Players' ? <PlayersTable tournament={tournament} /> : null}
						{activeTab === 'Details' ? <TournamentDetails tournament={tournament} /> : null}
						{activeTab === 'Overview' ? <RecentResults matches={recentResults} memberNames={memberNames} onViewAll={() => setActiveTab('Matches')} /> : null}
					</div>
					<aside className="grid content-start gap-4">
						<SideCard title="Next match">
							{nextMatch ? <NextMatchLarge match={nextMatch} memberNames={memberNames} tournament={tournament} onView={() => setSelectedMatchId(nextMatch.id)} /> : <p className="text-sm text-slate-600">No scheduled match.</p>}
						</SideCard>
						<SideCard title="Tournament progress">
							<ProgressSummary tournament={tournament} />
						</SideCard>
						<SideCard title="Players">
							<PlayerList participants={tournament.participants} />
						</SideCard>
					</aside>
				</div>
			</article>
		</section>
	);
}

function TournamentOverview({ tournament }: { tournament: Tournament }) {
	return (
		<div className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-2">
			<div>
				<h3 className="text-xs font-bold uppercase text-slate-500">Format</h3>
				<div className="mt-3 grid gap-2 text-sm text-slate-700">
					<p>{structureLabel(tournament)}</p>
					{gameRulesSummary(tournament).map((rule) => <p key={rule}>{rule}</p>)}
				</div>
			</div>
			<div>
				<h3 className="text-xs font-bold uppercase text-slate-500">About</h3>
				<p className="mt-3 text-sm leading-6 text-slate-600">
					{tournament.gameType === 'DartsHighestScore'
						? 'Each player has the round time limit to score as many points as possible. After each round, the lowest scoring players are eliminated.'
						: isDartsTournament(tournament)
							? 'Players reduce their score to exactly 0 to win the leg, using the selected double-in and double-out rules.'
							: 'Players compete head to head using the selected frame format and table rules.'}
				</p>
			</div>
		</div>
	);
}

function RecentResults({ matches, memberNames, onViewAll }: { matches: TournamentMatch[]; memberNames: Map<string, string>; onViewAll: () => void }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<div className="flex justify-between gap-3">
				<h3 className="font-bold text-ink">Recent results</h3>
				<button type="button" className="text-xs font-semibold text-blue-700" onClick={onViewAll}>View all matches</button>
			</div>
			<div className="mt-3 grid gap-2">
				{matches.length === 0 ? <p className="text-sm text-slate-600">No completed matches yet.</p> : null}
				{matches.map((match) => (
					<div key={match.id} className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
						<span>{memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD'}</span>
						<span className="font-bold text-ink">{match.playerOneScore ?? '-'} - {match.playerTwoScore ?? '-'}</span>
						<span>{memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD'}</span>
						<span className="text-xs text-slate-500">Round {match.roundNumber}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function LeagueStagePlaceholder({ tournament }: { tournament: Tournament }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">League stage</h3>
			<p className="mt-2 text-sm leading-6 text-slate-600">
				This tournament is set up as {structureLabel(tournament).toLowerCase()}. League table scheduling is ready for the next scoring pass; the knockout bracket is already generated from the selected players.
			</p>
		</div>
	);
}

function MatchesList({ matches, memberNames, onView }: { matches: TournamentMatch[]; memberNames: Map<string, string>; onView: (match: TournamentMatch) => void }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">Matches</h3>
			<div className="mt-3 grid gap-2">
				{matches.length === 0 ? <p className="text-sm text-slate-600">No matches have been generated yet.</p> : null}
				{matches.map((match) => (
					<button key={match.id} type="button" className="grid gap-2 rounded-md border border-slate-200 px-3 py-3 text-left hover:border-slate-300 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center" onClick={() => onView(match)}>
						<span className="font-semibold text-ink">{memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD'}</span>
						<span className="text-sm font-bold text-slate-500">{match.playerOneScore ?? '-'} - {match.playerTwoScore ?? '-'}</span>
						<span className="font-semibold text-ink">{memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD'}</span>
						<StatusBadge label={match.status} tone={match.status === 'Completed' ? 'good' : 'neutral'} />
					</button>
				))}
			</div>
		</div>
	);
}

function PlayersTable({ tournament }: { tournament: Tournament }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">Players</h3>
			<div className="mt-3 divide-y divide-slate-100">
				{tournament.participants.map((participant) => (
					<div key={participant.leagueMemberId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2 text-sm">
						<span className="text-slate-500">#{participant.seed}</span>
						<span className="font-semibold text-ink">{participant.displayName}</span>
						<StatusBadge label={participant.isEliminated ? 'Eliminated' : 'Active'} tone={participant.isEliminated ? 'neutral' : 'good'} />
					</div>
				))}
			</div>
		</div>
	);
}

function TournamentDetails({ tournament }: { tournament: Tournament }) {
	const rules = [
		`Structure: ${structureLabel(tournament)}`,
		`Match format: ${matchFormatLabel(tournament)}`,
		tournament.gameType === 'Pool' ? `Break rule: ${breakRuleLabel(tournament)}` : null,
		tournament.gameType === 'Pool' && tournament.callShotRequired ? 'Call shot required' : null,
		tournament.gameType === 'Pool' && tournament.allowRerack ? 'Re-rack allowed' : null,
		tournament.gameType === 'Pool' && tournament.pushOutAfterFouls ? 'Push out after fouls' : null,
		isDartsTournament(tournament) && tournament.startScore ? `Start score: ${tournament.startScore}` : null,
		isDartsTournament(tournament) ? `${tournament.doubleInRequired ? 'Double in required' : 'Double in not required'}` : null,
		isDartsTournament(tournament) ? `${tournament.doubleOutRequired ? 'Double out required' : 'Double out not required'}` : null,
		tournament.roundTimeLimitMinutes ? `Round time limit: ${tournament.roundTimeLimitMinutes} minutes` : null
	].filter(Boolean);

	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<h3 className="font-bold text-ink">Details</h3>
			<div className="mt-3 grid gap-2 text-sm text-slate-700">
				{rules.map((rule) => <p key={rule}>{rule}</p>)}
			</div>
		</div>
	);
}

function TournamentMatchView({ leagueId, tournament, match, canManage, memberNames, onBack, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; memberNames: Map<string, string>; onBack: () => void; onChanged: () => Promise<void> }) {
	const playerOne = memberNames.get(match.playerOneMemberId ?? '') ?? 'TBD';
	const playerTwo = memberNames.get(match.playerTwoMemberId ?? '') ?? 'TBD';
	const isLiveDartsMatch = tournament.gameType === 'Darts301' || tournament.gameType === 'Darts501';
	const [winnerMemberId, setWinnerMemberId] = useState(match.winnerMemberId ?? match.playerOneMemberId ?? '');
	const [playerOneScore, setPlayerOneScore] = useState(match.playerOneScore?.toString() ?? '');
	const [playerTwoScore, setPlayerTwoScore] = useState(match.playerTwoScore?.toString() ?? '');
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!winnerMemberId || !canManage || match.status === 'Completed') {
			return;
		}

		setIsSaving(true);
		setError('');
		try {
			await leagueService.completeTournamentMatch(leagueId, tournament.id, match.id, {
				winnerMemberId,
				playerOneScore: playerOneScore ? Number(playerOneScore) : null,
				playerTwoScore: playerTwoScore ? Number(playerTwoScore) : null
			});
			await onChanged();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not save match.');
			setIsSaving(false);
		}
	}

	return (
		<section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink" onClick={onBack}>
					<ArrowLeft size={16} /> Back to tournament
				</button>
				<Button type="button" variant="ghost" className="px-2" icon={<X size={16} />} onClick={onBack} aria-label="Close match" />
			</div>
			<div className="mt-6 grid gap-5 text-center">
				<MatchScoreHeader tournament={tournament} match={match} playerOne={playerOne} playerTwo={playerTwo} />
				{isLiveDartsMatch ? (
					<LiveDartsScorer
						leagueId={leagueId}
						tournament={tournament}
						match={match}
						canManage={canManage}
						playerOne={playerOne}
						playerTwo={playerTwo}
						onChanged={onChanged}
					/>
				) : null}
				{isLiveDartsMatch ? null : (
				<div className="grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
					<div className="rounded-lg border border-slate-200 p-4 text-left">
						<h3 className="font-bold text-ink">Match info</h3>
						<div className="mt-3 grid gap-2 text-sm text-slate-600">
							<p>Round {match.roundNumber}</p>
							<p>{formatGameType(tournament)}</p>
							<p>{matchFormatLabel(tournament)}</p>
						</div>
					</div>
					<form className="grid gap-3 rounded-lg border border-slate-200 p-4 text-left" onSubmit={submit}>
						<h3 className="font-bold text-ink">Enter / update score</h3>
						<Field label="Winner">
							<SelectInput value={winnerMemberId} onChange={(event) => setWinnerMemberId(event.target.value)} disabled={!canManage || match.status === 'Completed'}>
								{match.playerOneMemberId ? <option value={match.playerOneMemberId}>{playerOne}</option> : null}
								{match.playerTwoMemberId ? <option value={match.playerTwoMemberId}>{playerTwo}</option> : null}
							</SelectInput>
						</Field>
						<div className="grid gap-3 sm:grid-cols-2">
							<Field label={playerOne}>
								<TextInput type="number" value={playerOneScore} onChange={(event) => setPlayerOneScore(event.target.value)} disabled={!canManage || match.status === 'Completed'} />
							</Field>
							<Field label={playerTwo}>
								<TextInput type="number" value={playerTwoScore} onChange={(event) => setPlayerTwoScore(event.target.value)} disabled={!canManage || match.status === 'Completed'} />
							</Field>
						</div>
						{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
						<Button type="submit" loading={isSaving} loadingLabel="Saving..." disabled={!canManage || match.status === 'Completed'}>Save match</Button>
					</form>
				</div>
				)}
			</div>
		</section>
	);
}

function MatchScoreHeader({ tournament, match, playerOne, playerTwo }: { tournament: Tournament; match: TournamentMatch; playerOne: string; playerTwo: string }) {
	return (
		<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
			<div><Avatar name={playerOne} large /><p className="mt-2 font-bold text-ink">{playerOne}</p></div>
			<div>
				<p className="text-3xl font-bold text-ink">{match.playerOneScore ?? 0} - {match.playerTwoScore ?? 0}</p>
				<p className="mt-1 text-sm font-semibold text-slate-500">{matchFormatLabel(tournament)}</p>
			</div>
			<div><Avatar name={playerTwo} large tone="green" /><p className="mt-2 font-bold text-ink">{playerTwo}</p></div>
		</div>
	);
}

type DartsLegResult = {
	winnerMemberId: string;
	winnerName: string;
	playerOneRemaining: number;
	playerTwoRemaining: number;
	playerOneLegs: number;
	playerTwoLegs: number;
};

function LiveDartsScorer({ leagueId, tournament, match, canManage, playerOne, playerTwo, onChanged }: { leagueId: string; tournament: Tournament; match: TournamentMatch; canManage: boolean; playerOne: string; playerTwo: string; onChanged: () => Promise<void> }) {
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
			setLegHistory((history) => [
				...history,
				{
					winnerMemberId: activePlayerId,
					winnerName,
					playerOneRemaining: activePlayerId === playerOneId ? 0 : playerOneRemaining,
					playerTwoRemaining: activePlayerId === playerTwoId ? 0 : playerTwoRemaining,
					playerOneLegs: nextPlayerOneLegs,
					playerTwoLegs: nextPlayerTwoLegs
				}
			]);
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
		<div className={active ? 'rounded-lg border border-blue-500 bg-blue-50/30 p-4' : 'rounded-lg border border-slate-200 p-4'}>
			<Avatar name={name} large tone={tone === 'green' ? 'green' : 'blue'} />
			<p className="mt-2 font-bold text-ink">{name}</p>
			<p className="mt-4 rounded-md border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600">{score}</p>
			<p className="mt-4 text-xs font-bold uppercase text-slate-500">Current score</p>
			<p className="mt-1 text-3xl font-bold text-ink">{remaining}</p>
			<p className="mt-2 text-xs font-semibold text-slate-500">{active ? 'To throw' : 'Waiting'}</p>
		</div>
	);
}
