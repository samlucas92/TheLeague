import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
	return (
		<div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 className="text-2xl font-bold text-ink">{title}</h1>
				{description ? <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p> : null}
			</div>
			{actions ? <div className="grid w-full gap-2 min-[380px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">{actions}</div> : null}
		</div>
	);
}
