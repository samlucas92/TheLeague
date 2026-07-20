import { create } from 'zustand';
import { accessTokenStorageKey } from '../services/api';
import { authService } from '../services/authService';
import type { User } from '../services/types';

type AuthState = {
	user: User | null;
	isLoading: boolean;
	setUser: (user: User | null) => void;
	loadMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isLoading: true,
	setUser: (user) => {
		if (user?.accessToken) {
			window.localStorage.setItem(accessTokenStorageKey, user.accessToken);
		} else if (!user) {
			window.localStorage.removeItem(accessTokenStorageKey);
		}

		set({ user });
	},
	loadMe: async () => {
		try {
			const user = await authService.me();
			if (user.accessToken) {
				window.localStorage.setItem(accessTokenStorageKey, user.accessToken);
			}
			set({ user, isLoading: false });
		} catch {
			window.localStorage.removeItem(accessTokenStorageKey);
			set({ user: null, isLoading: false });
		}
	}
}));
