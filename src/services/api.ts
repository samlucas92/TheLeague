const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
const trimmedApiBaseUrl = configuredApiBaseUrl.replace(/\/$/, '');
export const apiBaseUrl = trimmedApiBaseUrl.endsWith('/api') ? trimmedApiBaseUrl : `${trimmedApiBaseUrl}/api`;
export const accessTokenStorageKey = 'theleague.accessToken';

export function getAccessToken() {
	return window.localStorage.getItem(accessTokenStorageKey);
}

export function setAccessToken(accessToken: string) {
	window.localStorage.setItem(accessTokenStorageKey, accessToken);
}

export function clearAccessToken() {
	window.localStorage.removeItem(accessTokenStorageKey);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const accessToken = getAccessToken();
	const response = await fetch(`${apiBaseUrl}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			...(options.headers ?? {})
		}
	});

	if (!response.ok) {
		let message = `Request failed with ${response.status}`;
		try {
			const body = await response.json();
			message = body.error ?? message;
		} catch {
			// Keep the status-based message for empty or non-JSON responses.
		}

		throw new Error(message);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export const postJson = <T>(path: string, body?: unknown) =>
	apiRequest<T>(path, {
		method: 'POST',
		body: body === undefined ? undefined : JSON.stringify(body)
	});

export async function warmUpApi(signal?: AbortSignal) {
	const response = await fetch(`${apiBaseUrl}/health`, {
		cache: 'no-store',
		headers: { Accept: 'application/json' },
		signal
	});

	if (!response.ok) {
		throw new Error(`Warm-up failed with ${response.status}`);
	}
}
