import { apiRequest, postJson } from './api';
import type { User } from './types';

export const authService = {
	me: () => apiRequest<User>('/auth/me'),
	register: (name: string, emailAddress: string, password: string) =>
		postJson<User>('/auth/register', { name, emailAddress, password }),
	login: (emailAddress: string, password: string) =>
		postJson<User>('/auth/login', { emailAddress, password }),
	signout: () => postJson<void>('/auth/signout')
};
