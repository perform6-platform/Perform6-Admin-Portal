import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getCategoryContent, getProgramContent } from '../services/content.api';

/** GET /content/category/:id */
export function useCategoryContent(categoryId: string | null) {
  return useQuery({
    queryKey: queryKeys.content.category(categoryId ?? ''),
    queryFn: () => getCategoryContent(categoryId as string),
    enabled: Boolean(categoryId),
  });
}

/** GET /content/program/:id */
export function useProgramContent(programId: string | null) {
  return useQuery({
    queryKey: queryKeys.content.program(programId ?? ''),
    queryFn: () => getProgramContent(programId as string),
    enabled: Boolean(programId),
  });
}
