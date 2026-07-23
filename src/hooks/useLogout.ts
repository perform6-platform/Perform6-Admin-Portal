import { useMutation } from '@tanstack/react-query';
import { logoutRequest } from '../services/auth.api';
import { clearAuthSession } from '../lib/authStorage';

interface UseLogoutOptions {
  onSuccess?: () => void;
}

export function useLogout({ onSuccess }: UseLogoutOptions = {}) {
  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearAuthSession();
      onSuccess?.();
    },
  });
}
