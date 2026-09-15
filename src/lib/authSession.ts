import { clearAuthSession, getAccessToken, isAuthenticated } from './authStorage';

export const AUTH_LOGOUT_EVENT = 'perform6:auth-logout';
export const AUTH_SESSION_EVENT = 'perform6:auth-session';

export type AuthLogoutDetail = {
  reason?: string;
};

/** Notify the app that session tokens changed (login / refresh). */
export function notifyAuthSessionChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT));
}

/**
 * Clear local session and force the admin UI back to login.
 * Used when refresh fails or the session is no longer usable.
 */
export function forceLogout(reason = 'session-expired'): void {
  clearAuthSession();
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AuthLogoutDetail>(AUTH_LOGOUT_EVENT, {
      detail: { reason },
    }),
  );
}

export function hasUsableAccessToken(): boolean {
  return Boolean(getAccessToken()) && isAuthenticated();
}
