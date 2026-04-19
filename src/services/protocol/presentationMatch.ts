import {JSONPath} from 'jsonpath-plus';
import {sdJwtDecode} from './sdjwt';
import type {InputDescriptor} from './oid4vp';

export interface CredentialCandidate {
  id: string;
  rawJwt: string;
}

function decodePayload(rawJwt: string): Record<string, unknown> {
  try {
    const decoded = sdJwtDecode(rawJwt);
    return decoded.payload as Record<string, unknown>;
  } catch {
    return {};
  }
}

function matchFilter(value: unknown, filter: Record<string, unknown>): boolean {
  if ('const' in filter) return value === filter.const;
  if (Array.isArray(filter.enum)) return (filter.enum as unknown[]).includes(value);
  if (typeof filter.pattern === 'string') {
    if (typeof value !== 'string') return false;
    try {
      return new RegExp(filter.pattern).test(value);
    } catch {
      return false;
    }
  }
  if (filter.contains && typeof filter.contains === 'object' && Array.isArray(value)) {
    return value.some(v => matchFilter(v, filter.contains as Record<string, unknown>));
  }
  return true;
}

/**
 * DIF Presentation Exchange 2.0 — descriptor vs credential evaluation.
 * A descriptor matches iff every `constraints.fields[]` resolves at least one
 * JSONPath whose value passes its `filter` (const/enum/pattern/contains).
 */
export function descriptorMatches(
  descriptor: InputDescriptor,
  payload: Record<string, unknown>,
): boolean {
  const fields = descriptor.constraints?.fields ?? [];
  if (fields.length === 0) return true;
  for (const field of fields) {
    let ok = false;
    for (const path of field.path) {
      const result = JSONPath({path, json: payload, wrap: true}) as unknown[];
      for (const v of result) {
        if (v === undefined || v === null) continue;
        if (!field.filter || matchFilter(v, field.filter)) {
          ok = true;
          break;
        }
      }
      if (ok) break;
    }
    if (!ok) return false;
  }
  return true;
}

export function findMatchingCredential<T extends CredentialCandidate>(
  descriptor: InputDescriptor,
  credentials: T[],
): T | undefined {
  for (const c of credentials) {
    if (descriptorMatches(descriptor, decodePayload(c.rawJwt))) return c;
  }
  return undefined;
}

export function extractRequestedClaimKeys(descriptor: InputDescriptor): Set<string> {
  const keys = new Set<string>();
  for (const f of descriptor.constraints?.fields ?? []) {
    for (const p of f.path) {
      const m = p.match(/\.([A-Za-z0-9_]+)(?:\[|$)/);
      if (m) keys.add(m[1]);
    }
  }
  return keys;
}
