import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CategorySidebar } from '../components/content-library/CategorySidebar';
import { ContentCard } from '../components/content-library/ContentCard';
import { ContentLibraryToolbar } from '../components/content-library/ContentLibraryToolbar';
import { ContentVideoPlayerModal } from '../components/content-library/ContentVideoPlayerModal';
import {
  UploadContentModal,
  type UploadContentPayload,
} from '../components/content-library/UploadContentModal';
import { Button, Card, ConfirmModal, EmptyState, PageTitle } from '../components/ui';
import type { ContentCategoryId, ContentItem, ContentTypeFilter } from '../constants/contentLibrary';
import { useContent } from '../context/ContentContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { useDeleteMedia, useMediaAsset, useUploadMedia } from '../hooks/useMedia';
import { useSmoothUploadProgress } from '../hooks/useSmoothUploadProgress';
import {
  buildContentCategoryGroups,
  getCategoryLabelFromGroups,
} from '../lib/contentCategoryGroups';
import { resolveMediaUploadTarget } from '../lib/libraryType';
import { getApiErrorMessage } from '../services/axios';
import { getMediaProcessingProgress } from '../services/media.api';
import { useQueryClient } from '@tanstack/react-query';
import type { MediaListResult } from '../types/media';
import { queryKeys } from '../lib/queryKeys';

function readVideoDurationSeconds(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : undefined;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}

export default function ContentLibrary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, isLoading, isError, refetch } = useContent();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: apiCategories = [] } = useCategories();
  const categoryGroups = useMemo(
    () => buildContentCategoryGroups(apiCategories),
    [apiCategories],
  );
  const { mutate: deleteMedia, isPending: isDeleting } = useDeleteMedia();
  const { mutateAsync: uploadMedia } = useUploadMedia();
  const {
    progress,
    start,
    setHttpUploadPercent,
    markUploadReceived,
    setProcessingJobPercent,
    complete,
    waitUntilDone,
    fail,
    reset,
  } = useSmoothUploadProgress();

  const [activeTab, setActiveTab] = useState<ContentTypeFilter>('all');
  const [activeCategory, setActiveCategory] = useState<ContentCategoryId>('default-fitness');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playingItem, setPlayingItem] = useState<ContentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [processingAssetId, setProcessingAssetId] = useState<string | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const finishingRef = useRef(false);

  useEffect(() => {
    const allIds = categoryGroups.flatMap((group) => group.children.map((c) => c.id));
    if (allIds.length === 0) return;
    if (!allIds.includes(activeCategory)) {
      setActiveCategory(allIds[0]!);
    }
  }, [categoryGroups, activeCategory]);

  const processingQuery = useMediaAsset(processingAssetId, {
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const status = query.state.data?.status;
      return status === 'PROCESSING' ? 3_000 : false;
    },
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 429) return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    const state = location.state as { openUpload?: boolean; categoryId?: ContentCategoryId } | null;
    if (state?.categoryId) {
      setActiveCategory(state.categoryId);
    }
    if (state?.openUpload) {
      setUploadOpen(true);
    }
    if (state?.openUpload || state?.categoryId) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // Poll BullMQ job progress for gradual 55→99% while processing.
  useEffect(() => {
    if (!processingJobId || progress.phase !== 'processing') return;

    let cancelled = false;

    const poll = async () => {
      try {
        const result = await getMediaProcessingProgress(processingJobId);
        if (cancelled) return;
        setProcessingJobPercent(result.progress);
        if (result.state === 'completed') {
          setProcessingJobPercent(100);
        }
        if (result.state === 'failed') {
          fail('Processing failed');
          setProcessingJobId(null);
          setProcessingAssetId(null);
        }
      } catch {
        // Keep animating via asset status poll if job endpoint briefly fails.
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 2_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    processingJobId,
    progress.phase,
    setProcessingJobPercent,
    fail,
  ]);

  useEffect(() => {
    if (!processingAssetId || !processingQuery.data || finishingRef.current) return;

    const status = processingQuery.data.status;
    if (status === 'READY') {
      finishingRef.current = true;
      const readyAsset = processingQuery.data;
      setProcessingJobPercent(100);
      complete();

      // Immediately patch library cache so the real thumbnail shows without a manual refresh.
      queryClient.setQueriesData(
        { queryKey: queryKeys.media.all },
        (current: MediaListResult | undefined) => {
          if (!current?.items) return current;
          return {
            ...current,
            items: current.items.map((asset) =>
              asset.id === readyAsset.id ? { ...asset, ...readyAsset } : asset,
            ),
          };
        },
      );

      void (async () => {
        await waitUntilDone();
        setProcessingAssetId(null);
        setProcessingJobId(null);
        await queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
        await refetch();
        showToast({
          title: 'Video uploaded',
          message: `"${readyAsset.title}" is ready in the library.`,
          variant: 'success',
        });
        finishingRef.current = false;
      })();
      return;
    }

    if (status === 'FAILED') {
      fail('Processing failed');
      setProcessingAssetId(null);
      setProcessingJobId(null);
      refetch();
      showToast({
        title: 'Processing failed',
        message: `"${processingQuery.data.title}" could not be processed for BrightSign.`,
        variant: 'error',
      });
    }
  }, [
    processingAssetId,
    processingQuery.data,
    complete,
    fail,
    setProcessingJobPercent,
    waitUntilDone,
    refetch,
    showToast,
    queryClient,
  ]);

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => item.categoryId === activeCategory);

    if (activeTab !== 'all') {
      const typeMap: Record<Exclude<ContentTypeFilter, 'all'>, string> = {
        videos: 'video',
      };
      result = result.filter((item) => item.mediaType === typeMap[activeTab]);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((item) => item.categoryId === categoryFilter);
    }

    return result;
  }, [items, activeTab, activeCategory, categoryFilter]);

  async function handleUpload(payload: UploadContentPayload) {
    finishingRef.current = false;
    start();
    try {
      const durationSeconds = await readVideoDurationSeconds(payload.file);
      const uploadTarget = resolveMediaUploadTarget(payload.categoryId);
      const result = await uploadMedia({
        file: payload.file,
        title: payload.title.trim() || payload.file.name,
        ...uploadTarget,
        thumbnail: payload.thumbnail,
        mediaType: 'VIDEO',
        durationSeconds,
        onUploadProgress: (percent) => {
          setHttpUploadPercent(percent);
        },
      });

      // Ensure transfer portion finishes smoothly even if browser skipped events.
      setHttpUploadPercent(100);
      markUploadReceived();

      setActiveCategory(payload.categoryId);
      setActiveTab('all');
      setSelectedId(result.asset.id);
      setProcessingAssetId(result.asset.id);
      if (result.processingJobId) {
        setProcessingJobId(result.processingJobId);
      }
      refetch();

      if (result.asset.status === 'READY') {
        finishingRef.current = true;
        setProcessingJobPercent(100);
        complete();
        await waitUntilDone();
        setProcessingAssetId(null);
        setProcessingJobId(null);
        showToast({
          title: 'Video uploaded',
          message: `"${result.asset.title}" is ready in ${getCategoryLabelFromGroups(categoryGroups, payload.categoryId)}.`,
          variant: 'success',
        });
        finishingRef.current = false;
      }
    } catch (error) {
      fail('Upload failed');
      setProcessingAssetId(null);
      setProcessingJobId(null);
      showToast({
        title: getApiErrorMessage(error, 'Failed to upload video'),
        variant: 'error',
      });
      throw error;
    }
  }

  function handleCloseUpload() {
    if (progress.phase === 'uploading' || progress.phase === 'processing') return;
    setUploadOpen(false);
    reset();
    setProcessingAssetId(null);
    setProcessingJobId(null);
    finishingRef.current = false;
  }

  function handleDeleteConfirm() {
    if (!itemToDelete) return;

    deleteMedia(itemToDelete.id, {
      onSuccess: (result) => {
        if (selectedId === itemToDelete.id) {
          setSelectedId(null);
        }
        if (playingItem?.id === itemToDelete.id) {
          setPlayingItem(null);
        }
        refetch();
        showToast({
          title: result.message || 'Video deleted',
          message: `"${itemToDelete.title}" has been removed from the library.`,
          variant: 'success',
        });
        setItemToDelete(null);
      },
      onError: (error) => {
        showToast({
          title: getApiErrorMessage(error, 'Failed to delete video'),
          variant: 'error',
        });
      },
    });
  }

  const isBusy =
    progress.phase === 'uploading' || progress.phase === 'processing';

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageTitle>Content Library</PageTitle>
          <Button
            size="sm"
            className="h-9 w-full shrink-0 gap-2 whitespace-nowrap px-4 sm:w-auto"
            onClick={() => {
              reset();
              setProcessingAssetId(null);
              setProcessingJobId(null);
              finishingRef.current = false;
              setUploadOpen(true);
            }}
            disabled={isBusy}
          >
            <Upload className="h-4 w-4" />
            Upload video
          </Button>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="p-4 sm:p-6">
            <ContentLibraryToolbar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          </div>

          <div className="flex flex-col gap-6 border-t border-surface-border p-4 sm:p-6 lg:flex-row lg:gap-8">
            <div className="shrink-0 lg:border-r lg:border-surface-border lg:pr-6">
              <CategorySidebar
                groups={categoryGroups}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>

            <div className="min-w-0 flex-1">
              {isError ? (
                <EmptyState message="Failed to load media library. Try refreshing." />
              ) : isLoading ? (
                <EmptyState message="Loading content..." />
              ) : filteredItems.length === 0 ? (
                <EmptyState message="No content found for the selected category." />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {filteredItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      onSelect={setSelectedId}
                      onPlay={setPlayingItem}
                      onDelete={setItemToDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <UploadContentModal
        open={uploadOpen}
        defaultCategoryId={activeCategory}
        onClose={handleCloseUpload}
        onSubmit={handleUpload}
        progress={progress}
      />

      <ContentVideoPlayerModal
        open={playingItem !== null}
        item={playingItem}
        onClose={() => setPlayingItem(null)}
      />

      <ConfirmModal
        open={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete video?"
        description={
          itemToDelete
            ? `Are you sure you want to delete "${itemToDelete.title}"? This will remove the video and thumbnail from storage.`
            : undefined
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        tone="danger"
      />
    </>
  );
}
