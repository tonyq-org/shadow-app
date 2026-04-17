import {useCallback} from 'react';
import {useAuthStore} from '../store/authStore';
import {useWalletStore} from '../store/walletStore';
import type {Wallet} from '../store/walletStore';
import * as walletDao from '../db/walletDao';
import * as credentialDao from '../db/credentialDao';
import {generateKeyPair} from '../services/crypto/native';
import {generateDIDDocument} from '../services/protocol/did';

export function useWallet() {
  const currentWalletId = useAuthStore(s => s.currentWalletId);
  const {wallets, credentials, setWallets, addWallet, setCredentials, addCredential} =
    useWalletStore();

  const currentWallet = wallets.find(w => w.id === currentWalletId) ?? null;
  const currentCredentials = credentials.filter(
    c => c.walletId === currentWalletId,
  );

  const loadWallets = useCallback(() => {
    const loaded = walletDao.getWallets();
    setWallets(loaded);
    return loaded;
  }, [setWallets]);

  const loadCredentials = useCallback(
    (walletId: string) => {
      const loaded = credentialDao.getCredentialsByWallet(walletId);
      setCredentials(loaded);
      return loaded;
    },
    [setCredentials],
  );

  const createNewWallet = useCallback(
    async (name: string, pinHash: string): Promise<Wallet> => {
      const wallet = walletDao.createWallet(name, pinHash);

      // Generate key pair and DID
      const keyTag = `wallet_${wallet.id}`;
      const jwk = await generateKeyPair(keyTag);
      const didDocument = generateDIDDocument(jwk);

      walletDao.updateWalletDID(
        wallet.id,
        JSON.stringify(didDocument),
        JSON.stringify(jwk),
      );

      const updatedWallet: Wallet = {
        ...wallet,
        didDocument: JSON.stringify(didDocument),
        publicKeyJwk: JSON.stringify(jwk),
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
