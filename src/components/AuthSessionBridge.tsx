import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AUTH_LOGOUT_EVENT,
  type AuthLogoutDetail,
} from '../lib/authSession';
import { startSessionRefreshLifecycle } from '../services/sessionRefresh';

/**
 * Session bridge for the admin CMS:
 * - Silent access-token refresh before expiry (no 401 wave)
 * - Forced logout → clear cache + navigate to /login
 */
export default function AuthSessionBridge({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => startSessionRefreshLifecycle(), []);

  useEffect(() => {
    const onLogout = (event: Event) => {
      const detail = (event as CustomEvent<AuthLogoutDetail>).detail;
      queryClient.clear();
      const path = window.location.pathname;
      if (
        path === '/login' ||
        path === '/forgot-password' ||
        path === '/reset-password'
      ) {
        return;
      }
      navigate('/login', {
        replace: true,
        state: { reason: detail?.reason ?? 'session-expired' },
      });
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, [navigate, queryClient]);

  return <>{children}</>;
}
