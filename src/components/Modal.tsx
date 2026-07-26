import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

type ModalProps = {
	open: boolean;
	title: string;
	description?: string;
	children: ReactNode;
	onClose: () => void;
	size?: 'default' | 'wide';
};

export function Modal({ open, title, description, children, onClose, size = 'default' }: ModalProps) {
	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/45 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<section className={`flex max-h-[90vh] w-full min-w-0 flex-col overflow-hidden rounded-lg bg-white shadow-xl ${size === 'wide' ? 'max-w-3xl' : 'max-w-xl'}`}>
				<header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
					<div>
						<h2 id="modal-title" className="text-xl font-bold text-ink">{title}</h2>
						{description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
					</div>
					<Button type="button" variant="ghost" className="shrink-0 px-2" onClick={onClose} aria-label="Close modal">
						<X size={18} />
					</Button>
				</header>
				<div className="min-w-0 overflow-auto px-5 py-5">
					{children}
				</div>
			</section>
		</div>
	);
}
