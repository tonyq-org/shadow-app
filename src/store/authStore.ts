import {create} from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  currentWalletId: string | null;
  login: (walletId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  currentWalletId: null,
  login: walletId => set({isAuthenticated: true, currentWalletId: walletId}),
  logout: () => set({isAuthenticated: false, currentWalletId: null}),
}));
