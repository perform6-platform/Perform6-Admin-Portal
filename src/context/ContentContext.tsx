import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { ContentCategoryId, ContentItem } from '../constants/contentLibrary';
import type { PlaybackCategoryId } from '../constants/contentPlayback';
import { useMediaAssets } from '../hooks/useMedia';
import { mapMediaAssetToContentItem } from '../lib/deviceMapper';
import { getManageableCategoryIds } from '../lib/programHelpers';
import { isInterruptedUploadAsset } from '../lib/uploadFileCache';

interface ContentContextValue {
  items: ContentItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
  getVideosByCategory: (categoryId: ContentCategoryId) => ContentItem[];
  getVideoCountByCategory: (categoryId: ContentCategoryId) => number;
  getVideosForProgram: (programId: PlaybackCategoryId | ContentCategoryId) => ContentItem[];
  getVideoCountForProgram: (programId: PlaybackCategoryId | ContentCategoryId) => number;
}

const ContentContext = createContext<ContentContextValue | null>(null);

function isReadyVideo(item: ContentItem): boolean {
  return item.mediaType === 'video' && (!item.status || item.status === 'READY');
}

const MEDIA_LIST_QUERY = {
  page: 1,
  limit: 100,
  sortBy: 'createdAt',
  sortOrder: 'DESC' as const,
};

export function ContentProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, refetch } = useMediaAssets(MEDIA_LIST_QUERY, {
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const items = query.state.data?.items ?? [];
      // Only poll while backend is actively processing — not for interrupted uploads awaiting resume.
      const activelyProcessing = items.some(
        (asset) =>
          asset.status === 'PROCESSING' && !isInterruptedUploadAsset(asset.id, asset.status),
      );
      return activelyProcessing ? 5_000 : false;
    },
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 429) return false;
      return failureCount < 2;
    },
  });

  const items = useMemo(() => {
    const assets = data?.items ?? [];
    return assets
      .map(mapMediaAssetToContentItem)
      .filter((item): item is ContentItem => item !== null);
  }, [data]);

  const getVideosByCategory = useCallback(
    (categoryId: ContentCategoryId) =>
      items.filter((item) => item.categoryId === categoryId && isReadyVideo(item)),
    [items],
  );

  const getVideoCountByCategory = useCallback(
    (categoryId: ContentCategoryId) => getVideosByCategory(categoryId).length,
    [getVideosByCategory],
  );

  const getVideosForProgram = useCallback(
    (programId: PlaybackCategoryId | ContentCategoryId) => {
      const categoryIds = getManageableCategoryIds(programId);
      return items.filter(
        (item) => categoryIds.includes(item.categoryId) && isReadyVideo(item),
      );
    },
    [items],
  );

  const getVideoCountForProgram = useCallback(
    (programId: PlaybackCategoryId | ContentCategoryId) => getVideosForProgram(programId).length,
    [getVideosForProgram],
  );

  const value = useMemo(
    () => ({
      items,
      isLoading,
      isError,
      refetch: async () => {
        await refetch();
      },
      getVideosByCategory,
      getVideoCountByCategory,
      getVideosForProgram,
      getVideoCountForProgram,
    }),
    [
      items,
      isLoading,
      isError,
      refetch,
      getVideosByCategory,
      getVideoCountByCategory,
      getVideosForProgram,
      getVideoCountForProgram,
    ],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
}
