import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	icon?: ReactNode;
	loading?: boolean;
	loadingLabel?: string;
};

const variants = {
	primary: 'bg-ink text-white hover:bg-black',
	secondary: 'bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50',
	danger: 'bg-coral text-white hover:bg-red-700',
	ghost: 'bg-transparent text-ink hover:bg-slate-100'
};

export function Button({ variant = 'primary', icon, loading = false, loadingLabel, className = '', children, disabled, ...props }: ButtonProps) {
	return (
		<button
			className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			{...props}
		>
			{loading ? <Loader2 size={16} className="animate-spin" /> : icon}
			{loading ? (loadingLabel ?? children) : children}
		</button>
	);
}
