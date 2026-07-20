export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warning' | 'bad' }) {
	const classes = {
		neutral: 'bg-slate-100 text-slate-700',
		good: 'bg-emerald-100 text-emerald-800',
		warning: 'bg-amber-100 text-amber-800',
		bad: 'bg-red-100 text-red-800'
	};

	return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${classes[tone]}`}>{label}</span>;
}
