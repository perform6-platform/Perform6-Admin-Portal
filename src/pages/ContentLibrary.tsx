import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CategorySidebar } from '../components/content-library/CategorySidebar';
import { ContentCard, type CardUploadVisual } from '../components/content-library/ContentCard';
import { ContentLibraryToolbar } from '../components/content-library/ContentLibraryToolbar';
import { ContentVideoPlayerModal } from '../components/content-library/ContentVideoPlayerModal';
import { FloatingUploadProgress } from '../components/content-library/FloatingUploadProgress';
import {
  UploadContentModal,
  type UploadContentPayload,
} from '../components/content-library/UploadContentModal';
import { Button, Card, ConfirmModal, EmptyState, PageTitle } from '../components/ui';
import type { ContentCategoryId, ContentItem, ContentTypeFilter } from '../constants/contentLibrary';
import { useContent } from '../context/ContentContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { useDeleteMedia, useMediaAsset } from '../hooks/useMedia';
import { useSmoothUploadProgress } from '../hooks/useSmoothUploadProgress';
import {
  buildContentCategoryGroups,
  getCategoryLabelFromGroups,
} from '../lib/contentCategoryGroups';
import { resolveMediaUploadTarget } from '../lib/libraryType';
import { getApiErrorMessage } from '../services/axios';
import {
  clearPendingUploadSession,
  deleteMediaAsset,
  getMediaProcessingProgress,
  getPendingUploadSession,
  resumeStoredUpload,
  retryMediaProcessing,
  uploadMedia,
} from '../services/media.api';
import {
  cacheUploadFile,
  clearCachedUploadFile,
  isInterruptedUploadAsset,
  loadCachedUploadFile,
  pickVideoFile,
} from '../lib/uploadFileCache';
import {
  fileMatchesStoredSession,
  getUploadResumePercent,
} from '../lib/uploadSessionStorage';
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
  const [uploadSessionTick, setUploadSessionTick] = useState(0);
  const [playingItem, setPlayingItem] = useState<ContentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [processingAssetId, setProcessingAssetId] = useState<string | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [resumingAssetId, setResumingAssetId] = useState<string | null>(null);
  const [floatingUploadMeta, setFloatingUploadMeta] = useState<{
    title: string;
    subtitle?: string;
  } | null>(null);
  const finishingRef = useRef(false);
  const resumePromptShownRef = useRef(false);
  const resumeInFlightRef = useRef(false);

  useEffect(() => {
    if (resumePromptShownRef.current) return;
    const pending = getPendingUploadSession();
    if (!pending) return;
    resumePromptShownRef.current = true;
    const percent = getUploadResumePercent(pending);
    showToast({
      title: 'Upload can be resumed',
      message: `"${pending.title ?? pending.fileName}" was interrupted${percent > 0 ? ` at ${percent}%` : ''}. Click Resume upload on the card to continue.`,
      variant: 'info',
    });
  }, [showToast]);

  function refreshPendingUploadSession(): void {
    setUploadSessionTick((tick) => tick + 1);
  }

  async function handleDiscardPendingUpload(forAssetId?: string): Promise<void> {
    const pending = getPendingUploadSession();
    if (pending && (!forAssetId || pending.assetId === forAssetId)) {
      await clearCachedUploadFile(pending);
      clearPendingUploadSession();
      try {
        await deleteMediaAsset(pending.assetId);
      } catch {
        // Asset may already be deleted — still clear local session.
      }
    }
    refreshPendingUploadSession();
    setResumingAssetId(null);
    setFloatingUploadMeta(null);
    reset();
    await refetch();
    showToast({
      title: 'Upload discarded',
      message: 'The interrupted upload was removed. You can upload a new file.',
      variant: 'info',
    });
  }

  function resolveCardUploadVisual(item: ContentItem): {
    visual: CardUploadVisual;
    percent: number;
  } {
    const pending = getPendingUploadSession();
    const resumePercent = pending ? getUploadResumePercent(pending) : 0;

    if (resumingAssetId === item.id) {
      return { visual: 'resuming', percent: progress.percent || resumePercent };
    }
    if (processingAssetId === item.id && progress.phase === 'processing') {
      return { visual: 'processing', percent: progress.percent };
    }
    if (item.status === 'FAILED') {
      return { visual: 'failed', percent: 0 };
    }
    if (isInterruptedUploadAsset(item.id, item.status)) {
      return {
        visual: 'interrupted',
        percent: pending?.assetId === item.id ? resumePercent : 0,
      };
    }
    if (item.status === 'PROCESSING') {
      return { visual: 'processing', percent: 0 };
    }
    return { visual: 'ready', percent: 0 };
  }

  async function runResumeUpload(item: ContentItem): Promise<void> {
    if (resumeInFlightRef.current) return;

    const pending = getPendingUploadSession();
    if (!pending || pending.assetId !== item.id) {
      showToast({
        title: 'Nothing to resume',
        message: 'This upload session is no longer available.',
        variant: 'error',
      });
      return;
    }

    resumeInFlightRef.current = true;
    setUploadOpen(false);
    setResumingAssetId(item.id);
    setFloatingUploadMeta({
      title: pending.title ?? pending.fileName,
      subtitle: `Resuming from ${getUploadResumePercent(pending)}%`,
    });

    finishingRef.current = false;
    start();
    setHttpUploadPercent(getUploadResumePercent(pending));

    try {
      let file =
        (await loadCachedUploadFile(pending)) ??
        (await pickVideoFile(pending.fileName));

      if (!file) {
        fail('Upload cancelled');
        setResumingAssetId(null);
        setFloatingUploadMeta(null);
        return;
      }

      if (!fileMatchesStoredSession(file, pending)) {
        throw new Error(
          `Please select the same file: "${pending.fileName}"`,
        );
      }

      const result = await resumeStoredUpload(file, (percent) => {
        setHttpUploadPercent(percent);
      });

      setHttpUploadPercent(100);
      markUploadReceived();
      await clearCachedUploadFile(pending);

      setProcessingAssetId(result.asset.id);
      if (result.processingJobId) {
        setProcessingJobId(result.processingJobId);
      }
      refreshPendingUploadSession();
      await refetch();

      if (result.asset.status === 'READY') {
        finishingRef.current = true;
        setProcessingJobPercent(100);
        complete();
        await waitUntilDone();
        setProcessingAssetId(null);
        setProcessingJobId(null);
        showToast({
          title: 'Video uploaded',
          message: `"${result.asset.title}" is ready in the library.`,
          variant: 'success',
        });
        finishingRef.current = false;
      }
    } catch (error) {
      fail(getApiErrorMessage(error, 'Resume failed'));
      setProcessingAssetId(null);
      setProcessingJobId(null);
      refreshPendingUploadSession();
      showToast({
        title: getApiErrorMessage(error, 'Could not resume upload'),
        variant: 'error',
      });
    } finally {
      resumeInFlightRef.current = false;
      setResumingAssetId(null);
    }
  }

  function handleResumeUpload(item: ContentItem): void {
    void runResumeUpload(item);
  }

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
      if (!processingAssetId) return false;
      if (isInterruptedUploadAsset(processingAssetId, query.state.data?.status)) {
        return false;
      }
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
    if (!floatingUploadMeta) return;
    if (progress.phase === 'done') {
      const timer = window.setTimeout(() => {
        setFloatingUploadMeta(null);
        reset();
      }, 2_500);
      return () => window.clearTimeout(timer);
    }
    if (progress.phase === 'error') {
      const timer = window.setTimeout(() => {
        setFloatingUploadMeta(null);
        reset();
      }, 5_000);
      return () => window.clearTimeout(timer);
    }
  }, [floatingUploadMeta, progress.phase, reset]);

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

  async function handleRetryProcessing(item: ContentItem) {
    try {
      finishingRef.current = false;
      start();
      markUploadReceived();
      setFloatingUploadMeta({
        title: item.title,
        subtitle: 'Retrying video processing…',
      });
      setProcessingAssetId(item.id);
      setSelectedId(item.id);

      const result = await retryMediaProcessing(item.id);

      if (result.processingJobId) {
        setProcessingJobId(result.processingJobId);
      }

      queryClient.setQueriesData(
        { queryKey: queryKeys.media.all },
        (current: MediaListResult | undefined) => {
          if (!current?.items) return current;
          return {
            ...current,
            items: current.items.map((asset) =>
              asset.id === result.asset.id
                ? { ...asset, ...result.asset, status: 'PROCESSING' as const }
                : asset,
            ),
          };
        },
      );

      await refetch();
      showToast({
        title: 'Processing restarted',
        message: `"${item.title}" is being processed again.`,
        variant: 'success',
      });
    } catch (error) {
      fail('Retry failed');
      setProcessingAssetId(null);
      setProcessingJobId(null);
      setFloatingUploadMeta(null);
      showToast({
        title: getApiErrorMessage(error, 'Could not retry processing'),
        variant: 'error',
      });
    }
  }

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
      await cacheUploadFile(payload.file);
      const durationSeconds = await readVideoDurationSeconds(payload.file);
      const uploadTarget = resolveMediaUploadTarget(payload.categoryId);
      const pending = getPendingUploadSession();
      const shouldResume =
        pending && fileMatchesStoredSession(payload.file, pending);

      if (pending && !shouldResume) {
        throw new Error(
          `Selected file does not match "${pending.fileName}". Discard the interrupted upload on the card first, or choose the same file to resume.`,
        );
      }

      const result = shouldResume
        ? await resumeStoredUpload(payload.file, (percent) => {
            setHttpUploadPercent(percent);
          })
        : await uploadMedia({
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
      await clearCachedUploadFile({
        fileName: payload.file.name,
        fileSize: payload.file.size,
        fileLastModified: payload.file.lastModified,
      });

      setActiveCategory(payload.categoryId);
      setActiveTab('all');
      setSelectedId(result.asset.id);
      setProcessingAssetId(result.asset.id);
      if (result.processingJobId) {
        setProcessingJobId(result.processingJobId);
      }
      refetch();
      refreshPendingUploadSession();

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

      setUploadOpen(false);
    } catch (error) {
      fail('Upload failed');
      setProcessingAssetId(null);
      setProcessingJobId(null);
      refreshPendingUploadSession();
      setUploadOpen(false);
      showToast({
        title: getApiErrorMessage(error, 'Failed to upload video'),
        message: 'Use Resume upload on the card to continue from where you left off.',
        variant: 'error',
      });
      throw error;
    }
  }

  function handleCloseUpload() {
    if (progress.phase === 'uploading' || progress.phase === 'processing') return;
    setUploadOpen(false);
    if (progress.phase === 'error') {
      reset();
    }
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

  void uploadSessionTick;

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
                  {filteredItems.map((item) => {
                    const { visual, percent } = resolveCardUploadVisual(item);
                    return (
                    <ContentCard
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      onSelect={setSelectedId}
                      onPlay={setPlayingItem}
                      onDelete={setItemToDelete}
                      onRetryProcessing={handleRetryProcessing}
                      onResumeUpload={handleResumeUpload}
                      onDiscardUpload={(cardItem) => void handleDiscardPendingUpload(cardItem.id)}
                      uploadVisual={visual}
                      uploadPercent={percent}
                    />
                    );
                  })}
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

      <FloatingUploadProgress
        open={Boolean(floatingUploadMeta || resumingAssetId)}
        state={progress}
        title={floatingUploadMeta?.title}
        subtitle={floatingUploadMeta?.subtitle}
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
