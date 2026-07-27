import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BicepsFlexed, Calendar, Check, ChevronRight, Circle, Clock, Disc3, Search, Target, Trophy } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, SelectInput, TextArea, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import { leagueService } from '../../../services/leagueService';
import type { League, Member } from '../../../services/types';
import { getPubGolfHazard, pubGolfHazards } from './Tournament/pubGolfHazards';

type GameChoice = 'Pool' | 'Darts' | 'PubGolf';
type DartsMode = 'Darts301' | 'Darts501' | 'DartsHighestScore';
type PoolMatchFormat = 'FirstToFrames' | 'BestOfFrames';
type TournamentStructure = 'LeagueAndKnockout' | 'KnockoutOnly';
type PoolBreakRule = 'NormalBreak' | 'WinnerBreak' | 'AlternateBreak';
type PubGolfHoleForm = { venue: string; drink: string; par: string; holeRule: string; hazard: string; penalty: string; notes: string };

const steps = ['Type', 'Structure', 'Format', 'Settings', 'Players', 'Review'];

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
	const [step, setStep] = useState(1);
	const [gameChoice, setGameChoice] = useState<GameChoice>('Pool');
	const [dartsMode, setDartsMode] = useState<DartsMode>('Darts301');
	const [name, setName] = useState('');
	const [startsDate, setStartsDate] = useState('');
	const [startsTime, setStartsTime] = useState('');
	const [description, setDescription] = useState('');
	const [notes, setNotes] = useState('');
	const [structure, setStructure] = useState<TournamentStructure>('LeagueAndKnockout');
	const [poolMatchFormat, setPoolMatchFormat] = useState<PoolMatchFormat>('FirstToFrames');
	const [poolFrames, setPoolFrames] = useState('5');
	const [breakRule, setBreakRule] = useState<PoolBreakRule>('NormalBreak');
	const [poolRules, setPoolRules] = useState<string[]>(['8-ball']);
	const [requireCallShot, setRequireCallShot] = useState(false);
	const [allowRerack, setAllowRerack] = useState(false);
	const [pushOutAfterFouls, setPushOutAfterFouls] = useState(false);
	const [doubleIn, setDoubleIn] = useState(true);
	const [doubleOut, setDoubleOut] = useState(true);
	const [roundTimeLimit, setRoundTimeLimit] = useState('No limit');
	const [eliminatePerRound, setEliminatePerRound] = useState('1');
	const [minimumPlayers, setMinimumPlayers] = useState('4');
	const [participantMemberIds, setParticipantMemberIds] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [winnerPoints, setWinnerPoints] = useState('20');
	const [runnerUpPoints, setRunnerUpPoints] = useState('10');
	const [matchWinPoints, setMatchWinPoints] = useState('0');
	const [pubGolfHoles, setPubGolfHoles] = useState<PubGolfHoleForm[]>(defaultPubGolfHoles());
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const selectedMembers = useMemo(
		() => members.filter((member) => participantMemberIds.includes(member.id)),
		[members, participantMemberIds]
	);
	const filteredMembers = useMemo(
		() => members.filter((member) => member.displayName.toLowerCase().includes(search.trim().toLowerCase())),
		[members, search]
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		setStep(1);
		setError('');
		setIsSubmitting(false);
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

	function togglePoolRule(rule: string) {
		setPoolRules((current) =>
			current.includes(rule)
				? current.filter((item) => item !== rule)
				: [...current, rule]
		);
	}

	function nextStep() {
		setError('');
		if (step === 1 && !name.trim()) {
			setError('Tournament name is required.');
			return;
		}

		if (gameChoice === 'PubGolf' && step === 2 && pubGolfHoles.some((hole) => !hole.venue.trim() || !hole.drink.trim() || Number(hole.par) < 1)) {
			setError('Each pub golf hole needs a venue, drink and par.');
			return;
		}

		if (step === 5 && participantMemberIds.length < 2) {
			setError('Choose at least two players.');
			return;
		}

		setStep((current) => gameChoice === 'PubGolf' && current === 2 ? 5 : Math.min(6, current + 1));
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);

		try {
			const isDartsHighestScore = gameChoice === 'Darts' && dartsMode === 'DartsHighestScore';
			await leagueService.createTournament(league.id, {
				name,
				gameType: gameChoice === 'Pool' ? 'Pool' : gameChoice === 'PubGolf' ? 'PubGolf' : dartsMode,
				format: gameChoice === 'PubGolf' ? 'PubGolfCourse' : isDartsHighestScore ? 'RoundElimination' : 'SingleEliminationBracket',
				structure,
				matchRule: poolMatchFormat === 'FirstToFrames' ? 'FirstTo' : 'BestOf',
				framesOrLegs: gameChoice === 'PubGolf' ? pubGolfHoles.length : Number(poolFrames),
				poolRules: gameChoice === 'Pool' ? poolRules : [],
				breakRule,
				callShotRequired: requireCallShot,
				allowRerack,
				pushOutAfterFouls,
				doubleInRequired: doubleIn,
				doubleOutRequired: doubleOut,
				startScore: dartsMode === 'Darts301' ? 301 : dartsMode === 'Darts501' ? 501 : null,
				minimumPlayers: Number(minimumPlayers),
				roundTimeLimitMinutes: parseTimeLimit(roundTimeLimit),
				participantMemberIds,
				winnerPoints: Number(winnerPoints),
				runnerUpPoints: Number(runnerUpPoints),
				matchWinPoints: Number(matchWinPoints),
				eliminatePerRound: Number(eliminatePerRound),
				pubGolfHoles: gameChoice === 'PubGolf' ? pubGolfHoles.map((hole) => ({
					venue: hole.venue,
					drink: hole.drink,
					par: Number(hole.par),
					holeRule: hole.holeRule || null,
					hazard: hole.hazard || null,
					penalty: hole.penalty ? Number(hole.penalty) : null,
					notes: hole.notes || null
				})) : undefined
			});
			resetForm();
			await onSaved();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not create tournament.');
			setIsSubmitting(false);
		}
	}

	function resetForm() {
		setStep(1);
		setName('');
		setDescription('');
		setNotes('');
		setSearch('');
		setPubGolfHoles(defaultPubGolfHoles());
	}

	return (
		<Modal open={open} title="Create tournament" onClose={onClose} size="wide">
			<form className="grid gap-5" onSubmit={submit}>
				<StepHeader currentStep={step} />
				{step === 1 ? (
					<div className="grid gap-5">
						<div>
							<h3 className="text-lg font-bold text-ink">Choose tournament type</h3>
							<p className="mt-1 text-sm text-slate-600">Select the game you want to create.</p>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<GameCard
								title="Pool (1 vs 1)"
								description="Classic head-to-head pool knockout tournament."
								selected={gameChoice === 'Pool'}
								onClick={() => setGameChoice('Pool')}
								icon={<PoolIcon />}
							/>
							<GameCard
								title="Darts"
								description="301, 501 or highest-score elimination tournament."
								selected={gameChoice === 'Darts'}
								onClick={() => setGameChoice('Darts')}
								icon={<Target size={48} strokeWidth={1.7} />}
							/>
							<GameCard
								title="Pub Golf"
								description="Course scorecards across 9 holes. Lowest score wins."
								selected={gameChoice === 'PubGolf'}
								onClick={() => setGameChoice('PubGolf')}
								icon={<PubGolfIcon />}
							/>
						</div>
						<hr className="border-slate-200" />
						<div>
							<h3 className="text-lg font-bold text-ink">Tournament details</h3>
						</div>
						<div className="grid gap-4 lg:grid-cols-2">
							<Field label="Tournament name">
								<TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Saturday Night Tournament" required />
							</Field>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field label="Starts optional">
									<div className="relative">
										<TextInput type="date" value={startsDate} onChange={(event) => setStartsDate(event.target.value)} />
										<Calendar className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16} />
									</div>
								</Field>
								<Field label="Time">
									<div className="relative">
										<TextInput type="time" value={startsTime} onChange={(event) => setStartsTime(event.target.value)} />
										<Clock className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16} />
									</div>
								</Field>
							</div>
							<Field label="Description optional">
								<TextArea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add any extra details about this tournament..." />
							</Field>
							<Field label="Notes optional">
								<TextArea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Any rules or info players should know..." />
							</Field>
						</div>
					</div>
				) : null}
				{step === 2 && gameChoice !== 'PubGolf' ? (
					<TournamentStructureStep structure={structure} setStructure={setStructure} />
				) : null}
				{step === 2 && gameChoice === 'PubGolf' ? (
					<PubGolfCourseBuilder holes={pubGolfHoles} setHoles={setPubGolfHoles} />
				) : null}
				{step === 3 && gameChoice !== 'PubGolf' ? (
					<MatchFormatStep
						gameChoice={gameChoice}
						dartsMode={dartsMode}
						setDartsMode={setDartsMode}
						poolMatchFormat={poolMatchFormat}
						setPoolMatchFormat={setPoolMatchFormat}
						poolFrames={poolFrames}
						setPoolFrames={setPoolFrames}
					/>
				) : null}
				{step === 4 && gameChoice === 'Pool' ? (
					<PoolSettings
						breakRule={breakRule}
						setBreakRule={setBreakRule}
						poolRules={poolRules}
						togglePoolRule={togglePoolRule}
						requireCallShot={requireCallShot}
						setRequireCallShot={setRequireCallShot}
						allowRerack={allowRerack}
						setAllowRerack={setAllowRerack}
						pushOutAfterFouls={pushOutAfterFouls}
						setPushOutAfterFouls={setPushOutAfterFouls}
					/>
				) : null}
				{step === 4 && gameChoice === 'Darts' ? (
					<DartsSettings
						dartsMode={dartsMode}
						doubleIn={doubleIn}
						setDoubleIn={setDoubleIn}
						doubleOut={doubleOut}
						setDoubleOut={setDoubleOut}
						roundTimeLimit={roundTimeLimit}
						setRoundTimeLimit={setRoundTimeLimit}
						eliminatePerRound={eliminatePerRound}
						setEliminatePerRound={setEliminatePerRound}
						minimumPlayers={minimumPlayers}
						setMinimumPlayers={setMinimumPlayers}
					/>
				) : null}
				{step === 5 ? (
					<div className="grid gap-4">
						<div>
							<h3 className="text-lg font-bold text-ink">Add players</h3>
							<p className="mt-1 text-sm text-slate-600">Select the players who can join this tournament.</p>
						</div>
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
							<TextInput className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members..." />
						</div>
						<div className="overflow-hidden rounded-md border border-slate-200">
							<div className="max-h-64 overflow-auto divide-y divide-slate-100">
								{filteredMembers.map((member) => (
									<label key={member.id} className="flex min-h-10 items-center gap-2 px-3 text-sm text-slate-700 hover:bg-slate-50">
										<input type="checkbox" checked={participantMemberIds.includes(member.id)} onChange={() => toggleParticipant(member.id)} />
										{member.displayName}
									</label>
								))}
							</div>
							<div className="flex items-center justify-between bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
								<span>{participantMemberIds.length} players selected</span>
								<button type="button" className="text-ink" onClick={() => setParticipantMemberIds(members.map((member) => member.id))}>Select all</button>
							</div>
						</div>
					</div>
				) : null}
				{step === 6 ? (
					<div className="grid gap-4">
						<div>
							<h3 className="text-lg font-bold text-ink">Review tournament</h3>
							<p className="mt-1 text-sm text-slate-600">Check the setup before creating it.</p>
						</div>
						<div className="grid gap-3 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
							<p><span className="font-bold text-ink">Name:</span> {name}</p>
							<p><span className="font-bold text-ink">Game:</span> {gameChoice === 'Pool' ? 'Pool knockout' : gameChoice === 'PubGolf' ? 'Pub Golf' : formatDartsMode(dartsMode)}</p>
							{gameChoice !== 'PubGolf' ? <p><span className="font-bold text-ink">Structure:</span> {formatStructure(structure)}</p> : null}
							<p><span className="font-bold text-ink">Format:</span> {gameChoice === 'PubGolf' ? `${pubGolfHoles.length} holes` : formatMatchRule(poolMatchFormat, poolFrames, gameChoice)}</p>
							<p><span className="font-bold text-ink">Players:</span> {selectedMembers.map((member) => member.displayName).join(', ')}</p>
							<p><span className="font-bold text-ink">Scoring:</span> Winner {formatSignedPoints(Number(winnerPoints))}, runner-up {formatSignedPoints(Number(runnerUpPoints))}, match win {formatSignedPoints(Number(matchWinPoints))}</p>
							{description ? <p><span className="font-bold text-ink">Description:</span> {description}</p> : null}
							{notes ? <p><span className="font-bold text-ink">Notes:</span> {notes}</p> : null}
						</div>
						<div className="grid gap-4 sm:grid-cols-3">
							<Field label="Winner points">
								<TextInput type="number" value={winnerPoints} onChange={(event) => setWinnerPoints(event.target.value)} />
							</Field>
							<Field label="Runner-up points">
								<TextInput type="number" value={runnerUpPoints} onChange={(event) => setRunnerUpPoints(event.target.value)} />
							</Field>
							<Field label="Match win points">
								<TextInput type="number" value={matchWinPoints} onChange={(event) => setMatchWinPoints(event.target.value)} />
							</Field>
						</div>
					</div>
				) : null}
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
					<Button type="button" variant="secondary" onClick={step === 1 ? onClose : () => setStep((current) => gameChoice === 'PubGolf' && current === 5 ? 2 : current - 1)}>
						{step === 1 ? 'Cancel' : 'Previous'}
					</Button>
					{step < 6 ? (
						<Button type="button" icon={<ChevronRight size={16} />} onClick={nextStep}>Next</Button>
					) : (
						<Button type="submit" icon={<Trophy size={16} />} loading={isSubmitting} loadingLabel="Creating..." disabled={participantMemberIds.length < 2}>Create tournament</Button>
					)}
				</div>
			</form>
		</Modal>
	);
}

function StepHeader({ currentStep }: { currentStep: number }) {
	return (
		<div className="grid gap-3 border-b border-slate-200 pb-4 sm:grid-cols-3 lg:grid-cols-6">
			{steps.map((label, index) => {
				const stepNumber = index + 1;
				const isDone = stepNumber < currentStep;
				const isActive = stepNumber === currentStep;
				return (
					<div key={label} className="flex items-center gap-2 text-xs font-bold text-slate-600">
						<span className={`grid h-7 w-7 place-items-center rounded-full ${isActive || isDone ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
							{isDone ? <Check size={14} /> : stepNumber}
						</span>
						<span className={isActive ? 'text-ink' : ''}>{label}</span>
					</div>
				);
			})}
		</div>
	);
}

function GameCard({ title, description, selected, icon, onClick }: { title: string; description: string; selected: boolean; icon: React.ReactNode; onClick: () => void }) {
	return (
		<button
			type="button"
			className={`grid min-h-32 grid-cols-[6rem_1fr_auto] gap-3 rounded-md border p-3 text-left transition ${selected ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
			onClick={onClick}
		>
			<span className="grid h-24 w-24 place-items-center rounded-md bg-slate-50 text-ink ring-1 ring-slate-200">{icon}</span>
			<span className="min-w-0 self-center">
				<span className="block font-bold text-ink">{title}</span>
				<span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
			</span>
			<span className={`mt-1 grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
				{selected ? <Circle size={8} fill="currentColor" /> : null}
			</span>
		</button>
	);
}

function defaultPubGolfHoles(): PubGolfHoleForm[] {
	const venues = ['Old Crown', 'Queens Arms', 'The Castle', 'The Griffin', 'The Final Bell', 'The Station', 'The White Horse', 'The Red Lion', 'Destination'];
	const drinks = ['Pint of Lager', 'Whiskey & mixer', 'Bottle of cider', 'Pint of lager', 'Rum & mixer', 'House pint', 'Ale', 'Lager', 'Final drink'];
	return venues.map((venue, index) => ({
		venue,
		drink: drinks[index],
		par: index % 3 === 0 ? '4' : '3',
		holeRule: '',
		hazard: '',
		penalty: '',
		notes: ''
	}));
}

function PubGolfCourseBuilder({ holes, setHoles }: { holes: PubGolfHoleForm[]; setHoles: (holes: PubGolfHoleForm[]) => void }) {
	function updateHole(index: number, patch: Partial<PubGolfHoleForm>) {
		setHoles(holes.map((hole, holeIndex) => holeIndex === index ? { ...hole, ...patch } : hole));
	}

	function moveHole(index: number, direction: -1 | 1) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= holes.length) {
			return;
		}

		const next = [...holes];
		[next[index], next[nextIndex]] = [next[nextIndex], next[index]];
		setHoles(next);
	}

	return (
		<div className="grid gap-5">
			<div>
				<h3 className="text-lg font-bold text-ink">Build the course</h3>
				<p className="mt-1 text-sm text-slate-600">Add the venues, drinks, pars and optional hazards for pub golf.</p>
			</div>
			<div className="grid gap-3">
				{holes.map((hole, index) => (
					<PubGolfHoleEditor
						key={index}
						hole={hole}
						index={index}
						canMoveUp={index > 0}
						canMoveDown={index < holes.length - 1}
						canDelete={holes.length > 1}
						onChange={(patch) => updateHole(index, patch)}
						onMove={moveHole}
						onDelete={() => setHoles(holes.filter((_, holeIndex) => holeIndex !== index))}
					/>
				))}
			</div>
			<Button type="button" variant="secondary" onClick={() => setHoles([...holes, { venue: '', drink: '', par: '3', holeRule: '', hazard: '', penalty: '', notes: '' }])}>Add hole</Button>
		</div>
	);
}

function PubGolfHoleEditor({
	hole,
	index,
	canMoveUp,
	canMoveDown,
	canDelete,
	onChange,
	onMove,
	onDelete
}: {
	hole: PubGolfHoleForm;
	index: number;
	canMoveUp: boolean;
	canMoveDown: boolean;
	canDelete: boolean;
	onChange: (patch: Partial<PubGolfHoleForm>) => void;
	onMove: (index: number, direction: -1 | 1) => void;
	onDelete: () => void;
}) {
	const selectedHazard = getPubGolfHazard(hole.hazard);

	return (
		<div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3">
						<div className="flex items-center justify-between gap-3">
							<p className="font-bold text-ink">Hole {index + 1}</p>
							<div className="flex gap-2">
								<Button type="button" variant="secondary" className="px-3" onClick={() => onMove(index, -1)} disabled={!canMoveUp}>Up</Button>
								<Button type="button" variant="secondary" className="px-3" onClick={() => onMove(index, 1)} disabled={!canMoveDown}>Down</Button>
								<Button type="button" variant="danger" className="px-3" onClick={onDelete} disabled={!canDelete}>Delete</Button>
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							<Field label="Venue">
								<TextInput value={hole.venue} onChange={(event) => onChange({ venue: event.target.value })} required />
							</Field>
							<Field label="Drink">
								<TextInput value={hole.drink} onChange={(event) => onChange({ drink: event.target.value })} required />
							</Field>
							<Field label="Par">
								<TextInput type="number" min="1" value={hole.par} onChange={(event) => onChange({ par: event.target.value })} required />
							</Field>
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							<Field label="Hole rule">
								<TextInput value={hole.holeRule} onChange={(event) => onChange({ holeRule: event.target.value })} placeholder="Left hand only" />
							</Field>
							<Field label="Hazard">
								<SelectInput
									value={hole.hazard}
									onChange={(event) => {
										const hazard = getPubGolfHazard(event.target.value);
										onChange({
											hazard: event.target.value,
											penalty: hazard ? String(hazard.defaultPenalty) : ''
										});
									}}
								>
									<option value="">No hazard</option>
									{pubGolfHazards.map((hazard) => <option key={hazard.name} value={hazard.name}>{hazard.name}</option>)}
								</SelectInput>
							</Field>
							<Field label="Penalty">
								<TextInput type="number" value={hole.penalty} onChange={(event) => onChange({ penalty: event.target.value })} placeholder="+2" />
							</Field>
						</div>
						{selectedHazard ? (
							<div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
								<span className="font-semibold text-ink">{selectedHazard.name}:</span> {selectedHazard.description}
							</div>
						) : null}
						<Field label="Notes">
							<TextArea value={hole.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Keep it moving!" />
						</Field>
					</div>
	);
}

function TournamentStructureStep({ structure, setStructure }: { structure: TournamentStructure; setStructure: (value: TournamentStructure) => void }) {
	return (
		<div className="grid gap-5">
			<div>
				<h3 className="text-lg font-bold text-ink">Tournament structure</h3>
				<p className="mt-1 text-sm text-slate-600">Choose how the tournament will be played.</p>
			</div>
			<div className="grid gap-3">
				<RadioPanel checked={structure === 'LeagueAndKnockout'} title="League + knockout" description="Everyone plays a league stage first. The knockout bracket is generated from those results." onClick={() => setStructure('LeagueAndKnockout')} />
				<RadioPanel checked={structure === 'KnockoutOnly'} title="Knockout only" description="Single elimination bracket. Lose once and you're out." onClick={() => setStructure('KnockoutOnly')} />
			</div>
		</div>
	);
}

function MatchFormatStep({
	gameChoice,
	dartsMode,
	setDartsMode,
	poolMatchFormat,
	setPoolMatchFormat,
	poolFrames,
	setPoolFrames
}: {
	gameChoice: GameChoice;
	dartsMode: DartsMode;
	setDartsMode: (value: DartsMode) => void;
	poolMatchFormat: PoolMatchFormat;
	setPoolMatchFormat: (value: PoolMatchFormat) => void;
	poolFrames: string;
	setPoolFrames: (value: string) => void;
}) {
	return (
		<div className="grid gap-5">
			<div>
				<h3 className="text-lg font-bold text-ink">Match format</h3>
				<p className="mt-1 text-sm text-slate-600">Choose how matches are played and how many {gameChoice === 'Pool' ? 'frames' : 'legs'} are required.</p>
			</div>
			{gameChoice === 'Darts' ? (
				<div className="grid gap-2">
					<p className="text-sm font-semibold text-slate-700">Game type</p>
					<RadioPanel checked={dartsMode === 'Darts301'} title="301" description="Classic 301." onClick={() => setDartsMode('Darts301')} />
					<RadioPanel checked={dartsMode === 'Darts501'} title="501" description="Classic 501." onClick={() => setDartsMode('Darts501')} />
					<RadioPanel checked={dartsMode === 'DartsHighestScore'} title="Highest score" description="Most points each round. Lowest scorers are eliminated." onClick={() => setDartsMode('DartsHighestScore')} />
				</div>
			) : null}
			{dartsMode === 'DartsHighestScore' && gameChoice === 'Darts' ? null : (
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]">
					<div className="grid gap-2">
						<RadioPanel checked={poolMatchFormat === 'FirstToFrames'} title={`First to X ${gameChoice === 'Pool' ? 'frames' : 'legs'}`} description={`First player to win X ${gameChoice === 'Pool' ? 'frames' : 'legs'} wins the match.`} onClick={() => setPoolMatchFormat('FirstToFrames')} />
						<RadioPanel checked={poolMatchFormat === 'BestOfFrames'} title={`Best of X ${gameChoice === 'Pool' ? 'frames' : 'legs'}`} description={`Player with most ${gameChoice === 'Pool' ? 'frames' : 'legs'} after X wins.`} onClick={() => setPoolMatchFormat('BestOfFrames')} />
					</div>
					<Field label={gameChoice === 'Pool' ? 'Frames' : 'Legs'}>
						<TextInput type="number" min="1" value={poolFrames} onChange={(event) => setPoolFrames(event.target.value)} />
					</Field>
				</div>
			)}
		</div>
	);
}

function PoolSettings({
	breakRule,
	setBreakRule,
	poolRules,
	togglePoolRule,
	requireCallShot,
	setRequireCallShot,
	allowRerack,
	setAllowRerack,
	pushOutAfterFouls,
	setPushOutAfterFouls
}: {
	breakRule: PoolBreakRule;
	setBreakRule: (value: PoolBreakRule) => void;
	poolRules: string[];
	togglePoolRule: (rule: string) => void;
	requireCallShot: boolean;
	setRequireCallShot: (value: boolean) => void;
	allowRerack: boolean;
	setAllowRerack: (value: boolean) => void;
	pushOutAfterFouls: boolean;
	setPushOutAfterFouls: (value: boolean) => void;
}) {
	return (
		<div className="grid gap-5">
			<SettingsTitle icon={<PoolIcon small />} title="Pool tournament settings" />
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-2">
					<p className="text-sm font-semibold text-slate-700">Break rules</p>
					<RadioPanel checked={breakRule === 'NormalBreak'} title="Normal break" description="Standard break rules apply." onClick={() => setBreakRule('NormalBreak')} />
					<RadioPanel checked={breakRule === 'WinnerBreak'} title="Winner break" description="Winner of previous frame breaks." onClick={() => setBreakRule('WinnerBreak')} />
					<RadioPanel checked={breakRule === 'AlternateBreak'} title="Alternate break" description="Players alternate breaks." onClick={() => setBreakRule('AlternateBreak')} />
				</div>
				<CheckboxGroup title="Table rules optional" items={['8-ball', '9-ball', 'Other / Custom']} selected={poolRules} onToggle={togglePoolRule} />
				<div className="grid content-start gap-2">
					<p className="text-sm font-semibold text-slate-700">Additional rules optional</p>
					<Checkbox checked={requireCallShot} onChange={setRequireCallShot} label="Require call shot" />
					<Checkbox checked={allowRerack} onChange={setAllowRerack} label="Allow re-rack" />
					<Checkbox checked={pushOutAfterFouls} onChange={setPushOutAfterFouls} label="Push out after fouls" />
				</div>
			</div>
		</div>
	);
}

function DartsSettings({
	dartsMode,
	doubleIn,
	setDoubleIn,
	doubleOut,
	setDoubleOut,
	roundTimeLimit,
	setRoundTimeLimit,
	eliminatePerRound,
	setEliminatePerRound,
	minimumPlayers,
	setMinimumPlayers
}: {
	dartsMode: DartsMode;
	doubleIn: boolean;
	setDoubleIn: (value: boolean) => void;
	doubleOut: boolean;
	setDoubleOut: (value: boolean) => void;
	roundTimeLimit: string;
	setRoundTimeLimit: (value: string) => void;
	eliminatePerRound: string;
	setEliminatePerRound: (value: string) => void;
	minimumPlayers: string;
	setMinimumPlayers: (value: string) => void;
}) {
	return (
		<div className="grid gap-5">
			<SettingsTitle icon={<Target size={22} strokeWidth={1.7} />} title="Darts tournament settings" />
			{dartsMode === 'DartsHighestScore' ? (
				<div className="grid gap-4 sm:grid-cols-3">
					<Field label="Players eliminated each round">
						<TextInput type="number" min="1" value={eliminatePerRound} onChange={(event) => setEliminatePerRound(event.target.value)} />
					</Field>
					<Field label="Minimum players to start">
						<TextInput type="number" min="2" value={minimumPlayers} onChange={(event) => setMinimumPlayers(event.target.value)} />
					</Field>
					<Field label="Round time limit optional">
						<SelectInput value={roundTimeLimit} onChange={(event) => setRoundTimeLimit(event.target.value)}>
							<option>No limit</option>
							<option>5 minutes</option>
							<option>10 minutes</option>
							<option>15 minutes</option>
						</SelectInput>
					</Field>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					<SegmentedToggle label="Double in" value={doubleIn} onChange={setDoubleIn} />
					<SegmentedToggle label="Double out" value={doubleOut} onChange={setDoubleOut} />
					<Field label="Start score">
						<SelectInput value={dartsMode === 'Darts301' ? '301' : '501'} disabled>
							<option>{dartsMode === 'Darts301' ? '301' : '501'}</option>
						</SelectInput>
					</Field>
					<Field label="Round time limit optional">
						<SelectInput value={roundTimeLimit} onChange={(event) => setRoundTimeLimit(event.target.value)}>
							<option>No limit</option>
							<option>5 minutes</option>
							<option>10 minutes</option>
							<option>15 minutes</option>
						</SelectInput>
					</Field>
				</div>
			)}
			<div className="flex gap-2 rounded-md bg-blue-50 px-3 py-3 text-sm text-blue-800">
				<BicepsFlexed size={17} className="mt-0.5 shrink-0" />
				<span>{dartsMode === 'DartsHighestScore' ? 'Players aim for the highest score each round. Lowest scorers are eliminated.' : 'Players must follow the selected double-in and double-out rules to win the match.'}</span>
			</div>
		</div>
	);
}

function SettingsTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
	return (
		<div className="flex items-center gap-2">
			<span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-ink ring-1 ring-emerald-100">{icon}</span>
			<h3 className="text-lg font-bold text-ink">{title}</h3>
		</div>
	);
}

function RadioPanel({ checked, title, description, onClick }: { checked: boolean; title: string; description: string; onClick: () => void }) {
	return (
		<button type="button" className={`flex items-start gap-3 rounded-md border p-3 text-left ${checked ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200 bg-white'}`} onClick={onClick}>
			<span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>{checked ? <Circle size={8} fill="currentColor" /> : null}</span>
			<span>
				<span className="block text-sm font-bold text-ink">{title}</span>
				<span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
			</span>
		</button>
	);
}

function CheckboxGroup({ title, items, selected, onToggle }: { title: string; items: string[]; selected: string[]; onToggle: (value: string) => void }) {
	return (
		<div className="grid gap-2">
			<p className="text-sm font-semibold text-slate-700">{title}</p>
			{items.map((item) => <Checkbox key={item} checked={selected.includes(item)} onChange={() => onToggle(item)} label={item} />)}
		</div>
	);
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
	return (
		<label className="flex items-center gap-2 text-sm text-slate-700">
			<input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
			{label}
		</label>
	);
}

function SegmentedToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
	return (
		<div className="grid gap-2">
			<p className="text-sm font-semibold text-slate-700">{label}</p>
			<div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200">
				<button type="button" className={value ? 'bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700' : 'bg-white px-3 py-2 text-sm font-semibold text-slate-600'} onClick={() => onChange(true)}>Required</button>
				<button type="button" className={!value ? 'bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700' : 'bg-white px-3 py-2 text-sm font-semibold text-slate-600'} onClick={() => onChange(false)}>Not required</button>
			</div>
		</div>
	);
}

function PoolIcon({ small = false }: { small?: boolean }) {
	const size = small ? 22 : 54;
	return (
		<span className="relative grid place-items-center" style={{ width: size, height: size }}>
			<Disc3 size={size} strokeWidth={1.6} />
			<span className="absolute h-2 w-2 rounded-full bg-current" />
		</span>
	);
}

function PubGolfIcon() {
	return (
		<span className="relative grid h-16 w-16 place-items-center text-ink">
			<span className="absolute bottom-2 h-8 w-12 rounded-[50%] border border-current" />
			<span className="absolute left-8 top-2 h-9 w-px bg-current" />
			<span className="absolute left-8 top-2 h-4 w-5 border-y border-r border-current" />
			<span className="absolute bottom-6 h-3 w-3 rounded-full border border-current" />
		</span>
	);
}

function formatDartsMode(mode: DartsMode) {
	if (mode === 'Darts301') {
		return 'Darts 301';
	}

	if (mode === 'Darts501') {
		return 'Darts 501';
	}

	return 'Darts highest score';
}

function formatStructure(structure: TournamentStructure) {
	return structure === 'LeagueAndKnockout' ? 'League + knockout' : 'Knockout only';
}

function formatMatchRule(format: PoolMatchFormat, amount: string, gameChoice: GameChoice) {
	const unit = gameChoice === 'Pool' ? 'frames' : 'legs';
	return `${format === 'FirstToFrames' ? 'First to' : 'Best of'} ${amount || '0'} ${unit}`;
}

function parseTimeLimit(value: string) {
	const match = value.match(/^(\d+)/);
	return match ? Number(match[1]) : null;
}

function formatSignedPoints(points: number) {
	return `${points > 0 ? '+' : ''}${points} pts`;
}
