import { create } from 'zustand';
import { getAccessToken, setAccessToken } from '../services/api';
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
		if (!user) {
			setAccessToken(null);
		}

		set({ user });
	},
	loadMe: async () => {
		const tokenAtRequestStart = getAccessToken();
		try {
			const user = await authService.me();
			set({ user, isLoading: false });
		} catch {
			if (getAccessToken() !== tokenAtRequestStart) {
				set({ isLoading: false });
				return;
			}

			setAccessToken(null);
			set({ user: null, isLoading: false });
		}
	}
}));
