import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getProgram, getPrograms } from '../services/programs.api';

/** GET /programs */
export function usePrograms() {
  return useQuery({ queryKey: queryKeys.programs.all, queryFn: getPrograms });
}

/** GET /programs/:id */
export function useProgram(id: string | null) {
  return useQuery({
    queryKey: queryKeys.programs.detail(id ?? ''),
    queryFn: () => getProgram(id as string),
    enabled: Boolean(id),
  });
}
