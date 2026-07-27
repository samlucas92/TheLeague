import type { ReactNode } from 'react';
import type { LeaderboardRow } from '../../../services/types';

export function LeaderboardLine({ row }: { row: LeaderboardRow }) {
	return (
		<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-slate-50 px-3 py-2">
			<span className="truncate font-semibold text-ink">#{row.position} {row.displayName}</span>
			<span className="whitespace-nowrap font-bold">{row.approvedPoints} pts</span>
		</div>
	);
}


export function formatAuditAction(action: string) {
	return action
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.trim();
}


export function getAuditTone(action: string): 'neutral' | 'good' | 'warning' | 'bad' {
	if (action.includes('Deleted') || action.includes('Removed') || action.includes('Rejected') || action.includes('Deducted') || action.includes('Failed')) {
		return 'bad';
	}

	if (action.includes('Created') || action.includes('Approved') || action.includes('Awarded') || action.includes('Completed') || action.includes('Linked') || action.includes('Joined')) {
		return 'good';
	}

	if (action.includes('Changed') || action.includes('Edited') || action.includes('Regenerated') || action.includes('Updated') || action.includes('Requested')) {
		return 'warning';
	}

	return 'neutral';
}


export function EmptyState({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
	return (
		<div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center sm:p-8">
			<h2 className="text-lg font-bold text-ink">{title}</h2>
			<p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
			{actions ? <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:justify-center">{actions}</div> : null}
		</div>
	);
}
