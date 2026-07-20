import { create } from 'zustand';
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
	setUser: (user) => set({ user }),
	loadMe: async () => {
		try {
			const user = await authService.me();
			set({ user, isLoading: false });
		} catch {
			set({ user: null, isLoading: false });
		}
	}
}));
