import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Activity, ClipboardCheck, Ellipsis, ListChecks, Medal, Radio, Settings, Users } from 'lucide-react';

const tabs = [
	{ to: '', label: 'Overview', icon: Activity },
	{ to: 'leaderboard', label: 'Leaderboard', icon: Medal },
	{ to: 'points', label: 'Points Feed', icon: Radio },
	{ to: 'challenges', label: 'Challenges', icon: ListChecks },
	{ to: 'submissions', label: 'My Submissions', icon: ClipboardCheck },
	{ to: 'members', label: 'Members', icon: Users },
	{ to: 'admin', label: 'Admin', icon: Settings }
];

const mobilePrimaryTabs = tabs.filter((tab) => tab.to === '' || tab.to === 'leaderboard' || tab.to === 'points');
const mobileMoreTabs = tabs.filter((tab) => tab.to === 'challenges' || tab.to === 'submissions' || tab.to === 'members' || tab.to === 'admin');

export function LeagueNavigation() {
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const location = useLocation();
	const isMoreActive = mobileMoreTabs.some((tab) => location.pathname.endsWith(`/${tab.to}`));

	return (
		<>
			<nav className="hidden gap-1 overflow-x-auto border-b border-slate-200 sm:flex" aria-label="League sections">
				{tabs.map((tab) => <DesktopTab key={tab.to || 'overview'} tab={tab} />)}
			</nav>
			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden" aria-label="League sections">
				{isMoreOpen ? (
					<div className="absolute inset-x-3 bottom-[calc(100%+0.5rem)] rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
						<div className="grid gap-1">
							{mobileMoreTabs.map((tab) => {
								const Icon = tab.icon;
								return (
									<NavLink
										key={tab.to}
										to={tab.to}
										onClick={() => setIsMoreOpen(false)}
										className={({ isActive }) =>
											`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold ${
												isActive ? 'bg-ink text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-ink'
											}`
										}
									>
										<Icon size={17} />
										{tab.label}
									</NavLink>
								);
							})}
						</div>
					</div>
				) : null}
				<div className="grid grid-cols-4 gap-1">
					{mobilePrimaryTabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<NavLink
								key={tab.to || 'overview'}
								to={tab.to}
								end={tab.to === ''}
								onClick={() => setIsMoreOpen(false)}
								className={({ isActive }) =>
									`grid min-h-12 place-items-center rounded-md px-1 text-[0.7rem] font-semibold ${
										isActive ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
									}`
								}
							>
								<Icon size={18} />
								<span>{tab.label}</span>
							</NavLink>
						);
					})}
					<button
						type="button"
						className={`grid min-h-12 place-items-center rounded-md px-1 text-[0.7rem] font-semibold ${
							isMoreOpen || isMoreActive ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
						}`}
						aria-expanded={isMoreOpen}
						aria-label="More league sections"
						onClick={() => setIsMoreOpen((current) => !current)}
					>
						<Ellipsis size={18} />
						<span>More</span>
					</button>
				</div>
			</nav>
		</>
	);
}

function DesktopTab({ tab }: { tab: (typeof tabs)[number] }) {
	const Icon = tab.icon;
	return (
		<NavLink
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
}
