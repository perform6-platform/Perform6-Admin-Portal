/**
 * Client-side JWT helpers for silent refresh scheduling.
 * Payload is not verified here — the API still validates signatures.
 */

type JwtPayload = {
  exp?: number;
};

function base64UrlToJson(segment: string): unknown {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  const json = atob(base64);
  return JSON.parse(json) as unknown;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = base64UrlToJson(parts[1]);
    if (!payload || typeof payload !== 'object') return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

/** Access token `exp` as epoch milliseconds, or null if missing/invalid. */
export function getAccessTokenExpiresAtMs(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return null;
  return exp * 1000;
}

export function isAccessTokenExpired(
  token: string,
  nowMs: number = Date.now(),
): boolean {
  const expiresAt = getAccessTokenExpiresAtMs(token);
  if (expiresAt == null) return false;
  return nowMs >= expiresAt;
}

/** True when token is missing exp, already expired, or within the skew window. */
export function isAccessTokenExpiringSoon(
  token: string,
  skewMs: number,
  nowMs: number = Date.now(),
): boolean {
  const expiresAt = getAccessTokenExpiresAtMs(token);
  if (expiresAt == null) return false;
  return nowMs >= expiresAt - skewMs;
}
