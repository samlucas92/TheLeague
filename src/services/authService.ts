import { apiRequest, postJson, setAccessToken } from './api';
import type { LoginResponse, User } from './types';

async function withPersistedToken(request: Promise<LoginResponse>) {
	const response = await request;
	const token = response.token ?? response.accessToken ?? response.Token ?? response.AccessToken;
	const user = response.user ?? response.User ?? readLegacyUser(response);

	if (!token) {
		throw new Error('Login succeeded but the API did not return an access token.');
	}

	setAccessToken(token);
	return user;
}

function readLegacyUser(response: LoginResponse): User {
	const id = response.id ?? response.Id;
	const name = response.name ?? response.Name;
	const emailAddress = response.emailAddress ?? response.EmailAddress;

	if (!id || !name || !emailAddress) {
		throw new Error('Login succeeded but the API did not return a user.');
	}

	return { id, name, emailAddress };
}

export const authService = {
	me: () => apiRequest<User>('/auth/me'),
	register: (name: string, emailAddress: string, password: string) =>
		withPersistedToken(postJson<LoginResponse>('/auth/register', { name, emailAddress, password })),
	login: (emailAddress: string, password: string) =>
		withPersistedToken(postJson<LoginResponse>('/auth/login', { emailAddress, password })),
	signout: async () => {
		try {
			await postJson<void>('/auth/signout');
		} finally {
			setAccessToken(null);
		}
	}
};
