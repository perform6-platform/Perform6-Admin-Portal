import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  AUTH_LOGOUT_EVENT,
  AUTH_SESSION_EVENT,
  hasUsableAccessToken,
} from '../lib/authSession';
import { isAuthenticated } from '../lib/authStorage';

export default function ProtectedRoute() {
  const location = useLocation();
  const [authed, setAuthed] = useState(() => isAuthenticated());

  useEffect(() => {
    const sync = () => setAuthed(hasUsableAccessToken());
    sync();
    window.addEventListener(AUTH_SESSION_EVENT, sync);
    window.addEventListener(AUTH_LOGOUT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, sync);
      window.removeEventListener(AUTH_LOGOUT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
