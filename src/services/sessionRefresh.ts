import axios from 'axios';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import {
  getAccessTokenExpiresAtMs,
  isAccessTokenExpired,
  isAccessTokenExpiringSoon,
} from '../lib/jwtAccess';
import {
  getAccessToken,
  getAuthSession,
  updateAuthTokens,
} from '../lib/authStorage';
import {
  AUTH_LOGOUT_EVENT,
  AUTH_SESSION_EVENT,
  forceLogout,
  notifyAuthSessionChanged,
} from '../lib/authSession';

/** Refresh ~2 minutes before access JWT expiry (15m access → silent renew). */
export const ACCESS_REFRESH_SKEW_MS = 120_000;

const RETRY_AFTER_NETWORK_MS = 30_000;
const MIN_TIMER_MS = 1_000;

let refreshPromise: Promise<string> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function isRefreshAuthFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}

/**
 * Single-flight exchange of refresh token for a new access/refresh pair.
 * Auth failures log the user out; transient network errors do not.
 */
export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getAuthSession()?.refreshToken;
    if (!refreshToken) {
      forceLogout('missing-refresh-token');
      throw new Error('Missing refresh token');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      const data = response.data?.data;
      if (!data?.accessToken || !data?.refreshToken) {
        forceLogout('refresh-failed');
        throw new Error('Invalid refresh response');
      }
      updateAuthTokens(data.accessToken, data.refreshToken);
      notifyAuthSessionChanged();
      return data.accessToken as string;
    } catch (error) {
      if (isRefreshAuthFailure(error)) {
        forceLogout('refresh-failed');
      }
      throw error;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Ensure the stored access token is still usable for the next API call.
 * Refreshes when inside the skew window (or already expired).
 * On soft network failure while the access JWT is still valid, returns it.
 */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  if (!isAccessTokenExpiringSoon(accessToken, ACCESS_REFRESH_SKEW_MS)) {
    return accessToken;
  }

  try {
    return await refreshAccessToken();
  } catch {
    if (!isAccessTokenExpired(accessToken)) {
      return accessToken;
    }
    return null;
  }
}

export function stopSilentRefreshScheduler(): void {
  if (refreshTimer != null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/** Schedule a background refresh just before the current access token expires. */
export function scheduleSilentRefresh(): void {
  stopSilentRefreshScheduler();

  const accessToken = getAccessToken();
  if (!accessToken || !getAuthSession()?.refreshToken) return;

  const expiresAt = getAccessTokenExpiresAtMs(accessToken);
  if (expiresAt == null) return;

  const delayMs = Math.max(expiresAt - Date.now() - ACCESS_REFRESH_SKEW_MS, 0);

  refreshTimer = setTimeout(() => {
    void (async () => {
      try {
        await refreshAccessToken();
        scheduleSilentRefresh();
      } catch (error) {
        if (isRefreshAuthFailure(error)) return;
        refreshTimer = setTimeout(() => {
          scheduleSilentRefresh();
        }, RETRY_AFTER_NETWORK_MS);
      }
    })();
  }, Math.max(delayMs, MIN_TIMER_MS));
}

/**
 * Attach timer + tab-focus silent refresh for the admin session.
 * Call once from AuthSessionBridge; returns a cleanup function.
 */
export function startSessionRefreshLifecycle(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  scheduleSilentRefresh();

  const onSession = () => scheduleSilentRefresh();
  const onLogout = () => stopSilentRefreshScheduler();
  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return;
    void ensureFreshAccessToken().then(() => scheduleSilentRefresh());
  };

  window.addEventListener(AUTH_SESSION_EVENT, onSession);
  window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    stopSilentRefreshScheduler();
    window.removeEventListener(AUTH_SESSION_EVENT, onSession);
    window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

export function isAuthPublicPath(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}
