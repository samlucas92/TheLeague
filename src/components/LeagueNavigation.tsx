import { NavLink } from 'react-router-dom';
import { Activity, ClipboardCheck, ListChecks, Medal, Radio, Settings, Users } from 'lucide-react';

const tabs = [
	{ to: '', label: 'Overview', shortLabel: 'Home', icon: Activity },
	{ to: 'leaderboard', label: 'Leaderboard', shortLabel: 'Board', icon: Medal },
	{ to: 'points', label: 'Points Feed', shortLabel: 'Points', icon: Radio },
	{ to: 'challenges', label: 'Challenges', shortLabel: 'Challenges', icon: ListChecks },
	{ to: 'submissions', label: 'My Submissions', shortLabel: 'Subs', icon: ClipboardCheck },
	{ to: 'members', label: 'Members', shortLabel: 'Members', icon: Users },
	{ to: 'admin', label: 'Admin', shortLabel: 'Admin', icon: Settings }
];

export function LeagueNavigation() {
	return (
		<div className="-mx-4 overflow-hidden border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
			<nav className="league-tabs-scroll flex gap-2 overflow-x-auto pb-2 sm:gap-1 sm:pb-0" aria-label="League sections">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					return (
						<NavLink
							key={tab.to || 'overview'}
							to={tab.to}
							end={tab.to === ''}
							aria-label={tab.label}
							className={({ isActive }) =>
								`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:px-3 ${
									isActive
										? 'border-ink bg-ink text-white shadow-sm sm:bg-transparent sm:text-ink sm:shadow-none'
										: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink sm:border-transparent sm:bg-transparent sm:text-slate-500'
								}`
							}
						>
							<Icon size={16} className="shrink-0" />
							<span className="whitespace-nowrap sm:hidden">{tab.shortLabel}</span>
							<span className="hidden whitespace-nowrap sm:inline">{tab.label}</span>
						</NavLink>
					);
				})}
			</nav>
		</div>
	);
}
