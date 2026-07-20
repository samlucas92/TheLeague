import { NavLink } from 'react-router-dom';
import { Activity, ClipboardCheck, ListChecks, Medal, Radio, Users } from 'lucide-react';

const tabs = [
	{ to: '', label: 'Overview', icon: Activity },
	{ to: 'leaderboard', label: 'Leaderboard', icon: Medal },
	{ to: 'points', label: 'Points Feed', icon: Radio },
	{ to: 'challenges', label: 'Challenges', icon: ListChecks },
	{ to: 'submissions', label: 'My Submissions', icon: ClipboardCheck },
	{ to: 'members', label: 'Members', icon: Users },
	{ to: 'admin', label: 'Admin', icon: ClipboardCheck }
];

export function LeagueNavigation() {
	return (
		<nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				return (
					<NavLink
						key={tab.to || 'overview'}
						to={tab.to}
						end={tab.to === ''}
						className={({ isActive }) =>
							`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold ${
								isActive ? 'border-ink text-ink' : 'border-transparent text-slate-500 hover:text-ink'
							}`
						}
					>
						<Icon size={16} />
						{tab.label}
					</NavLink>
				);
			})}
		</nav>
	);
}
