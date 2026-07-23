import { useMutation } from '@tanstack/react-query';
import { loginRequest } from '../services/auth.api';
import { saveAuthSession } from '../lib/authStorage';
import type { LoginPayload } from '../types/auth';

interface UseLoginOptions {
  rememberMe?: boolean;
  onSuccess?: (message: string) => void;
}

export function useLogin({ rememberMe = true, onSuccess }: UseLoginOptions = {}) {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (result) => {
      saveAuthSession(
        {
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          user: result.data.user,
        },
        rememberMe,
      );
      onSuccess?.(result.message);
    },
  });
}
