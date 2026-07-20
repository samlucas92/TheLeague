import { useEffect, useState } from 'react';

export function CopyJoinCodeBadge({ joinCode, label = 'Join code' }: { joinCode: string; label?: string }) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return undefined;
		}

		const timeoutId = window.setTimeout(() => setCopied(false), 2000);
		return () => window.clearTimeout(timeoutId);
	}, [copied]);

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(joinCode);
		} catch {
			const input = document.createElement('input');
			input.value = joinCode;
			document.body.append(input);
			input.select();
			document.execCommand('copy');
			input.remove();
		}

		setCopied(true);
	}

	return (
		<button
			type="button"
			className="inline-flex min-h-11 min-w-40 items-center justify-center rounded-lg bg-emerald-100 px-4 py-2 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
			onClick={copyCode}
			aria-live="polite"
			aria-label={`Copy join code ${joinCode}`}
			title="Copy join code"
		>
			{copied ? 'Code copied' : `${label} ${joinCode}`}
		</button>
	);
}
