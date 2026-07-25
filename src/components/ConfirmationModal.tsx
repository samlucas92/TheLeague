import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmationModalProps = {
	open: boolean;
	title: string;
	description: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: 'primary' | 'danger';
	loading?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

export function ConfirmationModal({
	open,
	title,
	description,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	variant = 'danger',
	loading = false,
	onCancel,
	onConfirm
}: ConfirmationModalProps) {
	return (
		<Modal open={open} title={title} onClose={onCancel}>
			<div className="grid gap-5">
				<div className="flex gap-3 rounded-md bg-slate-50 px-3 py-3">
					<div className={variant === 'danger' ? 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-700' : 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700'}>
						<AlertTriangle size={18} />
					</div>
					<div className="text-sm leading-6 text-slate-700">{description}</div>
				</div>
				<div className="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
					<Button type="button" variant={variant} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
				</div>
			</div>
		</Modal>
	);
}
