import { useMemo, useState } from 'react';
import { CheckCircle, Circle, Plus, Search } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { SelectInput, TextInput } from '../../../../components/FormField';
import { leagueService } from '../../../../services/leagueService';
import type { PubGolfHole, Tournament } from '../../../../services/types';
import { formatDate } from './helpers';
import { getPubGolfHazard } from './pubGolfHazards';
import { Avatar } from './Shared';

type PubGolfTab = 'Overview' | 'Leaderboard' | 'Scorecards' | 'Course' | 'Players' | 'Details';

export function PubGolfDetail({ leagueId, tournament, canManage, onChanged }: { leagueId: string; tournament: Tournament; canManage: boolean; onChanged: () => Promise<void> }) {
	const [activeTab, setActiveTab] = useState<PubGolfTab>('Overview');
	const [selectedHoleId, setSelectedHoleId] = useState<string | null>(null);
	const standings = useMemo(() => getPubGolfStandings(tournament), [tournament]);
	const progress = getPubGolfProgress(tournament);
	const selectedHole = tournament.pubGolfHoles.find((hole) => hole.id === selectedHoleId) ?? null;

	if (selectedHole) {
		return <PubGolfHoleDetails hole={selectedHole} onBack={() => setSelectedHoleId(null)} />;
	}

	return (
		<>
			<div className="border-b border-slate-200 px-4">
				<div className="flex gap-6 overflow-x-auto text-sm font-semibold">
					{(['Overview', 'Leaderboard', 'Scorecards', 'Course', 'Players', 'Details'] as PubGolfTab[]).map((tab) => (
						<button key={tab} type="button" className={activeTab === tab ? 'border-b-2 border-ink py-3 text-ink' : 'py-3 text-slate-500 hover:text-ink'} onClick={() => setActiveTab(tab)}>
							{tab}
						</button>
					))}
				</div>
			</div>
			<div className="grid gap-4 p-4">
				{activeTab === 'Overview' ? <PubGolfOverview tournament={tournament} standings={standings} progress={progress} /> : null}
				{activeTab === 'Leaderboard' ? <PubGolfLeaderboard standings={standings} /> : null}
				{activeTab === 'Scorecards' ? <PubGolfScorecards tournament={tournament} standings={standings} /> : null}
				{activeTab === 'Course' ? <PubGolfCourse tournament={tournament} onSelectHole={setSelectedHoleId} /> : null}
				{activeTab === 'Players' ? <PubGolfPlayers tournament={tournament} /> : null}
				{activeTab === 'Details' ? <PubGolfDetails tournament={tournament} /> : null}
				{canManage && progress.currentHole ? <PubGolfScoreEntry leagueId={leagueId} tournament={tournament} hole={progress.currentHole} onChanged={onChanged} /> : null}
			</div>
		</>
	);
}

function PubGolfOverview({ tournament, standings, progress }: { tournament: Tournament; standings: PubGolfStanding[]; progress: PubGolfProgress }) {
	const leader = standings[0];
	const nextHole = tournament.pubGolfHoles[Math.min(progress.completed + 1, tournament.pubGolfHoles.length - 1)] ?? progress.currentHole;
	return (
		<div className="grid gap-4">
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<PubGolfSummaryCard title="Current hole" value={`Hole ${progress.currentHole?.holeNumber ?? 0} / ${progress.total}`} detail={progress.currentHole ? `${progress.currentHole.venue} · Par ${progress.currentHole.par}` : 'No holes'} />
				<PubGolfSummaryCard title="Leader" value={leader ? leader.displayName : '-'} detail={leader ? `${leader.totalScore} (${formatToPar(leader.toPar)})` : 'No scores'} />
				<PubGolfSummaryCard title="Course progress" value={`${progress.completed} / ${progress.total}`} detail="Holes completed" />
				<PubGolfSummaryCard title="Next hole" value={nextHole?.venue ?? '-'} detail={nextHole ? `Par ${nextHole.par}` : 'Course complete'} />
			</div>
			<PubGolfLeaderboard standings={standings.slice(0, 3)} compact />
		</div>
	);
}

function PubGolfLeaderboard({ standings, compact = false }: { standings: PubGolfStanding[]; compact?: boolean }) {
	return (
		<div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
			<table className="min-w-[34rem] w-full text-left text-sm">
				<thead className="bg-slate-50 text-xs uppercase text-slate-500">
					<tr><th className="p-3">Position</th><th className="p-3">Player</th><th className="p-3 text-right">Played</th><th className="p-3 text-right">Total score</th><th className="p-3 text-right">To par</th></tr>
				</thead>
				<tbody>
					{standings.map((row, index) => (
						<tr key={row.leagueMemberId} className="border-t border-slate-100">
							<td className="p-3 font-bold">{index + 1}</td>
							<td className="p-3"><span className="inline-flex items-center gap-2"><Avatar name={row.displayName} tone={index % 2 ? 'green' : 'blue'} /> {row.displayName}</span></td>
							<td className="p-3 text-right">{row.played} / {row.totalHoles}</td>
							<td className="p-3 text-right font-bold">{row.totalScore}</td>
							<td className="p-3 text-right">{formatToPar(row.toPar)}</td>
						</tr>
					))}
				</tbody>
			</table>
			{standings.length === 0 ? <p className="border-t border-slate-100 p-6 text-center text-sm text-slate-600">No scores entered yet.</p> : null}
			{compact ? null : null}
		</div>
	);
}

function PubGolfScorecards({ tournament, standings }: { tournament: Tournament; standings: PubGolfStanding[] }) {
	const [memberId, setMemberId] = useState(standings[0]?.leagueMemberId ?? '');
	const selected = standings.find((standing) => standing.leagueMemberId === memberId) ?? standings[0];
	return (
		<div className="grid gap-3">
			<SelectInput className="max-w-56" value={selected?.leagueMemberId ?? ''} onChange={(event) => setMemberId(event.target.value)}>
				{standings.map((standing) => <option key={standing.leagueMemberId} value={standing.leagueMemberId}>{standing.displayName}</option>)}
			</SelectInput>
			<div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
				<table className="min-w-[34rem] w-full text-left text-sm">
					<thead className="bg-slate-50 text-xs uppercase text-slate-500">
						<tr><th className="p-3">Hole</th><th className="p-3">Venue</th><th className="p-3 text-right">Par</th><th className="p-3 text-right">Score</th><th className="p-3 text-right">To par</th></tr>
					</thead>
					<tbody>
						{tournament.pubGolfHoles.map((hole) => {
							const score = tournament.pubGolfScores.find((entry) => entry.holeId === hole.id && entry.leagueMemberId === selected?.leagueMemberId)?.score ?? null;
							return (
								<tr key={hole.id} className="border-t border-slate-100">
									<td className="p-3 font-bold">{hole.holeNumber}</td><td className="p-3">{hole.venue}</td><td className="p-3 text-right">{hole.par}</td><td className="p-3 text-right">{score ?? '-'}</td><td className="p-3 text-right">{score == null ? '-' : formatToPar(score - hole.par)}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function PubGolfCourse({ tournament, onSelectHole }: { tournament: Tournament; onSelectHole: (holeId: string) => void }) {
	return (
		<div className="grid gap-3">
			{tournament.pubGolfHoles.map((hole) => {
				const complete = tournament.participants.every((participant) => tournament.pubGolfScores.some((score) => score.holeId === hole.id && score.leagueMemberId === participant.leagueMemberId && score.score != null));
				return (
					<button key={hole.id} type="button" className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-ink/30" onClick={() => onSelectHole(hole.id)}>
						<span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 font-bold">{hole.holeNumber}</span>
						<span className="min-w-0">
							<span className="block font-bold text-ink">{hole.venue}</span>
							<span className="block text-sm text-slate-600">{hole.drink}</span>
							{hole.hazard ? <span className="mt-1 inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{hole.hazard}</span> : null}
						</span>
						<span className="grid justify-items-end gap-1 text-sm text-slate-600"><span>Par {hole.par}</span>{complete ? <CheckCircle size={18} className="text-ink" /> : <Circle size={18} />}</span>
					</button>
				);
			})}
		</div>
	);
}

function PubGolfHoleDetails({ hole, onBack }: { hole: PubGolfHole; onBack: () => void }) {
	const hazard = getPubGolfHazard(hole.hazard);

	return (
		<div className="grid gap-4">
			<button type="button" className="text-left text-sm font-semibold text-slate-600 hover:text-ink" onClick={onBack}>Back to course</button>
			<div className="rounded-lg border border-slate-200 bg-white p-4">
				<h3 className="text-xl font-bold text-ink">{hole.venue}</h3>
				<div className="mt-4 grid gap-3 divide-y divide-slate-100 text-sm">
					<DetailLine label="Drink" value={hole.drink} />
					<DetailLine label="Par" value={`${hole.par}`} />
					<DetailLine label="Hole rule" value={hole.holeRule || 'None'} />
					<DetailLine label="Hazard" value={hole.hazard || 'None'} />
					{hazard ? <DetailLine label="Hazard detail" value={hazard.description} /> : null}
					<DetailLine label="Penalty" value={hole.penalty ? `+${hole.penalty} strokes` : 'None'} />
					<DetailLine label="Notes" value={hole.notes || 'None'} />
				</div>
			</div>
		</div>
	);
}

function PubGolfPlayers({ tournament }: { tournament: Tournament }) {
	const [search, setSearch] = useState('');
	const players = tournament.participants.filter((participant) => participant.displayName.toLowerCase().includes(search.trim().toLowerCase()));
	return (
		<div className="grid gap-3">
			<div className="relative">
				<Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
				<TextInput className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players..." />
			</div>
			{players.map((participant, index) => (
				<div key={participant.leagueMemberId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
					<Avatar name={participant.displayName} tone={index % 2 ? 'green' : 'blue'} />
					<span className="font-semibold text-ink">{participant.displayName}</span>
					<span className="text-slate-500">{participant.totalScore} total</span>
				</div>
			))}
		</div>
	);
}

function PubGolfDetails({ tournament }: { tournament: Tournament }) {
	const coursePar = tournament.pubGolfHoles.reduce((total, hole) => total + hole.par, 0);
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
			<DetailLine label="Tournament name" value={tournament.name} />
			<DetailLine label="Game type" value="Pub Golf" />
			<DetailLine label="Started" value={formatDate(tournament.createdAt)} />
			<DetailLine label="Holes" value={`${tournament.pubGolfHoles.length}`} />
			<DetailLine label="Total par" value={`${coursePar}`} />
			<DetailLine label="Players" value={`${tournament.participantCount}`} />
			<DetailLine label="General rules" value="Play the course in order. Be respectful and drink responsibly." />
		</div>
	);
}

function PubGolfScoreEntry({ leagueId, tournament, hole, onChanged }: { leagueId: string; tournament: Tournament; hole: PubGolfHole; onChanged: () => Promise<void> }) {
	const [scores, setScores] = useState<Record<string, string>>(() => Object.fromEntries(tournament.participants.map((participant) => [
		participant.leagueMemberId,
		String(tournament.pubGolfScores.find((score) => score.holeId === hole.id && score.leagueMemberId === participant.leagueMemberId)?.score ?? '')
	])));
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');

	async function saveScores() {
		setIsSaving(true);
		setError('');
		try {
			await leagueService.scorePubGolfHole(leagueId, tournament.id, hole.id, Object.fromEntries(Object.entries(scores).map(([memberId, score]) => [memberId, score ? Number(score) : null])));
			await onChanged();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not save scores.');
			setIsSaving(false);
		}
	}

	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4">
			<h3 className="font-bold text-ink">Score entry</h3>
			<p className="mt-1 text-sm text-slate-600">Hole {hole.holeNumber} - {hole.venue} (Par {hole.par})</p>
			{hole.hazard ? (
				<p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					<span className="font-semibold text-ink">{hole.hazard}:</span> {getPubGolfHazard(hole.hazard)?.description ?? 'Apply the configured hazard rule.'}
					{hole.penalty ? ` Penalty: +${hole.penalty} strokes.` : ''}
				</p>
			) : null}
			<div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200">
				{tournament.participants.map((participant, index) => (
					<label key={participant.leagueMemberId} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 bg-white px-3 py-2">
						<span className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><Avatar name={participant.displayName} tone={index % 2 ? 'green' : 'blue'} /> {participant.displayName}</span>
						<TextInput type="number" min="1" max="20" value={scores[participant.leagueMemberId] ?? ''} onChange={(event) => setScores((current) => ({ ...current, [participant.leagueMemberId]: event.target.value }))} />
					</label>
				))}
			</div>
			<div className="mt-4 flex justify-end"><Button type="button" icon={<Plus size={16} />} loading={isSaving} loadingLabel="Saving..." onClick={saveScores}>Save scores</Button></div>
			{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
		</div>
	);
}

function PubGolfSummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
	return <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold text-ink">{value}</p><p className="mt-1 text-sm text-slate-600">{detail}</p></div>;
}

function DetailLine({ label, value }: { label: string; value: string }) {
	return <div className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[10rem_minmax(0,1fr)]"><span className="font-semibold text-slate-500">{label}</span><span className="text-ink">{value}</span></div>;
}

type PubGolfStanding = { leagueMemberId: string; displayName: string; played: number; totalHoles: number; totalScore: number; toPar: number };
type PubGolfProgress = { completed: number; total: number; currentHole: PubGolfHole | null };

function getPubGolfStandings(tournament: Tournament): PubGolfStanding[] {
	return tournament.participants.map((participant) => {
		const entries = tournament.pubGolfScores.filter((score) => score.leagueMemberId === participant.leagueMemberId && score.score != null);
		const totalScore = entries.reduce((total, score) => total + (score.score ?? 0), 0);
		const playedPar = entries.reduce((total, score) => total + (tournament.pubGolfHoles.find((hole) => hole.id === score.holeId)?.par ?? 0), 0);
		return { leagueMemberId: participant.leagueMemberId, displayName: participant.displayName, played: entries.length, totalHoles: tournament.pubGolfHoles.length, totalScore, toPar: totalScore - playedPar };
	}).sort((left, right) => left.totalScore - right.totalScore || left.displayName.localeCompare(right.displayName));
}

function getPubGolfProgress(tournament: Tournament): PubGolfProgress {
	const completed = tournament.pubGolfHoles.filter((hole) => tournament.participants.every((participant) => tournament.pubGolfScores.some((score) => score.holeId === hole.id && score.leagueMemberId === participant.leagueMemberId && score.score != null))).length;
	return { completed, total: tournament.pubGolfHoles.length, currentHole: tournament.pubGolfHoles[Math.min(completed, tournament.pubGolfHoles.length - 1)] ?? null };
}

function formatToPar(value: number) {
	if (value === 0) {
		return 'E';
	}
	return value > 0 ? `+${value}` : `${value}`;
}
