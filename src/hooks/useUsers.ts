import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { createUser, getUser, getUsers } from '../services/users.api';
import type { CreateUserPayload } from '../types/users';

/** GET /users */
export function useUsers() {
  return useQuery({ queryKey: queryKeys.users.all, queryFn: getUsers });
}

/** GET /users/:id */
export function useUser(id: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ''),
    queryFn: () => getUser(id as string),
    enabled: Boolean(id),
  });
}

/** POST /users */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
