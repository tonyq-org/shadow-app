import {create} from 'zustand';

export interface Wallet {
  id: string;
  name: string;
  pinHash: string;
  pinSalt: string;
  didDocument: string | null;
  publicKeyJwk: string | null;
  autoLogoutMinutes: number;
  biometricEnabled: boolean;
  createdAt: number;
}

export interface Credential {
  id: string;
  walletId: string;
  rawJwt: string;
  issuerDid: string | null;
  issuerName: string | null;
  credentialType: string | null;
  displayName: string | null;
  displayImage: string | null;
  status: CredentialStatus;
  issuedAt: number | null;
  expiresAt: number | null;
  createdAt: number;
}

export enum CredentialStatus {
  Unverified = 0,
  Verified = 1,
  Revoked = 2,
}

interface WalletState {
  wallets: Wallet[];
  credentials: Credential[];
  setWallets: (wallets: Wallet[]) => void;
  addWallet: (wallet: Wallet) => void;
  removeWallet: (id: string) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  setCredentials: (credentials: Credential[]) => void;
  addCredential: (credential: Credential) => void;
  removeCredential: (id: string) => void;
  updateCredentialStatus: (id: string, status: CredentialStatus) => void;
}

export const useWalletStore = create<WalletState>(set => ({
  wallets: [],
  credentials: [],
  setWallets: wallets => set({wallets}),
  addWallet: wallet => set(s => ({wallets: [...s.wallets, wallet]})),
  removeWallet: id => set(s => ({wallets: s.wallets.filter(w => w.id !== id)})),
  updateWallet: (id, updates) =>
    set(s => ({
      wallets: s.wallets.map(w => (w.id === id ? {...w, ...updates} : w)),
    })),
  setCredentials: credentials => set({credentials}),
  addCredential: credential =>
    set(s => ({credentials: [...s.credentials, credential]})),
  removeCredential: id =>
    set(s => ({credentials: s.credentials.filter(c => c.id !== id)})),
  updateCredentialStatus: (id, status) =>
    set(s => ({
      credentials: s.credentials.map(c =>
        c.id === id ? {...c, status} : c,
      ),
    })),
}));
