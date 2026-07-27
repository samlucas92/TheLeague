import { useMemo, useState } from 'react';
import { ArrowLeft, Bell, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Circle, Hand, MoreVertical, Minus, Plus, Search, Waves } from 'lucide-react';
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
	const [scoringHoleId, setScoringHoleId] = useState<string | null>(null);
	const standings = useMemo(() => getPubGolfStandings(tournament), [tournament]);
	const progress = getPubGolfProgress(tournament);
	const selectedHole = tournament.pubGolfHoles.find((hole) => hole.id === selectedHoleId) ?? null;
	const scoringHole = tournament.pubGolfHoles.find((hole) => hole.id === scoringHoleId) ?? null;

	if (selectedHole) {
		return <PubGolfHoleDetails hole={selectedHole} isCurrent={progress.currentHole?.id === selectedHole.id} onBack={() => setSelectedHoleId(null)} />;
	}

	if (scoringHole) {
		return <PubGolfScoreEntry leagueId={leagueId} tournament={tournament} hole={scoringHole} onBack={() => setScoringHoleId(null)} onChanged={onChanged} />;
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
				{activeTab === 'Overview' ? <PubGolfOverview tournament={tournament} standings={standings} progress={progress} canManage={canManage} onScoreHole={setScoringHoleId} /> : null}
				{activeTab === 'Leaderboard' ? <PubGolfLeaderboard standings={standings} /> : null}
				{activeTab === 'Scorecards' ? <PubGolfScorecards tournament={tournament} standings={standings} /> : null}
				{activeTab === 'Course' ? <PubGolfCourse tournament={tournament} currentHoleId={progress.currentHole?.id ?? null} onSelectHole={setSelectedHoleId} /> : null}
				{activeTab === 'Players' ? <PubGolfPlayers tournament={tournament} /> : null}
				{activeTab === 'Details' ? <PubGolfDetails tournament={tournament} /> : null}
			</div>
		</>
	);
}

function PubGolfOverview({ tournament, standings, progress, canManage, onScoreHole }: { tournament: Tournament; standings: PubGolfStanding[]; progress: PubGolfProgress; canManage: boolean; onScoreHole: (holeId: string) => void }) {
	const leader = standings[0];
	const nextHole = tournament.pubGolfHoles[Math.min(progress.completed + 1, tournament.pubGolfHoles.length - 1)] ?? progress.currentHole;
	const coursePar = tournament.pubGolfHoles.reduce((total, hole) => total + hole.par, 0);
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<PubGolfSummaryCard title="Current hole" value={`${progress.currentHole?.holeNumber ?? 0} / ${progress.total}`} detail={progress.currentHole ? `${progress.currentHole.venue}\nPar ${progress.currentHole.par}` : 'No holes'} progress={progress} />
				<PubGolfLeaderCard leader={leader} />
				<PubGolfSummaryCard title="Next hole" value={nextHole?.venue ?? '-'} detail={nextHole ? `Par ${nextHole.par}` : 'Course complete'} icon={<Bell size={22} />} />
				<PubGolfSummaryCard title="Course par" value={`${coursePar}`} detail="Total par" />
			</div>
			<PubGolfLeaderboard standings={standings.slice(0, 3)} compact />
			{canManage && progress.currentHole ? <Button type="button" icon={<Plus size={16} />} onClick={() => onScoreHole(progress.currentHole!.id)}>Enter current hole scores</Button> : null}
		</div>
	);
}

function PubGolfLeaderboard({ standings, compact = false }: { standings: PubGolfStanding[]; compact?: boolean }) {
	return (
		<div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
			<div className="border-b border-slate-100 px-3 py-3">
				<h3 className="font-bold text-ink">{compact ? 'Top 3' : 'Leaderboard'}</h3>
			</div>
			<table className="w-full min-w-[25rem] text-left text-sm">
				<thead className="bg-slate-50 text-xs uppercase text-slate-500">
					<tr><th className="p-3">Pos</th><th className="p-3">Player</th><th className="p-3 text-right">Played</th><th className="p-3 text-right">Score</th><th className="p-3 text-right">To par</th></tr>
				</thead>
				<tbody>
					{standings.map((row, index) => (
						<tr key={row.leagueMemberId} className="border-t border-slate-100">
							<td className="p-3 font-bold">{index + 1}</td>
							<td className="p-3"><span className="inline-flex items-center gap-2"><Avatar name={row.displayName} tone={index % 2 ? 'green' : 'blue'} /> {row.displayName}</span></td>
							<td className="p-3 text-right">{row.played} / {row.totalHoles}</td>
							<td className="p-3 text-right font-bold">{row.totalScore}</td>
							<td className={`p-3 text-right font-semibold ${toParClass(row.toPar)}`}>{formatToPar(row.toPar)}</td>
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
	const [view, setView] = useState<'mine' | 'all'>('mine');
	const [memberId, setMemberId] = useState(standings[0]?.leagueMemberId ?? '');
	const selected = standings.find((standing) => standing.leagueMemberId === memberId) ?? standings[0];
	const [holeIndex, setHoleIndex] = useState(0);
	const currentHole = tournament.pubGolfHoles[holeIndex] ?? tournament.pubGolfHoles[0];
	return (
		<div className="grid gap-4">
			<div className="grid grid-cols-2 rounded-md bg-slate-100 p-1 text-sm font-semibold">
				<button type="button" className={view === 'mine' ? 'rounded bg-white px-3 py-2 text-ink shadow-sm' : 'px-3 py-2 text-slate-600'} onClick={() => setView('mine')}>My Scorecard</button>
				<button type="button" className={view === 'all' ? 'rounded bg-white px-3 py-2 text-ink shadow-sm' : 'px-3 py-2 text-slate-600'} onClick={() => setView('all')}>All Players</button>
			</div>
			{view === 'all' ? <PubGolfLeaderboard standings={standings} /> : null}
			{view === 'mine' && selected ? (
				<>
					<label className="relative block">
						<SelectInput value={selected.leagueMemberId} onChange={(event) => setMemberId(event.target.value)}>
							{standings.map((standing) => <option key={standing.leagueMemberId} value={standing.leagueMemberId}>{standing.displayName}</option>)}
						</SelectInput>
						<ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16} />
					</label>
					<div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white text-center">
						<StatBox label="Total score" value={`${selected.totalScore}`} />
						<StatBox label="To par" value={formatToPar(selected.toPar)} className={toParClass(selected.toPar)} />
						<StatBox label="Holes played" value={`${selected.played} / ${selected.totalHoles}`} />
					</div>
					{currentHole ? (
						<div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
							<button type="button" className="inline-flex items-center gap-1 font-semibold text-slate-600" onClick={() => setHoleIndex(Math.max(0, holeIndex - 1))} disabled={holeIndex === 0}><ChevronLeft size={16} /> Previous</button>
							<div className="text-center">
								<p className="font-bold text-ink">Hole {currentHole.holeNumber} of {tournament.pubGolfHoles.length}</p>
								<p className="text-slate-600">{currentHole.venue}</p>
							</div>
							<button type="button" className="inline-flex items-center justify-end gap-1 font-semibold text-slate-600" onClick={() => setHoleIndex(Math.min(tournament.pubGolfHoles.length - 1, holeIndex + 1))} disabled={holeIndex >= tournament.pubGolfHoles.length - 1}>Next <ChevronRight size={16} /></button>
						</div>
					) : null}
					<div className="grid gap-3">
						{tournament.pubGolfHoles.map((hole) => {
							const score = tournament.pubGolfScores.find((entry) => entry.holeId === hole.id && entry.leagueMemberId === selected.leagueMemberId)?.score ?? null;
							const toPar = score == null ? null : score - hole.par;
							const isCurrent = hole.id === currentHole?.id;
							return <ScorecardHoleCard key={hole.id} hole={hole} score={score} toPar={toPar} isCurrent={isCurrent} />;
						})}
					</div>
				</>
			) : null}
		</div>
	);
}

function ScorecardHoleCard({ hole, score, toPar, isCurrent }: { hole: PubGolfHole; score: number | null; toPar: number | null; isCurrent: boolean }) {
	const complete = score != null;
	return (
		<div className={`grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-lg border bg-white p-3 ${isCurrent ? 'border-ink' : 'border-slate-200'}`}>
			<span className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-bold ${complete ? 'border-emerald-700 bg-emerald-700 text-white' : isCurrent ? 'border-ink bg-ink text-white' : 'border-slate-300 text-slate-500'}`}>
				{complete ? <CheckCircle size={15} /> : hole.holeNumber}
			</span>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="font-bold text-ink">{hole.venue}</p>
					{isCurrent ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Current</span> : null}
				</div>
				<p className="text-sm text-slate-600">{hole.drink}</p>
				<div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 text-center text-sm">
					<StatMini label="Par" value={`${hole.par}`} />
					<StatMini label="Score" value={score == null ? '-' : `${score}`} boxed />
					<StatMini label="To par" value={toPar == null ? '-' : formatToPar(toPar)} className={toPar == null ? '' : toParClass(toPar)} />
				</div>
			</div>
			<span />
		</div>
	);
}

function PubGolfCourse({ tournament, currentHoleId, onSelectHole }: { tournament: Tournament; currentHoleId: string | null; onSelectHole: (holeId: string) => void }) {
	return (
		<div className="grid gap-3">
			{tournament.pubGolfHoles.map((hole) => {
				const complete = tournament.participants.every((participant) => tournament.pubGolfScores.some((score) => score.holeId === hole.id && score.leagueMemberId === participant.leagueMemberId && score.score != null));
				const isCurrent = hole.id === currentHoleId;
				return (
					<button key={hole.id} type="button" className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-white p-3 text-left hover:border-ink/30 ${isCurrent ? 'border-ink' : 'border-slate-200'}`} onClick={() => onSelectHole(hole.id)}>
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

function PubGolfHoleDetails({ hole, isCurrent, onBack }: { hole: PubGolfHole; isCurrent: boolean; onBack: () => void }) {
	const hazard = getPubGolfHazard(hole.hazard);

	return (
		<div className="grid gap-5 p-4">
			<div className="flex items-center justify-between">
				<button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink" onClick={onBack}><ArrowLeft size={16} /> Back to course</button>
				<MoreVertical size={18} className="text-slate-500" />
			</div>
			<div className="grid gap-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink text-lg font-bold text-ink">{hole.holeNumber}</span>
						<h3 className="mt-4 text-2xl font-bold text-ink">{hole.venue}</h3>
						<p className="text-sm text-slate-600">{hole.drink}</p>
					</div>
					{isCurrent ? <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Current hole</span> : null}
				</div>
				<div className="divide-y divide-slate-100 border-y border-slate-100">
					<MobileDetailRow label="Par" value={`${hole.par}`} strong />
					<MobileDetailBlock icon={<Hand size={22} />} label="Hole rule" title={hole.holeRule || 'None'} body={hole.holeRule ? 'You must follow this rule while playing the hole.' : 'No extra rule for this hole.'} />
					<MobileDetailBlock icon={<Waves size={22} />} label="Hazard" title={hole.hazard || 'None'} body={hazard?.description ?? 'No hazard on this hole.'} />
					<MobileDetailBlock icon={<Plus size={22} />} label="Penalty" title={hole.penalty ? `+${hole.penalty} strokes` : 'None'} body={hole.penalty ? 'Added to your score if the rule is broken.' : 'No penalty configured.'} />
					<MobileDetailBlock icon={<Bell size={22} />} label="Notes" title={hole.notes || 'None'} body={hole.notes ? '' : 'No notes for this hole.'} />
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

function PubGolfScoreEntry({ leagueId, tournament, hole, onBack, onChanged }: { leagueId: string; tournament: Tournament; hole: PubGolfHole; onBack: () => void; onChanged: () => Promise<void> }) {
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
		<div className="grid gap-5 p-4">
			<button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-ink" onClick={onBack}><ArrowLeft size={16} /> Back</button>
			<header className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
				<div>
					<h3 className="text-2xl font-bold text-ink">Hole {hole.holeNumber} of {tournament.pubGolfHoles.length}</h3>
					<p className="mt-1 font-semibold text-ink">{hole.venue}</p>
					<p className="text-sm text-slate-600">{hole.drink}</p>
				</div>
				<span className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-ink">Par {hole.par}</span>
			</header>
			{hole.hazard ? (
				<p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					<span className="font-semibold text-ink">{hole.hazard}:</span> {getPubGolfHazard(hole.hazard)?.description ?? 'Apply the configured hazard rule.'}
					{hole.penalty ? ` Penalty: +${hole.penalty} strokes.` : ''}
				</p>
			) : null}
			<div className="grid gap-3">
				{tournament.participants.map((participant, index) => (
					<label key={participant.leagueMemberId} className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 bg-white py-1">
						<span className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><Avatar name={participant.displayName} tone={index % 2 ? 'green' : 'blue'} /> {participant.displayName}</span>
						<ScoreStepper value={scores[participant.leagueMemberId] ?? ''} onChange={(value) => setScores((current) => ({ ...current, [participant.leagueMemberId]: value }))} />
					</label>
				))}
			</div>
			<div className="mt-8"><Button type="button" className="w-full" loading={isSaving} loadingLabel="Saving..." onClick={saveScores}>Save scores</Button></div>
			{error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
		</div>
	);
}

function ScoreStepper({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	const numeric = value ? Number(value) : 0;
	function step(delta: number) {
		onChange(String(Math.max(1, numeric + delta)));
	}

	return (
		<div className="grid grid-cols-[2rem_1fr_2rem] overflow-hidden rounded-md border border-slate-200">
			<button type="button" className="grid min-h-9 place-items-center bg-slate-50 text-ink" onClick={() => step(-1)}><Minus size={15} /></button>
			<TextInput className="min-h-9 rounded-none border-0 text-center" type="number" min="1" max="20" value={value} onChange={(event) => onChange(event.target.value)} />
			<button type="button" className="grid min-h-9 place-items-center bg-slate-50 text-ink" onClick={() => step(1)}><Plus size={15} /></button>
		</div>
	);
}

function PubGolfSummaryCard({ title, value, detail, icon, progress }: { title: string; value: string; detail: string; icon?: React.ReactNode; progress?: PubGolfProgress }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4">
			<p className="text-xs font-bold uppercase text-slate-500">{title}</p>
			<div className="mt-2 flex items-center justify-between gap-2">
				<p className="whitespace-pre-line text-2xl font-bold text-ink">{value}</p>
				{icon ? <span className="text-ink">{icon}</span> : null}
			</div>
			<p className="mt-1 whitespace-pre-line text-sm text-slate-600">{detail}</p>
			{progress ? <ProgressPips completed={progress.completed} total={progress.total} /> : null}
		</div>
	);
}

function PubGolfLeaderCard({ leader }: { leader?: PubGolfStanding }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4">
			<p className="text-xs font-bold uppercase text-slate-500">Leader</p>
			{leader ? (
				<div className="mt-4 grid justify-items-center gap-2 text-center">
					<Avatar name={leader.displayName} large />
					<p className="font-bold text-ink">{leader.displayName}</p>
					<p className="text-xl font-bold text-ink">{leader.totalScore} ({formatToPar(leader.toPar)})</p>
				</div>
			) : <p className="mt-2 text-sm text-slate-600">No scores</p>}
		</div>
	);
}

function ProgressPips({ completed, total }: { completed: number; total: number }) {
	return (
		<div className="mt-3 flex gap-1">
			{Array.from({ length: total }).map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < completed ? 'bg-ink' : 'bg-slate-200'}`} />)}
		</div>
	);
}

function StatBox({ label, value, className = '' }: { label: string; value: string; className?: string }) {
	return <div className="grid gap-1 border-r border-slate-200 p-3 last:border-r-0"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={`text-2xl font-bold ${className || 'text-ink'}`}>{value}</span></div>;
}

function StatMini({ label, value, boxed = false, className = '' }: { label: string; value: string; boxed?: boolean; className?: string }) {
	return <span className="grid gap-1 px-2"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={`${boxed ? 'rounded border border-slate-200 px-3 py-1' : ''} font-bold ${className || 'text-ink'}`}>{value}</span></span>;
}

function MobileDetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
	return <div className="flex items-center justify-between gap-4 py-4"><span className="font-semibold text-slate-600">{label}</span><span className={strong ? 'text-xl font-bold text-ink' : 'font-semibold text-ink'}>{value}</span></div>;
}

function MobileDetailBlock({ icon, label, title, body }: { icon: React.ReactNode; label: string; title: string; body: string }) {
	return (
		<div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-5">
			<span className="pt-6 text-ink">{icon}</span>
			<span>
				<span className="block text-sm font-bold text-ink">{label}</span>
				<span className="mt-3 block font-bold text-ink">{title}</span>
				{body ? <span className="mt-1 block text-sm text-slate-600">{body}</span> : null}
			</span>
		</div>
	);
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

function toParClass(value: number) {
	if (value < 0) {
		return 'text-emerald-700';
	}
	if (value > 0) {
		return 'text-red-700';
	}
	return 'text-ink';
}
