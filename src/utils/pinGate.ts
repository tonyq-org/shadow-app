const FREE_ATTEMPTS = 30;
const MIN_WAIT_SECONDS = 2;
const MAX_WAIT_SECONDS = 3600;

export type PinGate =
  | {allowed: true}
  | {allowed: false; remainingSeconds: number; nextAttempt: number};

export function computePinGate(
  failureCount: number,
  lastFailureAt: number,
  now: number = Date.now(),
): PinGate {
  if (failureCount < FREE_ATTEMPTS) return {allowed: true};

  const exponent = failureCount - (FREE_ATTEMPTS - 1);
  const waitSeconds = Math.min(
    MAX_WAIT_SECONDS,
    Math.max(MIN_WAIT_SECONDS, 2 ** exponent),
  );
  const nextAttempt = lastFailureAt + waitSeconds * 1000;
  const remainingMs = nextAttempt - now;
  if (remainingMs <= 0) return {allowed: true};
  return {
    allowed: false,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    nextAttempt,
  };
}
