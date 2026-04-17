import {useCallback} from 'react';
import {useAuthStore} from '../store/authStore';
import {useWalletStore} from '../store/walletStore';
import type {Wallet} from '../store/walletStore';
import * as walletDao from '../db/walletDao';
import * as credentialDao from '../db/credentialDao';
import {KeyManager} from '../native/KeyManager';
import {generateDIDDocument} from '../services/protocol/did';
import type {JWK} from '../services/crypto/jwt';

export function useWallet() {
  const currentWalletId = useAuthStore(s => s.currentWalletId);
  const {wallets, credentials, setWallets, addWallet, setCredentials, addCredential} =
    useWalletStore();

  const currentWallet = wallets.find(w => w.id === currentWalletId) ?? null;
  const currentCredentials = credentials.filter(
    c => c.walletId === currentWalletId,
  );

  const loadWallets = useCallback(() => {
    try {
      const loaded = walletDao.getWallets();
      setWallets(loaded);
      return loaded;
    } catch {
      setWallets([]);
      return [];
    }
  }, [setWallets]);

  const loadCredentials = useCallback(
    (walletId: string) => {
      try {
        const loaded = credentialDao.getCredentialsByWallet(walletId);
        setCredentials(loaded);
        return loaded;
      } catch {
        setCredentials([]);
        return [];
      }
    },
    [setCredentials],
  );

  const createNewWallet = useCallback(
    async (name: string, pinHash: string): Promise<Wallet> => {
      const wallet = walletDao.createWallet(name, pinHash);

      const keyTag = `wallet_${wallet.id}`;
      const jwkString = await KeyManager.generateP256Key(keyTag);
      const jwk: JWK = JSON.parse(jwkString);
      const didDocument = generateDIDDocument(jwk);

      walletDao.updateWalletDID(
        wallet.id,
        JSON.stringify(didDocument),
        jwkString,
      );

      const updatedWallet: Wallet = {
        ...wallet,
        didDocument: JSON.stringify(didDocument),
        publicKeyJwk: jwkString,
      };

      addWallet(updatedWallet);
      return updatedWallet;
    },
    [addWallet],
  );

  return {
    currentWallet,
    currentCredentials,
    wallets,
    loadWallets,
    loadCredentials,
    createNewWallet,
    addCredential,
  };
}
