import type { ReactNode } from 'react';
import { Target } from 'lucide-react';
import type { Tournament, TournamentParticipant } from '../../../../services/types';

export function GameArtwork({ gameType, compact = false }: { gameType: Tournament['gameType']; compact?: boolean }) {
	const isPool = gameType === 'Pool';
	return (
		<div className={`grid place-items-center rounded-md bg-slate-50 text-ink ring-1 ring-slate-200 ${compact ? 'h-24 w-24' : 'h-32 w-32'}`}>
			{isPool ? <PoolRackIcon /> : <DartsIcon />}
		</div>
	);
}

export function PoolRackIcon() {
	const rows = [1, 2, 3, 4, 5];
	return (
		<div className="grid gap-1">
			{rows.map((count, row) => (
				<div key={count} className="flex justify-center gap-1">
					{Array.from({ length: count }).map((_, index) => <span key={`${row}-${index}`} className="h-3 w-3 rounded-full border border-current" />)}
				</div>
			))}
			<div className="mt-1 h-1 w-20 rotate-[-18deg] rounded-full bg-current opacity-70" />
		</div>
	);
}

export function DartsIcon() {
	return (
		<div className="relative grid h-20 w-20 place-items-center rounded-full border-2 border-current">
			<div className="h-14 w-14 rounded-full border border-current" />
			<div className="absolute h-px w-20 bg-current" />
			<div className="absolute h-20 w-px bg-current" />
			<Target size={28} strokeWidth={1.6} className="absolute" />
		</div>
	);
}

export function PlayerScoreRow({ name, score, won, muted = false }: { name: string; score?: number | null; won: boolean; muted?: boolean }) {
	return (
		<div className={`flex justify-between gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0 ${won ? 'bg-emerald-50 font-bold text-emerald-900' : muted ? 'text-slate-400' : 'text-slate-700'}`}>
			<span>{name}</span>
			<span>{score ?? '-'}</span>
		</div>
	);
}

export function PlayerStanding({ participant }: { participant: TournamentParticipant }) {
	return (
		<div className={participant.isEliminated ? 'rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-400' : 'rounded-md bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200'}>
			<span className="font-semibold text-ink">{participant.displayName}</span>
			<span className="ml-2">{participant.totalScore} total</span>
			{participant.isEliminated ? <span className="ml-2 font-semibold">Eliminated</span> : null}
		</div>
	);
}

export function Avatar({ name, tone = 'blue', large = false }: { name: string; tone?: 'blue' | 'green'; large?: boolean }) {
	const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';
	return <span className={`inline-grid place-items-center rounded-full text-xs font-bold text-white ${large ? 'h-11 w-11' : 'h-7 w-7'} ${tone === 'green' ? 'bg-lime-600' : 'bg-blue-600'}`}>{initials}</span>;
}

export function Meta({ icon, label }: { icon: ReactNode; label: string }) {
	return <span className="inline-flex items-center gap-1.5">{icon}{label}</span>;
}

