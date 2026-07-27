import { useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Target, Trash2, Trophy, Users } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { StatusBadge } from '../../../../components/StatusBadge';
import type { Tournament } from '../../../../services/types';
import { formatDate, formatGameType, getNextMatch, getStatusTone, matchFormatLabel } from './helpers';
import { GameArtwork, Meta } from './Shared';
import { BracketPanel } from './TournamentBracket';
import { DartsPanel } from './TournamentDartsRounds';
import { LeagueStagePlaceholder, MatchesList, PlayersTable, RecentResults, TournamentDetailsPanel, TournamentOverview } from './TournamentDetailPanels';
import { TournamentMatchView } from './TournamentMatchView';
import { NextMatchLarge, PlayerList, ProgressSummary, SideCard } from './TournamentSidebar';
import { PubGolfDetail } from './PubGolfDetail';

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
	const isPubGolf = tournament.gameType === 'PubGolf';

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
							<Meta icon={<Trophy size={15} />} label={isPubGolf ? `${tournament.pubGolfHoles.length || 9} holes` : tournament.format === 'SingleEliminationBracket' ? matchFormatLabel(tournament) : `Eliminate ${tournament.eliminatePerRound} each round`} />
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
				{isPubGolf ? null : <div className="border-b border-slate-200 px-4">
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
				</div>}
				{isPubGolf ? (
					<PubGolfDetail leagueId={leagueId} tournament={tournament} canManage={canManage} onChanged={onChanged} />
				) : <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
						{activeTab === 'Details' ? <TournamentDetailsPanel tournament={tournament} /> : null}
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
				</div>}
			</article>
		</section>
	);
}
