import { Play } from 'lucide-react';
import type { ProgramAccent, ProgramPhaseCard } from '../../constants/programs';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';

type AccentStyle = {
  title: string;
  border: string;
  icon: string;
  cardBackground: string;
  buttonGradient: string;
  buttonBorder: string;
  buttonShadow: string;
  imageOverlay: string;
  imageBrightness: string;
};

const darkAccentStyles: Record<ProgramAccent, AccentStyle> = {
  slate: {
    title: '#9CA3AF',
    border: 'rgba(156, 163, 175, 0.45)',
    icon: '#9CA3AF',
    cardBackground:
      'linear-gradient(180deg, rgba(156, 163, 175, 0.1) 0%, rgba(30, 34, 41, 0.98) 38%, rgba(30, 34, 41, 1) 100%)',
    buttonGradient:
      'linear-gradient(135deg, #1E2229 0%, #2F3136 30%, #4B5563 58%, #6B7280 82%, #9CA3AF 100%)',
    buttonBorder: 'rgba(156, 163, 175, 0.4)',
    buttonShadow: '0 4px 14px rgba(75, 85, 99, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.75), rgba(30,34,41,0.25), rgba(30,34,41,0.1))',
    imageBrightness: 'brightness-[0.72] contrast-[1.08] saturate-[0.85]',
  },
  cyan: {
    title: '#447FE6',
    border: 'rgba(68, 127, 230, 0.55)',
    icon: '#447FE6',
    cardBackground:
      'linear-gradient(180deg, rgba(68, 127, 230, 0.12) 0%, rgba(30, 34, 41, 0.98) 38%, rgba(30, 34, 41, 1) 100%)',
    buttonGradient:
      'linear-gradient(135deg, #0A3A8C 0%, #1155CC 40%, #447FE6 78%, #A3C4F7 100%)',
    buttonBorder: 'rgba(68, 127, 230, 0.5)',
    buttonShadow: '0 4px 14px rgba(17, 85, 204, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.75), rgba(30,34,41,0.25), rgba(30,34,41,0.1))',
    imageBrightness: 'brightness-[0.72] contrast-[1.08] saturate-[0.85]',
  },
  teal: {
    title: '#EAF8EE',
    border: 'rgba(42, 98, 64, 0.55)',
    icon: '#EAF8EE',
    cardBackground:
      'linear-gradient(180deg, rgba(42, 98, 64, 0.16) 0%, rgba(30, 34, 41, 0.98) 38%, rgba(30, 34, 41, 1) 100%)',
    buttonGradient:
      'linear-gradient(135deg, #1A3D28 0%, #2A6240 45%, #3A7A52 78%, #EAF8EE 100%)',
    buttonBorder: 'rgba(42, 98, 64, 0.5)',
    buttonShadow: '0 4px 14px rgba(42, 98, 64, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.75), rgba(30,34,41,0.25), rgba(30,34,41,0.1))',
    imageBrightness: 'brightness-[0.72] contrast-[1.08] saturate-[0.85]',
  },
  purple: {
    title: '#A3C4F7',
    border: 'rgba(17, 85, 204, 0.5)',
    icon: '#A3C4F7',
    cardBackground:
      'linear-gradient(180deg, rgba(10, 58, 140, 0.22) 0%, rgba(30, 34, 41, 0.98) 38%, rgba(30, 34, 41, 1) 100%)',
    buttonGradient:
      'linear-gradient(135deg, #082E70 0%, #0A3A8C 35%, #1155CC 70%, #447FE6 100%)',
    buttonBorder: 'rgba(17, 85, 204, 0.45)',
    buttonShadow: '0 4px 14px rgba(10, 58, 140, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.75), rgba(30,34,41,0.25), rgba(30,34,41,0.1))',
    imageBrightness: 'brightness-[0.72] contrast-[1.08] saturate-[0.85]',
  },
  gold: {
    title: '#FF9F43',
    border: 'rgba(255, 159, 67, 0.5)',
    icon: '#FF9F43',
    cardBackground:
      'linear-gradient(180deg, rgba(255, 159, 67, 0.12) 0%, rgba(30, 34, 41, 0.98) 38%, rgba(30, 34, 41, 1) 100%)',
    buttonGradient:
      'linear-gradient(135deg, #8A4F15 0%, #C77828 40%, #FF9F43 78%, #FFC078 100%)',
    buttonBorder: 'rgba(255, 159, 67, 0.45)',
    buttonShadow: '0 4px 14px rgba(255, 159, 67, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.75), rgba(30,34,41,0.25), rgba(30,34,41,0.1))',
    imageBrightness: 'brightness-[0.72] contrast-[1.08] saturate-[0.85]',
  },
};

const lightAccentStyles: Record<ProgramAccent, AccentStyle> = {
  slate: {
    title: '#4B5563',
    border: 'rgba(75, 85, 99, 0.35)',
    icon: '#4B5563',
    cardBackground:
      'linear-gradient(180deg, rgba(217, 222, 232, 0.45) 0%, rgba(244, 246, 250, 0.95) 28%, #ffffff 100%)',
    buttonGradient:
      'linear-gradient(135deg, #2F3136 0%, #4B5563 45%, #6B7280 78%, #9CA3AF 100%)',
    buttonBorder: 'rgba(75, 85, 99, 0.3)',
    buttonShadow: '0 4px 12px rgba(75, 85, 99, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.35), rgba(30,34,41,0.08), transparent)',
    imageBrightness: 'brightness-[0.94] contrast-[1.02] saturate-[0.95]',
  },
  cyan: {
    title: '#1155CC',
    border: 'rgba(17, 85, 204, 0.4)',
    icon: '#1155CC',
    cardBackground:
      'linear-gradient(180deg, rgba(234, 242, 255, 0.95) 0%, rgba(234, 242, 255, 0.55) 28%, #ffffff 100%)',
    buttonGradient:
      'linear-gradient(135deg, #0A3A8C 0%, #1155CC 45%, #447FE6 78%, #A3C4F7 100%)',
    buttonBorder: 'rgba(17, 85, 204, 0.35)',
    buttonShadow: '0 4px 12px rgba(17, 85, 204, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.35), rgba(30,34,41,0.08), transparent)',
    imageBrightness: 'brightness-[0.94] contrast-[1.02] saturate-[0.95]',
  },
  teal: {
    title: '#2A6240',
    border: 'rgba(42, 98, 64, 0.4)',
    icon: '#2A6240',
    cardBackground:
      'linear-gradient(180deg, rgba(234, 248, 238, 0.95) 0%, rgba(234, 248, 238, 0.55) 28%, #ffffff 100%)',
    buttonGradient:
      'linear-gradient(135deg, #1A3D28 0%, #2A6240 45%, #3A7A52 78%, #6FA882 100%)',
    buttonBorder: 'rgba(42, 98, 64, 0.32)',
    buttonShadow: '0 4px 12px rgba(42, 98, 64, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.35), rgba(30,34,41,0.08), transparent)',
    imageBrightness: 'brightness-[0.94] contrast-[1.02] saturate-[0.95]',
  },
  purple: {
    title: '#0A3A8C',
    border: 'rgba(10, 58, 140, 0.4)',
    icon: '#0A3A8C',
    cardBackground:
      'linear-gradient(180deg, rgba(163, 196, 247, 0.35) 0%, rgba(234, 242, 255, 0.7) 28%, #ffffff 100%)',
    buttonGradient:
      'linear-gradient(135deg, #0A3A8C 0%, #1155CC 42%, #447FE6 72%, #A3C4F7 100%)',
    buttonBorder: 'rgba(10, 58, 140, 0.32)',
    buttonShadow: '0 4px 12px rgba(10, 58, 140, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.35), rgba(30,34,41,0.08), transparent)',
    imageBrightness: 'brightness-[0.94] contrast-[1.02] saturate-[0.95]',
  },
  gold: {
    title: '#C77828',
    border: 'rgba(255, 159, 67, 0.4)',
    icon: '#C77828',
    cardBackground:
      'linear-gradient(180deg, rgba(255, 159, 67, 0.18) 0%, rgba(255, 248, 240, 0.95) 28%, #ffffff 100%)',
    buttonGradient:
      'linear-gradient(135deg, #C77828 0%, #FF9F43 42%, #FFB56B 72%, #FFC078 100%)',
    buttonBorder: 'rgba(255, 159, 67, 0.32)',
    buttonShadow: '0 4px 12px rgba(255, 159, 67, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
    imageOverlay: 'linear-gradient(to top, rgba(30,34,41,0.35), rgba(30,34,41,0.08), transparent)',
    imageBrightness: 'brightness-[0.94] contrast-[1.02] saturate-[0.95]',
  },
};

export interface ProgramPhaseCardProps {
  program: ProgramPhaseCard;
  onManage?: (route: string) => void;
}

export function ProgramPhaseCardView({ program, onManage }: ProgramPhaseCardProps) {
  const { isDark } = useTheme();
  const accent = isDark ? darkAccentStyles[program.accent] : lightAccentStyles[program.accent];
  const videoLabel = program.videoCount === 1 ? '1 Video' : `${program.videoCount} Videos`;

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl',
        isDark ? 'shadow-card' : 'shadow-[0_2px_12px_rgba(30,34,41,0.08)]',
      )}
      style={{
        border: `1px solid ${accent.border}`,
        background: accent.cardBackground,
        borderRadius: '12px',
      }}
    >
      <div className="p-4">
        <h3
          className="text-section-label font-semibold uppercase tracking-[0.08em]"
          style={{ color: accent.title }}
        >
          {program.title}
        </h3>

        <div
          className={cn(
            'relative mt-4 overflow-hidden rounded-lg border',
            isDark ? 'border-white/5' : 'border-surface-border',
          )}
        >
          <div className={cn('aspect-[16/10] w-full', isDark ? 'bg-black/40' : 'bg-surface-muted')}>
            <img
              src={program.thumbnailUrl}
              alt={program.title}
              className={cn('h-full w-full object-cover', accent.imageBrightness)}
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0" style={{ background: accent.imageOverlay }} />
        </div>

        <p
          className={cn(
            'mt-4 text-body-sm leading-relaxed',
            isDark ? 'text-content-primary/90' : 'text-content-secondary',
          )}
        >
          {program.description}
        </p>

        <div className="mt-2.5 flex items-center gap-2 text-caption font-medium">
          <Play className="h-3.5 w-3.5 shrink-0" style={{ color: accent.icon }} />
          <span style={{ color: accent.icon }}>{videoLabel}</span>
        </div>

        <button
          type="button"
          className={cn(
            'mt-4 flex h-9 w-full items-center justify-center rounded-lg',
            'text-sm font-medium text-white transition-all',
            'hover:brightness-110 active:scale-[0.99]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30',
          )}
          style={{
            background: accent.buttonGradient,
            border: `1px solid ${accent.buttonBorder}`,
            boxShadow: accent.buttonShadow,
          }}
          onClick={() => onManage?.(program.manageRoute)}
        >
          Manage
        </button>
      </div>
    </article>
  );
}
