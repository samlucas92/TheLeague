import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function AppErrorPage() {
	const error = useRouteError();
	const message = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: error instanceof Error
			? error.message
			: 'Something went wrong.';

	return (
		<main className="grid min-h-screen place-items-center bg-slate-50 px-4">
			<section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
				<div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-700">
					<AlertTriangle size={24} />
				</div>
				<h1 className="mt-4 text-xl font-bold text-ink">The League hit a snag</h1>
				<p className="mt-2 text-sm text-slate-600">{message}</p>
				<div className="mt-5 flex justify-center gap-2">
					<Button type="button" variant="secondary" onClick={() => window.location.reload()}>Reload</Button>
					<Link to="/leagues"><Button type="button">Go to leagues</Button></Link>
				</div>
			</section>
		</main>
	);
}
