import { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { warmUpApi } from '../services/api';

type WarmUpSplashProps = {
	onReady: () => void;
};

const defaultWarmUpSeconds = 25;
const minimumVisibleMs = 900;

function getConfiguredDurationMs() {
	const configuredSeconds = Number(import.meta.env.VITE_API_WARMUP_SECONDS ?? defaultWarmUpSeconds);
	const safeSeconds = Number.isFinite(configuredSeconds)
		? Math.min(Math.max(configuredSeconds, 3), 90)
		: defaultWarmUpSeconds;
	return safeSeconds * 1000;
}

export function WarmUpSplash({ onReady }: WarmUpSplashProps) {
	const durationMs = useMemo(getConfiguredDurationMs, []);
	const [progress, setProgress] = useState(6);
	const [message, setMessage] = useState('Warming up the league...');

	useEffect(() => {
		const startedAt = Date.now();
		const controller = new AbortController();
		const maxWaitMs = Math.max(durationMs * 2, 45000);
		let hasCompleted = false;

		const finish = () => {
			if (hasCompleted) {
				return;
			}

			hasCompleted = true;
			setProgress(100);
			setMessage('Ready.');
			window.setTimeout(onReady, 320);
		};

		const fallbackTimer = window.setTimeout(() => {
			controller.abort();
			finish();
		}, maxWaitMs);

		warmUpApi(controller.signal)
			.then(() => {
				const elapsed = Date.now() - startedAt;
				window.setTimeout(() => {
					finish();
				}, Math.max(0, minimumVisibleMs - elapsed));
			})
			.catch(() => {
				const elapsed = Date.now() - startedAt;
				window.setTimeout(finish, Math.max(0, minimumVisibleMs - elapsed));
			});

		const interval = window.setInterval(() => {
			if (hasCompleted) {
				return;
			}

			const elapsed = Date.now() - startedAt;
			const plannedProgress = Math.min(94, 6 + (elapsed / durationMs) * 88);
			const waitingProgress = elapsed > durationMs ? Math.min(98, 94 + ((elapsed - durationMs) / durationMs) * 4) : plannedProgress;
			setProgress(waitingProgress);
			if (elapsed > durationMs * 0.7) {
				setMessage('Render is getting the container ready...');
			}
		}, 100);

		return () => {
			controller.abort();
			window.clearInterval(interval);
			window.clearTimeout(fallbackTimer);
		};
	}, [durationMs, onReady]);

	return (
		<main className="grid min-h-screen place-items-center bg-slate-50 px-4">
			<section className="w-full max-w-sm text-center">
				<div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-ink shadow-sm ring-1 ring-slate-200">
					<Trophy size={34} strokeWidth={2.2} />
				</div>
				<h1 className="mt-5 text-3xl font-bold text-ink">The League</h1>
				<p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">League platform</p>
				<div className="mt-7 overflow-hidden rounded-full bg-slate-200">
					<div
						className="h-3 rounded-full bg-emerald-400 transition-[width] duration-150 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
					<span>{message}</span>
					<span>{Math.round(progress)}%</span>
				</div>
			</section>
		</main>
	);
}
