const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
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
