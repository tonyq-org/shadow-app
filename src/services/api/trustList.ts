import {httpClient} from './http';
import {env} from '../../config/env';
import type {Issuer} from '../verification/vcVerifier';

export async function fetchTrustList(
  page = 0,
  size = 20,
): Promise<Issuer[]> {
  const response = await httpClient.get(
    `${env.trustListApiUrl}/api/did`,
    {params: {size, page, orgType: 1, status: 1}},
  );
  return response.data?.dids ?? response.data ?? [];
}

export async function fetchIssuerStatus(
  issuerDid: string,
): Promise<Issuer | null> {
  try {
    const response = await httpClient.get(
      `${env.trustListApiUrl}/api/did/${issuerDid}`,
    );
    return response.data;
  } catch {
    return null;
  }
}

export async function fetchVCStatusList(
  url: string,
): Promise<string> {
  const response = await httpClient.get(url);
  return typeof response.data === 'string'
    ? response.data
    : JSON.stringify(response.data);
}
