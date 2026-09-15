import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logoutRequest } from '../services/auth.api';
import { forceLogout } from '../lib/authSession';

interface UseLogoutOptions {
  onSuccess?: () => void;
}

export function useLogout({ onSuccess }: UseLogoutOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      queryClient.clear();
      forceLogout('manual-logout');
      onSuccess?.();
    },
  });
}
