// Registry of trust lists our app recognizes. Each entry is a small design token
// record — short code / color / role — so the UI can show consistent chips.
// Layer 1 seeds: `moda` (official Taiwan gov list, backed by issuer_trust table),
// `shadow` (civic), `educhain` (W3C EduChain), `untrusted` (fallback).

export type TrustListRole = 'government' | 'civic' | 'international' | 'unknown';

export interface TrustList {
  id: string;
  name: string;
  nameEn: string;
  short: string;
  color: string;
  role: TrustListRole;
}

export interface CredentialVerification {
  trustList: string;
  status: 'verified' | 'pending' | 'unknown';
  verifiedAt: string | null;
}

export const TRUST_LISTS: Record<string, TrustList> = {
  moda: {
    id: 'moda',
    name: '數位發展部',
    nameEn: 'MODA · Taiwan',
    short: 'MODA',
    color: '#7FA8D0',
    role: 'government',
  },
  shadow: {
    id: 'shadow',
    name: '影子皮夾社群',
    nameEn: 'Shadow Wallet Community',
    short: 'SHADOW',
    color: '#E8C97A',
    role: 'civic',
  },
  educhain: {
    id: 'educhain',
    name: 'W3C EduChain',
    nameEn: 'W3C EduChain Registry',
    short: 'EDUCHAIN',
    color: '#A8B8D0',
    role: 'international',
  },
  untrusted: {
    id: 'untrusted',
    name: '未知發行者',
    nameEn: 'Not on any trust list',
    short: 'UNKNOWN',
    color: '#A8A8A8',
    role: 'unknown',
  },
};

export function getTrustList(id: string): TrustList {
  return TRUST_LISTS[id] ?? TRUST_LISTS.untrusted;
}
