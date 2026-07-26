import { useState } from 'react';
import { Copy, Mail, MessageCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Field, TextInput } from '../../../components/FormField';
import { Modal } from '../../../components/Modal';
import type { League } from '../../../services/types';

export function ShareLeagueModal({ open, league, onClose }: { open: boolean; league: League; onClose: () => void }) {
	const [message, setMessage] = useState('');
	const shareUrl = typeof window === 'undefined'
		? `/view/${league.joinCode}`
		: `${window.location.origin}/view/${league.joinCode}`;
	const shareText = `View ${league.name} on The League`;
	const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${shareUrl}`)}`;
	const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Use this link to view the league:\n\n${shareUrl}\n\nJoin code: ${league.joinCode}`)}`;

	async function copyLink() {
		setMessage('');
		try {
			await navigator.clipboard.writeText(shareUrl);
			setMessage('Link copied.');
		} catch {
			setMessage('Copy failed. Select the link and copy it manually.');
		}
	}

	return (
		<Modal
			open={open}
			title="Share league"
			description="Send a view-only link. People can see the league without signing in, but cannot take actions."
			onClose={onClose}
		>
			<div className="grid gap-4">
				<Field label="Share link">
					<TextInput value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
				</Field>
				<div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
					Join code: <span className="font-bold text-ink">{league.joinCode}</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<Button type="button" variant="secondary" icon={<Copy size={16} />} onClick={copyLink}>Copy link</Button>
					<a href={whatsappUrl} target="_blank" rel="noreferrer">
						<Button type="button" variant="secondary" icon={<MessageCircle size={16} />} className="w-full">WhatsApp</Button>
					</a>
					<a href={emailUrl}>
						<Button type="button" variant="secondary" icon={<Mail size={16} />} className="w-full">Email</Button>
					</a>
				</div>
				{message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
				<div className="flex justify-end">
					<Button type="button" onClick={onClose}>Done</Button>
				</div>
			</div>
		</Modal>
	);
}
