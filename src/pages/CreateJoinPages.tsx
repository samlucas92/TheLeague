import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Field, SelectInput, TextArea, TextInput } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { leagueService } from '../services/leagueService';
import type { JoinPreview } from '../services/types';
import { useAuthStore } from '../store/authStore';

export function CreateLeaguePage() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [presetType, setPresetType] = useState('Custom');
	const [joinMode, setJoinMode] = useState('OpenWithCode');
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsSubmitting(true);
		try {
			const league = await leagueService.create({ name, description, presetType, joinMode });
			navigate(`/leagues/${league.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not create league.');
			setIsSubmitting(false);
		}
	}

	return (
		<div className="grid gap-6">
			<PageHeader title="Create League" description="Choose a preset, joining mode, and basic details." />
			<form className="grid max-w-2xl gap-4 rounded-lg border border-slate-200 bg-white p-5" onSubmit={onSubmit}>
				<Field label="League name"><TextInput value={name} onChange={(event) => setName(event.target.value)} required /></Field>
				<Field label="Description"><TextArea value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
				<Field label="Preset">
					<SelectInput value={presetType} onChange={(event) => setPresetType(event.target.value)}>
						<option value="Custom">Custom</option>
						<option value="Stag">Stag League</option>
					</SelectInput>
				</Field>
				<Field label="Join mode">
					<SelectInput value={joinMode} onChange={(event) => setJoinMode(event.target.value)}>
						<option value="OpenWithCode">Open with code</option>
						<option value="ApprovalRequired">Approval required</option>
					</SelectInput>
				</Field>
				{error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
				<Button loading={isSubmitting} loadingLabel="Creating league...">Create league</Button>
			</form>
		</div>
	);
}

export function JoinLeaguePage() {
	const [joinCode, setJoinCode] = useState('');
	const [displayName, setDisplayName] = useState('');
	const [preview, setPreview] = useState<JoinPreview | null>(null);
	const [error, setError] = useState('');
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { user } = useAuthStore();
	const codeFromUrl = searchParams.get('joinCode')?.trim().toUpperCase() ?? '';

	useEffect(() => {
		if (!codeFromUrl) {
			return;
		}

		setJoinCode(codeFromUrl);
		if (user?.name) {
			setDisplayName((currentName) => currentName || user.name);
		}

		setError('');
		leagueService.previewJoin(codeFromUrl)
			.then(setPreview)
			.catch((err) => setError(err instanceof Error ? err.message : 'Join code not found.'));
	}, [codeFromUrl, user?.name]);

	async function previewCode(event: FormEvent) {
		event.preventDefault();
		setError('');
		setIsPreviewing(true);
		try {
			const normalizedJoinCode = joinCode.trim().toUpperCase();
			setJoinCode(normalizedJoinCode);
			setPreview(await leagueService.previewJoin(normalizedJoinCode));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Join code not found.');
		} finally {
			setIsPreviewing(false);
		}
	}

	async function joinLeague() {
		setError('');
		setIsJoining(true);
		try {
			const member = await leagueService.join(joinCode.trim().toUpperCase(), displayName);
			navigate(`/leagues/${member.leagueId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not join league.');
			setIsJoining(false);
		}
	}

	return (
		<div className="grid gap-6">
			<PageHeader
				title="Join League"
				description={codeFromUrl ? 'Confirm your display name to finish joining this league.' : 'Enter the code from the league owner, then choose your display name.'}
			/>
			<form className="grid max-w-xl gap-4 rounded-lg border border-slate-200 bg-white p-5" onSubmit={previewCode}>
				<Field label="Join code"><TextInput value={joinCode} onChange={(event) => setJoinCode(event.target.value)} required /></Field>
				<Button loading={isPreviewing} loadingLabel="Checking code...">Preview league</Button>
			</form>
			{preview ? (
				<div className="grid max-w-xl gap-4 rounded-lg border border-slate-200 bg-white p-5">
					<div>
						<h2 className="text-lg font-bold text-ink">{preview.name}</h2>
						<p className="text-sm text-slate-600">Owner: {preview.ownerName}</p>
					</div>
					<Field label="Display name"><TextInput value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></Field>
					<Button onClick={joinLeague} loading={isJoining} loadingLabel="Joining...">Join {preview.requiresApproval ? 'and wait for approval' : 'now'}</Button>
				</div>
			) : null}
			{error ? <p className="max-w-xl rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
		</div>
	);
}
