import { apiRequest, postJson, setAccessToken } from './api';
import type { User } from './types';

async function withPersistedToken(request: Promise<User>) {
	const user = await request;
	setAccessToken(user.accessToken);
	return user;
}

export const authService = {
	me: () => withPersistedToken(apiRequest<User>('/auth/me')),
	register: (name: string, emailAddress: string, password: string) =>
		withPersistedToken(postJson<User>('/auth/register', { name, emailAddress, password })),
	login: (emailAddress: string, password: string) =>
		withPersistedToken(postJson<User>('/auth/login', { emailAddress, password })),
	signout: async () => {
		try {
			await postJson<void>('/auth/signout');
		} finally {
			setAccessToken(null);
		}
	}
};
