import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function TermsPage() {
	return (
		<div className="mx-auto grid max-w-3xl gap-5">
			<PageHeader title="Terms of Service" description="The basic rules for using The League." />
			<section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
				<p>Last updated: 26 July 2026</p>
				<div>
					<h2 className="text-lg font-bold text-ink">Using The League</h2>
					<p className="mt-1">The League is a social scoring app for friendly leagues, challenges, and points between people who know each other. You agree to use it lawfully, fairly, and without harassing, abusing, or harming other people.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Accounts</h2>
					<p className="mt-1">You are responsible for your account, password, and activity. Keep your details accurate and do not use someone else&apos;s account without permission.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Leagues, Points, And Challenges</h2>
					<p className="mt-1">Points, leaderboards, and challenges are for entertainment and group organisation. They do not represent money, prizes, gambling, or any financial value unless you separately agree that with your group outside the service.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Content</h2>
					<p className="mt-1">You are responsible for league names, challenge text, reasons, and other content you add. Do not upload or create content that is illegal, abusive, discriminatory, invasive, or infringes another person&apos;s rights.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Availability</h2>
					<p className="mt-1">The service is provided as-is while it is being developed. It may change, be interrupted, or lose data. We will try to keep it useful and reliable, but we do not guarantee uninterrupted availability.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Admin Actions</h2>
					<p className="mt-1">League admins can manage members, points, challenges, approvals, and settings in their leagues. Site admins can manage platform-level operational features.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Contact</h2>
					<p className="mt-1">Questions about these terms can be raised with the person operating The League for your group.</p>
				</div>
				<Link className="font-semibold text-ink underline" to="/leagues">Back to The League</Link>
			</section>
		</div>
	);
}
