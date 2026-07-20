import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type FieldProps = {
	label: string;
	children: ReactNode;
};

export function Field({ label, children }: FieldProps) {
	return (
		<label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">
			<span>{label}</span>
			{children}
		</label>
	);
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
	return <input className="min-h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return <textarea className="min-h-24 w-full min-w-0 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
	return <select className="min-h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" {...props} />;
}
