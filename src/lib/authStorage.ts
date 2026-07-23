import type { AuthSession } from '../types/auth';

const SESSION_KEY = 'perform6_auth_session';

function getStorage(persistent: boolean): Storage {
  return persistent ? localStorage : sessionStorage;
}

export function saveAuthSession(session: AuthSession, rememberMe: boolean): void {
  const storage = getStorage(rememberMe);
  const other = getStorage(!rememberMe);
  other.removeItem(SESSION_KEY);
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  const raw =
    localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function getAccessToken(): string | null {
  return getAuthSession()?.accessToken ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
