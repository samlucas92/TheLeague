import { useEffect, useState } from 'react';
import { WifiOff, Download, RefreshCw, Trophy, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

type InstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const installDismissedKey = 'theleague.installPromptDismissed';

export function PwaStatus() {
	const [isOnline, setIsOnline] = useState(() => navigator.onLine);
	const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
	const [isInstallHelpOpen, setIsInstallHelpOpen] = useState(false);
	const [isInstallDismissed, setIsInstallDismissed] = useState(
		() => localStorage.getItem(installDismissedKey) === 'true'
	);
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
		('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
	const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
	const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker
	} = useRegisterSW({
		onRegisteredSW(_serviceWorkerUrl, registration) {
			if (!registration) {
				return;
			}

			const updateTimer = window.setInterval(() => void registration.update(), 60 * 60 * 1000);
			return () => window.clearInterval(updateTimer);
		}
	});

	useEffect(() => {
		function updateOnlineStatus() {
			setIsOnline(navigator.onLine);
		}

		function captureInstallPrompt(event: Event) {
			event.preventDefault();
			setInstallPrompt(event as InstallPromptEvent);
		}

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);
		window.addEventListener('beforeinstallprompt', captureInstallPrompt);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
			window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
		};
	}, []);

	async function installApp() {
		if (!installPrompt) {
			setIsInstallHelpOpen(true);
			return;
		}

		await installPrompt.prompt();
		const choice = await installPrompt.userChoice;
		if (choice.outcome === 'accepted') {
			setInstallPrompt(null);
		}
	}

	function dismissInstall() {
		localStorage.setItem(installDismissedKey, 'true');
		setIsInstallDismissed(true);
		setIsInstallHelpOpen(false);
	}

	const canShowPwaStatus = isStandalone;
	const canOfferInstall = isMobile && !isStandalone && !isInstallDismissed && (Boolean(installPrompt) || isIos);

	if (!isOnline) {
		return (
			<StatusCard
				tone="offline"
				title="You are offline"
				message="The League will reconnect automatically. Live scores and league actions may be unavailable."
			/>
		);
	}

	if (canShowPwaStatus && needRefresh) {
		return (
			<StatusCard
				tone="update"
				title="A new version is ready"
				message="Refresh now to use the latest League updates."
				primaryLabel="Update"
				onPrimary={() => void updateServiceWorker(true)}
				onClose={() => setNeedRefresh(false)}
			/>
		);
	}

	if (canShowPwaStatus && offlineReady) {
		return (
			<StatusCard
				tone="ready"
				title="The League is ready"
				message="The app shell is available if your connection drops."
				onClose={() => setOfflineReady(false)}
			/>
		);
	}

	if (canOfferInstall) {
		return (
			<>
				<StatusCard
					tone="install"
					title="Install The League"
					message="Open your leagues faster from your home screen."
					primaryLabel="Install"
					onPrimary={() => void installApp()}
					onClose={dismissInstall}
				/>
				{isInstallHelpOpen ? (
					<div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
						<div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
							<p className="text-xs font-bold uppercase text-emerald-700">Install on iPhone or iPad</p>
							<h2 className="mt-2 text-xl font-bold text-ink">Add The League to your Home Screen</h2>
							<ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
								<li><strong className="text-ink">1.</strong> Tap Safari's Share button.</li>
								<li><strong className="text-ink">2.</strong> Choose Add to Home Screen.</li>
								<li><strong className="text-ink">3.</strong> Tap Add.</li>
							</ol>
							<div className="mt-5 flex justify-end gap-2">
								<button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-ink" onClick={dismissInstall}>Not now</button>
								<button type="button" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => setIsInstallHelpOpen(false)}>Got it</button>
							</div>
						</div>
					</div>
				) : null}
			</>
		);
	}

	return null;
}

function StatusCard({
	tone,
	title,
	message,
	primaryLabel,
	onPrimary,
	onClose
}: {
	tone: 'offline' | 'update' | 'ready' | 'install';
	title: string;
	message: string;
	primaryLabel?: string;
	onPrimary?: () => void;
	onClose?: () => void;
}) {
	const Icon = tone === 'offline' ? WifiOff : tone === 'update' ? RefreshCw : tone === 'install' ? Download : Trophy;

	return (
		<div className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-xl items-center gap-3 rounded-lg border border-slate-800 bg-ink p-3 text-white shadow-2xl sm:p-4">
			<span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${tone === 'offline' ? 'bg-amber-300 text-amber-950' : 'bg-emerald-200 text-emerald-950'}`}>
				<Icon size={18} />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-bold">{title}</p>
				<p className="mt-0.5 text-xs leading-5 text-slate-200">{message}</p>
			</div>
			{primaryLabel && onPrimary ? (
				<button type="button" onClick={onPrimary} className="min-h-10 rounded-md bg-emerald-200 px-3 text-xs font-bold text-emerald-950 hover:bg-emerald-100">
					{primaryLabel}
				</button>
			) : null}
			{onClose ? (
				<button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
					<X size={18} />
				</button>
			) : null}
		</div>
	);
}
