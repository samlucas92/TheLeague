import { apiRequest, clearAccessToken, postJson, setAccessToken } from './api';
import type { LoginResponse, User } from './types';

async function withPersistedToken(request: Promise<LoginResponse>) {
	const response = await request;
	setAccessToken(response.token);
	return response.user;
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
			clearAccessToken();
		}
	}
};
