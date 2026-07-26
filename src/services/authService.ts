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
	changePassword: (currentPassword: string, newPassword: string) =>
		postJson<void>('/auth/change-password', { currentPassword, newPassword }),
	forgotPassword: (emailAddress: string) =>
		postJson<{ message: string; resetLink?: string | null; expiresAt?: string | null }>('/auth/forgot-password', { emailAddress }),
	resetPassword: (token: string, newPassword: string) =>
		postJson<void>('/auth/reset-password', { token, newPassword }),
	resendEmailVerification: () =>
		postJson<{ message: string }>('/auth/email-verification'),
	verifyEmail: (token: string) =>
		postJson<void>('/auth/verify-email', { token }),
	signout: async () => {
		try {
			await postJson<void>('/auth/signout');
		} finally {
			clearAccessToken();
		}
	}
};
