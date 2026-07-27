import { Clock, Pause, RefreshCw, Repeat } from 'lucide-react';
import {
  INACTIVITY_TIMEOUT_MINUTES,
  playbackRules,
  ROTATION_DAYS,
} from '../../constants/contentPlayback';
import { cn } from '../../lib/cn';
import { CARD_SURFACE_CLASS, SectionLabel } from '../ui';

export function PlaybackOverview() {
  return (
    <section className={cn(CARD_SURFACE_CLASS, 'p-4 sm:p-6')}>
      <SectionLabel className="mb-1 block">Content Playback &amp; Rotation</SectionLabel>
      <p className="mb-4 text-body-sm text-content-secondary">
        Touchscreen flow: user selects a category → assigned video plays per rules below → system
        returns to <strong className="font-medium text-content-primary">Default (idle)</strong>.
        Phase 1, Phase 2, and Full Program use a{' '}
        <strong className="font-medium text-content-primary">{ROTATION_DAYS}-day</strong> sequential
        loop (Day {ROTATION_DAYS} → Day 1).
      </p>

      <div className="space-y-4 md:hidden">
        {playbackRules.map((rule) => (
          <article
            key={rule.categoryId}
            className="rounded-lg border border-surface-border bg-surface-muted/20 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-content-primary">{rule.label}</h3>
              <span className="text-caption text-content-secondary">{rule.approxDuration}</span>
            </div>
            <p className="mt-1 text-caption text-content-muted">{rule.options}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {rule.loops ? (
                <PlaybackBadge icon={Repeat} label="Loops" tone="brand" />
              ) : (
                <PlaybackBadge icon={RefreshCw} label="Play once" tone="warning" />
              )}
              {rule.timeoutMinutes && (
                <PlaybackBadge icon={Clock} label={`${rule.timeoutMinutes} min timeout`} tone="neutral" />
              )}
              {rule.supportsPause && <PlaybackBadge icon={Pause} label="Pause" tone="success" />}
              {rule.usesRotation && (
                <PlaybackBadge icon={RefreshCw} label={`${ROTATION_DAYS}-day rotation`} tone="purple" />
              )}
            </div>
            <p className="mt-2 text-body-sm text-content-secondary">{rule.behavior}</p>
          </article>
        ))}
      </div>

      <div className="hidden md:block">
        <p className="scroll-hint mb-2 text-caption text-content-muted lg:hidden">
          Swipe horizontally on smaller tablets to view all columns →
        </p>
        <div className="table-scroll-x overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-body-sm lg:min-w-[720px]">
            <thead>
              <tr className="border-b border-surface-border bg-surface">
                <th className="px-4 py-2 text-table-header font-semibold uppercase text-content-muted">
                  Category
                </th>
                <th className="px-4 py-2 text-table-header font-semibold uppercase text-content-muted">
                  Options
                </th>
                <th className="px-4 py-2 text-table-header font-semibold uppercase text-content-muted">
                  Playback
                </th>
                <th className="px-4 py-2 text-table-header font-semibold uppercase text-content-muted">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {playbackRules.map((rule, index) => (
                <tr
                  key={rule.categoryId}
                  className={cn(
                    'border-b border-surface-border last:border-b-0 transition-colors',
                    index % 2 === 1
                      ? 'bg-surface-muted hover:bg-[#F2F7FF]'
                      : 'bg-surface hover:bg-[#F2F7FF]',
                  )}
                >
                  <td className="px-4 py-4 font-semibold text-content-primary">{rule.label}</td>
                  <td className="px-4 py-4 text-content-secondary">{rule.options}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {rule.loops ? (
                        <PlaybackBadge icon={Repeat} label="Loops" tone="brand" />
                      ) : (
                        <PlaybackBadge icon={RefreshCw} label="Play once" tone="warning" />
                      )}
                      {rule.timeoutMinutes && (
                        <PlaybackBadge
                          icon={Clock}
                          label={`${rule.timeoutMinutes} min timeout`}
                          tone="neutral"
                        />
                      )}
                      {rule.supportsPause && (
                        <PlaybackBadge icon={Pause} label="Pause" tone="success" />
                      )}
                      {rule.usesRotation && (
                        <PlaybackBadge
                          icon={RefreshCw}
                          label={`${ROTATION_DAYS}-day rotation`}
                          tone="purple"
                        />
                      )}
                    </div>
                    <p className="mt-2 text-caption text-content-muted">{rule.behavior}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-content-secondary">
                    {rule.approxDuration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-caption text-content-muted">
        Inactivity timeout: {INACTIVITY_TIMEOUT_MINUTES} minutes for Start Here, Phase 1, and Phase 2
        before returning to Default.
      </p>
    </section>
  );
}

function PlaybackBadge({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Repeat;
  label: string;
  tone: 'brand' | 'warning' | 'neutral' | 'success' | 'purple';
}) {
  const toneClass = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
    warning: 'bg-[rgba(255,159,67,0.12)] text-status-warning',
    neutral: 'bg-surface-muted text-content-secondary',
    success: 'bg-[rgba(40,199,111,0.12)] text-status-success',
    purple: 'bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        toneClass,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
