import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
	address: string | null;
	isConnected: boolean;
	isAuthenticated: boolean;
	authToken: string | null;

	// 액션
	setAddress: (address: string | null) => void;
	setConnected: (connected: boolean) => void;
	setAuthenticated: (authenticated: boolean) => void;
	setAuthToken: (token: string | null) => void;
	disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
	persist(
		(set) => ({
			address: null,
			isConnected: false,
			isAuthenticated: false,
			authToken: null,

			setAddress: (address) => set({ address }),
			setConnected: (connected) => set({ isConnected: connected }),
			setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
			setAuthToken: (token) => set({ authToken: token }),
			disconnect: () =>
				set({
					address: null,
					isConnected: false,
					isAuthenticated: false,
					authToken: null,
				}),
		}),
		{
			name: 'wallet-storage',
			partialize: (state) => ({
				address: state.address,
				isConnected: state.isConnected,
				isAuthenticated: state.isAuthenticated,
				authToken: state.authToken,
			}),
		}
	)
);
