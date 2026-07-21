import { create } from 'zustand';
import { setAccessToken } from '../services/api';
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
		setAccessToken(user?.accessToken);
		set({ user });
	},
	loadMe: async () => {
		try {
			const user = await authService.me();
			set({ user, isLoading: false });
		} catch {
			setAccessToken(null);
			set({ user: null, isLoading: false });
		}
	}
}));
