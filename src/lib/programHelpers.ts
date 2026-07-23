import type { ContentCategoryId } from '../constants/contentLibrary';
import {
  contentCategoryGroups,
  getCategoryLabel,
  getPlaybackCategoryForContent,
  getPlaybackRule,
  playbackRules,
  type PlaybackCategoryId,
} from '../constants/contentPlayback';
import { contentCategories } from '../constants/contentLibrary';
import { mockProgramList, programPhaseCards } from '../constants/programs';

export function isContentCategoryId(value: string): value is ContentCategoryId {
  return contentCategories.some((category) => category.id === value);
}

export function isPlaybackCategoryId(value: string): value is PlaybackCategoryId {
  return playbackRules.some((rule) => rule.categoryId === value);
}

export function getProgramDisplayName(programId: string): string {
  const fromList = mockProgramList.find((program) => program.id === programId);
  if (fromList) return fromList.name;

  const fromCard = programPhaseCards.find((program) => program.id === programId);
  if (fromCard) {
    return fromCard.title
      .split(' ')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  if (isContentCategoryId(programId)) {
    const group = contentCategoryGroups.find((entry) =>
      entry.children.some((child) => child.id === programId),
    );
    if (group) {
      return `${group.label} — ${getCategoryLabel(programId)}`;
    }
  }

  return programId;
}

export function getManageableCategoryIds(programId: string): ContentCategoryId[] {
  if (isContentCategoryId(programId)) {
    return [programId];
  }

  if (!isPlaybackCategoryId(programId)) {
    return [];
  }

  const group = contentCategoryGroups.find((entry) => entry.playbackCategory === programId);
  return group?.children.map((child) => child.id) ?? [];
}

export function getPlaybackRuleForProgram(programId: string) {
  if (isPlaybackCategoryId(programId)) {
    return getPlaybackRule(programId);
  }

  if (isContentCategoryId(programId)) {
    return getPlaybackRule(getPlaybackCategoryForContent(programId));
  }

  return getPlaybackRule('default');
}
