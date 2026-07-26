import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function PrivacyPage() {
	return (
		<div className="mx-auto grid max-w-3xl gap-5">
			<PageHeader title="Privacy Policy" description="How The League handles account and league data." />
			<section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
				<p>Last updated: 26 July 2026</p>
				<div>
					<h2 className="text-lg font-bold text-ink">Data We Store</h2>
					<p className="mt-1">We store account details such as name, email address, password hash, email verification status, and site admin status. We also store leagues, members, points, challenges, submissions, audit activity, and email outbox metadata.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">How We Use Data</h2>
					<p className="mt-1">We use this data to run leagues, show leaderboards, manage challenges and points, protect accounts, send password reset and verification emails, and help admins understand important activity.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Email</h2>
					<p className="mt-1">We use your email address for sign-in, verification, password resets, and important account messages. Site admins can view email delivery status and failure reasons, but not your password.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Third Parties</h2>
					<p className="mt-1">The League may use Vercel for the web app, Render for the API, MongoDB Atlas for the database, and Resend for email delivery. These services process data needed to provide the app.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Access And Admins</h2>
					<p className="mt-1">League admins can see and manage data inside their leagues. Site admins can access platform-level operational data, including registered users and email outbox status.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Retention</h2>
					<p className="mt-1">We keep data while accounts and leagues are active, and while it is useful for app operation, safety, troubleshooting, or audit history. Deletion controls may be expanded as the product develops.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Security</h2>
					<p className="mt-1">Passwords are stored as hashes, not plain text. No online service is perfectly secure, but the app is built to keep account access and operational controls protected.</p>
				</div>
				<div>
					<h2 className="text-lg font-bold text-ink">Contact</h2>
					<p className="mt-1">Questions about privacy can be raised with the person operating The League for your group.</p>
				</div>
				<Link className="font-semibold text-ink underline" to="/leagues">Back to The League</Link>
			</section>
		</div>
	);
}
