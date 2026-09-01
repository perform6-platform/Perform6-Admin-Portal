import { useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useQueueDeviceRemoteCommand } from '../../hooks/useDevices';
import type { TouchRemoteSlot } from '../../types/monitoring';
import { formatTouchSlotLabel } from '../../lib/screenOutputLabels';
import { Button } from '../ui';

const PROGRAM_SLOTS: TouchRemoteSlot[] = [
  'start-here',
  'phase1',
  'phase2',
  'full-program',
];

export interface TouchRemoteControlsProps {
  deviceId: string | null;
  disabled?: boolean;
}

export function TouchRemoteControls({ deviceId, disabled }: TouchRemoteControlsProps) {
  const { mutate, isPending } = useQueueDeviceRemoteCommand();
  const [lastQueued, setLastQueued] = useState<string | null>(null);

  const queue = (label: string, payload: Parameters<typeof mutate>[0]['payload']) => {
    if (!deviceId || disabled) return;
    mutate(
      { deviceId, payload },
      {
        onSuccess: () => setLastQueued(label),
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || isPending}
          onClick={() => queue('Pause', { action: 'PAUSE' })}
        >
          <Pause className="h-4 w-4" />
          Pause
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || isPending}
          onClick={() => queue('Play', { action: 'PLAY' })}
        >
          <Play className="h-4 w-4" />
          Play
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!deviceId || disabled || isPending}
          onClick={() => queue('Return to menu', { action: 'RETURN_TO_MENU' })}
        >
          <RotateCcw className="h-4 w-4" />
          Main menu
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROGRAM_SLOTS.map((slot) => (
          <Button
            key={slot}
            type="button"
            variant="outline"
            size="sm"
            disabled={!deviceId || disabled || isPending}
            onClick={() =>
              queue(formatTouchSlotLabel(slot), {
                action: 'SELECT_TOUCH_SLOT',
                slot,
              })
            }
          >
            {formatTouchSlotLabel(slot)}
          </Button>
        ))}
      </div>

      <p className="text-caption text-content-muted">
        Commands are delivered on the device&apos;s next heartbeat (~60s). Keep the player online.
        {lastQueued ? ` Last queued: ${lastQueued}.` : ''}
      </p>
    </div>
  );
}
