import { useMemo } from 'react';
import type { Tournament, TournamentMatch } from '../../../../services/types';
import { bracketMatches, groupMatchesByRound, matchFormatLabel, roundTitle } from './helpers';

export function BracketPanel({ tournament, memberNames, onViewMatch }: { leagueId: string; tournament: Tournament; canManage: boolean; memberNames: Map<string, string>; onChanged: () => Promise<void>; onViewMatch?: (match: TournamentMatch) => void }) {
	const rounds = useMemo(() => buildBracketRounds(tournament), [tournament]);
	const roundTops = useMemo(() => getBracketRoundTops(rounds), [rounds]);
	const firstRoundMatchCount = rounds[0]?.[1].length ?? 0;
	const bracketHeight = Math.max(
		BracketLayout.matchHeightRem,
		...(roundTops.at(-1) ?? []).map((top) => top + BracketLayout.matchHeightRem),
		firstRoundMatchCount > 0 ? ((firstRoundMatchCount - 1) * BracketLayout.matchStepRem) + BracketLayout.matchHeightRem : BracketLayout.matchHeightRem
	);

	return (
		<div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
			<div className="grid min-w-[920px] items-start gap-16" style={{ gridTemplateColumns: `repeat(${Math.max(rounds.length, 1)}, minmax(13rem, 1fr))` }}>
				{rounds.map(([roundNumber, matches], roundIndex) => (
					<div
						key={roundNumber}
						className="grid content-start gap-4"
					>
						<div>
							<h3 className="text-sm font-bold text-ink">{roundTitle(roundNumber, rounds.length)}</h3>
							<p className="text-xs text-slate-500">{matches.find(Boolean) ? matchFormatLabel(tournament, matches.find(Boolean)) : matchFormatLabel(tournament)}</p>
						</div>
						<div className="relative" style={{ height: `${bracketHeight}rem` }}>
							{matches.map((match, matchIndex) => (
								<BracketMatch
									key={match?.id ?? `${roundNumber}-${matchIndex}`}
									tournament={tournament}
									match={match}
									memberNames={memberNames}
									top={roundTops[roundIndex]?.[matchIndex] ?? 0}
									isFirstRound={roundIndex === 0}
									isFinalRound={roundIndex === rounds.length - 1}
									onViewMatch={onViewMatch}
								/>
							))}
						</div>
					</div>
				))}
			</div>
			<div className="mt-4 flex gap-4 text-xs font-semibold text-slate-500">
				<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Won</span>
				<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Scheduled</span>
				<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-100 ring-1 ring-slate-200" /> TBD</span>
			</div>
		</div>
	);
}

const BracketLayout = {
	matchHeightRem: 4.5,
	matchStepRem: 6.5
} as const;

function BracketMatch({ tournament, match, memberNames, top, isFirstRound, isFinalRound, onViewMatch }: { tournament: Tournament; match: TournamentMatch | null; memberNames: Map<string, string>; top: number; isFirstRound: boolean; isFinalRound: boolean; onViewMatch?: (match: TournamentMatch) => void }) {
	const canOpen = Boolean(match && onViewMatch && match.playerOneMemberId && match.playerTwoMemberId);
	return (
		<button
			type="button"
			disabled={!canOpen}
			className={`absolute left-0 right-0 grid gap-0 overflow-visible rounded-md border border-slate-200 bg-white text-left text-sm shadow-sm ${isFirstRound ? '' : 'before:absolute before:right-full before:top-1/2 before:hidden before:h-px before:w-16 before:bg-slate-300 md:before:block'} ${isFinalRound ? '' : 'after:absolute after:left-full after:top-1/2 after:hidden after:h-px after:w-16 after:bg-slate-300 md:after:block'} ${canOpen ? 'hover:border-ink/30' : 'cursor-default'}`}
			style={{ top: `${top}rem`, height: `${BracketLayout.matchHeightRem}rem` }}
			onClick={() => match && canOpen && onViewMatch?.(match)}
		>
			<BracketPlayer name={memberNames.get(match?.playerOneMemberId ?? '') ?? 'TBD'} score={match?.playerOneScore} won={Boolean(match?.winnerMemberId && match.winnerMemberId === match.playerOneMemberId)} muted={!match?.playerOneMemberId} />
			<BracketPlayer name={memberNames.get(match?.playerTwoMemberId ?? '') ?? 'TBD'} score={match?.playerTwoScore} won={Boolean(match?.winnerMemberId && match.winnerMemberId === match.playerTwoMemberId)} muted={!match?.playerTwoMemberId} />
			<span className="sr-only">{match ? `${match.groupName ?? matchFormatLabel(tournament, match)} ${match.status}` : 'Future bracket match'}</span>
		</button>
	);
}

function getBracketRoundTops(rounds: Array<[number, Array<TournamentMatch | null>]>) {
	const roundTops: number[][] = [];
	for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
		const matches = rounds[roundIndex][1];
		if (roundIndex === 0) {
			roundTops.push(matches.map((_, matchIndex) => matchIndex * BracketLayout.matchStepRem));
			continue;
		}

		const previousTops = roundTops[roundIndex - 1];
		roundTops.push(matches.map((_, matchIndex) => {
			const firstFeederTop = previousTops[matchIndex * 2] ?? previousTops.at(-1) ?? 0;
			const secondFeederTop = previousTops[(matchIndex * 2) + 1];
			if (secondFeederTop == null) {
				return firstFeederTop;
			}

			return ((firstFeederTop + secondFeederTop) / 2);
		}));
	}

	return roundTops;
}

function BracketPlayer({ name, score, won, muted = false }: { name: string; score?: number | null; won: boolean; muted?: boolean }) {
	return (
		<div className={`flex min-h-9 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 ${won ? 'bg-emerald-50 font-bold text-emerald-900' : muted ? 'text-slate-400' : 'text-slate-700'}`}>
			<span className="truncate">{name}</span>
			<span className="font-bold">{score ?? '-'}</span>
		</div>
	);
}

function buildBracketRounds(tournament: Tournament): Array<[number, Array<TournamentMatch | null>]> {
	const matches = bracketMatches(tournament);
	const grouped = groupMatchesByRound(matches).map(([roundNumber, roundMatches]) => [
		roundNumber,
		[...roundMatches].sort((left, right) => left.matchNumber - right.matchNumber)
	] as [number, TournamentMatch[]]);

	const firstRoundMatchCount = grouped[0]?.[1].length ?? 0;
	if (firstRoundMatchCount === 0) {
		return [];
	}

	const totalRounds = Math.max(grouped.length, Math.ceil(Math.log2(firstRoundMatchCount * 2)));
	const rounds: Array<[number, Array<TournamentMatch | null>]> = [];
	for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber += 1) {
		const existing = grouped.find(([candidateRound]) => candidateRound === roundNumber)?.[1] ?? [];
		const expectedMatchCount = Math.max(1, Math.ceil(firstRoundMatchCount / 2 ** (roundNumber - 1)));
		rounds.push([
			roundNumber,
			Array.from({ length: expectedMatchCount }, (_, index) => existing[index] ?? null)
		]);
	}

	return rounds;
}
