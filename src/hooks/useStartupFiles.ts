import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { downloadStartupFile, getStartupFiles } from '../services/startupFiles.api';
import type { StartupProfileId } from '../types/startupFiles';

export function useStartupFiles() {
  return useQuery({
    queryKey: queryKeys.startupFiles.all,
    queryFn: getStartupFiles,
  });
}

export function useDownloadStartupFile() {
  return useMutation({
    mutationFn: (profile: StartupProfileId) => downloadStartupFile(profile),
  });
}
