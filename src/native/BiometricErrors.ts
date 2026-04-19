export enum BiometryErrorCode {
  UserCancel = 'UserCancel',
  Lockout = 'Lockout',
  LockoutPermanent = 'LockoutPermanent',
  KeyInvalidated = 'KeyInvalidated',
  NotAvailable = 'NotAvailable',
  Unknown = 'Unknown',
}

export interface BiometryError {
  code: BiometryErrorCode;
  message: string;
}

export function mapBiometryError(raw: unknown): BiometryError {
  const message = typeof raw === 'string' ? raw : (raw as any)?.message ?? String(raw ?? '');
  const lower = message.toLowerCase();

  if (lower.includes('cancel') || lower.includes('usercancel') || lower.includes('user canceled')) {
    return {code: BiometryErrorCode.UserCancel, message};
  }
  if (lower.includes('permanent') || lower.includes('keypermanentlyinvalidated')) {
    return {code: BiometryErrorCode.KeyInvalidated, message};
  }
  if (lower.includes('lockout') || lower.includes('too many attempts')) {
    return {code: BiometryErrorCode.Lockout, message};
  }
  if (lower.includes('not available') || lower.includes('not enrolled') || lower.includes('no hardware')) {
    return {code: BiometryErrorCode.NotAvailable, message};
  }
  if (lower.includes('-25293') || lower.includes('errsecauthfailed') || lower.includes('authentication failed')) {
    return {code: BiometryErrorCode.KeyInvalidated, message};
  }
  return {code: BiometryErrorCode.Unknown, message};
}
