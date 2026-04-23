// Bridge between the raw trust data we persist (issuer_trust table, Layer 1)
// and the multi-trust-list verification array the UI consumes.
//
// For now we only populate `moda` from the local cache — the other registries
// (shadow, educhain) will hook in once their sources exist. Issuers not found
// on any known list fall back to a single `untrusted` chip.

import {lookupIssuerTrust} from './issuerTrustList';
import type {CredentialVerification} from './trustListRegistry';

function formatVerifiedAt(ts: number | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}·${m}·${day}`;
}

export function deriveVerifications(
  issuerDid: string | null,
): CredentialVerification[] {
  const verifications: CredentialVerification[] = [];

  const moda = lookupIssuerTrust(issuerDid);
  if (moda && moda.status === 1) {
    verifications.push({
      trustList: 'moda',
      status: 'verified',
      verifiedAt: formatVerifiedAt(moda.updatedAt ?? moda.fetchedAt),
    });
  }

  if (verifications.length === 0) {
    verifications.push({
      trustList: 'untrusted',
      status: 'unknown',
      verifiedAt: null,
    });
  }

  return verifications;
}
