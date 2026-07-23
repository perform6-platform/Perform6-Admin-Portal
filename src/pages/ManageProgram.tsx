import { useMemo, useState } from 'react';
import { ArrowLeft, Clock, Pause, Repeat, Upload } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ContentCard } from '../components/content-library/ContentCard';
import { ContentVideoPlayerModal } from '../components/content-library/ContentVideoPlayerModal';
import { Button, EmptyState, PageTitle, SectionLabel } from '../components/ui';
import { CARD_SURFACE_CLASS } from '../components/ui/cardStyles';
import type { ContentCategoryId, ContentItem } from '../constants/contentLibrary';
import { contentCategoryGroups } from '../constants/contentPlayback';
import { useContent } from '../context/ContentContext';
import { cn } from '../lib/cn';
import {
  getManageableCategoryIds,
  getPlaybackRuleForProgram,
  getProgramDisplayName,
  isContentCategoryId,
  isPlaybackCategoryId,
} from '../lib/programHelpers';

export default function ManageProgram() {
  const { programId = '' } = useParams();
  const navigate = useNavigate();
  const { getVideosByCategory, getVideosForProgram } = useContent();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingItem, setPlayingItem] = useState<ContentItem | null>(null);

  const isValid = isPlaybackCategoryId(programId) || isContentCategoryId(programId);
  const manageableIds = isValid ? getManageableCategoryIds(programId) : [];
  const phase1Group = contentCategoryGroups.find((group) => group.playbackCategory === 'phase-1');
  const isPhase1Parent = programId === 'phase-1';

  const [activeSubCategory, setActiveSubCategory] = useState<ContentCategoryId>(
    manageableIds[0] ?? 'phase-1-fitness-wall',
  );

  const activeCategoryId = isPhase1Parent ? activeSubCategory : manageableIds[0];
  const videos = useMemo(() => {
    if (!isValid) return [];
    if (isPhase1Parent) {
      return getVideosByCategory(activeSubCategory);
    }
    if (isContentCategoryId(programId)) {
      return getVideosByCategory(programId);
    }
    return getVideosForProgram(programId);
  }, [activeSubCategory, getVideosByCategory, getVideosForProgram, isPhase1Parent, isValid, programId]);

  const programName = isValid ? getProgramDisplayName(programId) : '';
  const playbackRule = isValid ? getPlaybackRuleForProgram(programId) : null;
  const videoLabel = videos.length === 1 ? '1 Video' : `${videos.length} Videos`;

  if (!isValid) {
    return <Navigate to="/programs" replace />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            to="/programs"
            className="inline-flex items-center gap-1.5 text-body-sm text-content-secondary transition-colors hover:text-brand-600 dark:hover:text-brand-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Programs
          </Link>
          <PageTitle>Manage {programName}</PageTitle>
          <p className="text-body-sm text-content-secondary">
            Videos uploaded in Content Library for this category appear here automatically.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-full shrink-0 gap-2 px-4 sm:w-auto"
          onClick={() =>
            navigate('/content-library', {
              state: { categoryId: activeCategoryId ?? manageableIds[0] },
            })
          }
        >
          <Upload className="h-4 w-4" />
          Add from Content Library
        </Button>
      </div>

      {playbackRule && (
        <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-5')}>
          <SectionLabel className="mb-2 block">Playback Behavior</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {playbackRule.loops ? (
              <RuleBadge icon={Repeat} label="Loops continuously" />
            ) : (
              <RuleBadge icon={Repeat} label="Plays once, then returns to Default" />
            )}
            {playbackRule.timeoutMinutes && (
              <RuleBadge icon={Clock} label={`${playbackRule.timeoutMinutes} min inactivity timeout`} />
            )}
            {playbackRule.supportsPause && <RuleBadge icon={Pause} label="Pause enabled on touchscreen" />}
          </div>
          <p className="mt-2 text-body-sm text-content-secondary">{playbackRule.behavior}</p>
        </section>
      )}

      {isPhase1Parent && phase1Group && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 hide-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
          {phase1Group.children.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveSubCategory(category.id)}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-1.5 text-body-sm font-medium transition-colors',
                activeSubCategory === category.id
                  ? 'border-brand-500/40 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'border-surface-border bg-surface-muted text-content-secondary hover:text-content-primary',
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-5')}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <SectionLabel className="block">Program Videos</SectionLabel>
          <span className="text-body-sm font-medium text-content-secondary">{videoLabel}</span>
        </div>

        {videos.length === 0 ? (
          <EmptyState message="No videos yet. Upload videos in Content Library and assign them to this category." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {videos.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={setSelectedId}
                onPlay={setPlayingItem}
              />
            ))}
          </div>
        )}
      </section>

      <ContentVideoPlayerModal
        open={playingItem !== null}
        item={playingItem}
        onClose={() => setPlayingItem(null)}
      />
    </div>
  );
}

function RuleBadge({ icon: Icon, label }: { icon: typeof Repeat; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-caption font-medium text-content-secondary">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
