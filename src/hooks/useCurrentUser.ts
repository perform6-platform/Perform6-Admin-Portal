import { useQuery } from '@tanstack/react-query';
import { getAuthSession } from '../lib/authStorage';
import { getCurrentUserRequest } from '../services/auth.api';

export function useCurrentUser() {
  const hasSession = Boolean(getAuthSession()?.accessToken);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUserRequest,
    enabled: hasSession,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: () => getAuthSession()?.user,
  });
}
