const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const trimmedApiBaseUrl = configuredApiBaseUrl.replace(/\/$/, '');
const apiBaseUrl = trimmedApiBaseUrl.endsWith('/api') ? trimmedApiBaseUrl : `${trimmedApiBaseUrl}/api`;
export const accessTokenStorageKey = 'theleague.accessToken';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const accessToken = window.localStorage.getItem(accessTokenStorageKey);
	const response = await fetch(`${apiBaseUrl}${path}`, {
		...options,
		credentials: 'include',
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
