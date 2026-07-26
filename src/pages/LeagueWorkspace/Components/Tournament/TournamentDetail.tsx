import { ArrowLeft, Calendar, Target, Trash2, Trophy, Users } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { formatDate, formatGameType, gameRulesSummary, getNextMatch, getStatusTone, isDartsTournament, matchFormatLabel } from './helpers';
import { GameArtwork, Meta } from './Shared';
import { BracketPanel } from './TournamentBracket';
import { DartsPanel } from './TournamentDartsRounds';
import { NextMatchLarge, PlayerList, ProgressSummary, SideCard } from './TournamentSidebar';

export function TournamentDetail({ leagueId, tournament, canManage, memberNames, onBack, onChanged, onDelete }: { leagueId: string; tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onBack: () => void; onChanged: () => Promise<void>; onDelete: () => Promise<void> }) {
	const nextMatch = getNextMatch(tournament);
	const recentResults = tournament.matches.filter((match) => match.status === 'Completed').slice(-4).reverse();
	const activeRound = tournament.rounds.find((round) => !round.isComplete);

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
					<div className="flex items-start gap-2">
						<Button type="button" variant="secondary">Actions</Button>
						{canManage ? <Button type="button" variant="ghost" className="px-2" icon={<Trash2 size={16} />} onClick={onDelete} aria-label="Delete tournament" /> : null}
					</div>
				</header>
				<div className="border-b border-slate-200 px-4">
					<div className="flex gap-6 overflow-x-auto text-sm font-semibold">
						<span className="border-b-2 border-ink py-3 text-ink">{isDartsTournament(tournament) ? 'Overview' : 'Bracket'}</span>
						{isDartsTournament(tournament) ? <span className="py-3 text-slate-500">Settings</span> : null}
						<span className="py-3 text-slate-500">Matches</span>
						<span className="py-3 text-slate-500">Players ({tournament.participantCount})</span>
						<span className="py-3 text-slate-500">Standings</span>
						<span className="py-3 text-slate-500">Details</span>
					</div>
				</div>
				<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<div className="grid gap-4">
						{isDartsTournament(tournament) ? <DartsTournamentOverview tournament={tournament} /> : null}
						{tournament.format === 'SingleEliminationBracket' ? (
							<BracketPanel leagueId={leagueId} tournament={tournament} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
						) : (
							<DartsPanel leagueId={leagueId} tournament={tournament} activeRound={activeRound} canManage={canManage} memberNames={memberNames} onChanged={onChanged} />
						)}
						<RecentResults matches={recentResults} memberNames={memberNames} />
					</div>
					<aside className="grid content-start gap-4">
						<SideCard title="Next match">
							{nextMatch ? <NextMatchLarge match={nextMatch} memberNames={memberNames} tournament={tournament} /> : <p className="text-sm text-slate-600">No scheduled match.</p>}
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

function DartsTournamentOverview({ tournament }: { tournament: Tournament }) {
	return (
		<div className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-2">
			<div>
				<h3 className="text-xs font-bold uppercase text-slate-500">Format</h3>
				<div className="mt-3 grid gap-2 text-sm text-slate-700">
					{gameRulesSummary(tournament).map((rule) => <p key={rule}>{rule}</p>)}
				</div>
			</div>
			<div>
				<h3 className="text-xs font-bold uppercase text-slate-500">About</h3>
				<p className="mt-3 text-sm leading-6 text-slate-600">
					{tournament.gameType === 'DartsHighestScore'
						? 'Each player has the round time limit to score as many points as possible. After each round, the lowest scoring players are eliminated.'
						: 'Players must start on a double and finish on a double. The first player to reduce their score to exactly 0 wins the leg.'}
				</p>
			</div>
		</div>
	);
}

function RecentResults({ matches, memberNames }: { matches: TournamentMatch[]; memberNames: Map<string, string> }) {
	return (
		<div className="rounded-lg border border-slate-200 p-4">
			<div className="flex justify-between gap-3">
				<h3 className="font-bold text-ink">Recent results</h3>
				<span className="text-xs font-semibold text-blue-700">View all matches</span>
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
