import { useEffect, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Globe2, Save } from 'lucide-react';
import {
  useGlobalRotationSettings,
  useUpdateGlobalRotationSettings,
} from '../../hooks/useRotation';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useToast } from '../../context/ToastContext';
import { getApiErrorMessage } from '../../services/axios';
import { Button, CARD_SURFACE_CLASS, DatePicker, SectionLabel } from '../ui';
import { cn } from '../../lib/cn';

function parseSettingsDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function GlobalRotationSettingsPanel() {
  const { showToast } = useToast();
  const { data: user } = useCurrentUser();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const { data: settings, isLoading } = useGlobalRotationSettings();
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateGlobalRotationSettings();

  const [startDate, setStartDate] = useState<Date | undefined>();

  useEffect(() => {
    setStartDate(parseSettingsDate(settings?.globalRotationStartDate));
  }, [settings?.globalRotationStartDate]);

  async function handleSave() {
    if (!startDate) {
      showToast({
        title: 'Select a global rotation start date',
        variant: 'error',
      });
      return;
    }

    try {
      await saveSettings({
        globalRotationStartDate: format(startDate, 'yyyy-MM-dd'),
      });
      showToast({
        title: 'Global rotation saved',
        message: 'All devices in Global mode follow this calendar.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: getApiErrorMessage(error, 'Failed to save global rotation'),
        variant: 'error',
      });
    }
  }

  return (
    <section className={cn(CARD_SURFACE_CLASS, 'space-y-4 p-4 sm:p-6')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <SectionLabel className="block">Global rotation calendar</SectionLabel>
          </div>
          <p className="mt-1 text-body-sm text-content-secondary">
            Platform-wide Day 1 for deployments that join global rotation. Devices download a
            rolling 7-day window from today&apos;s rotation day (not week-aligned).
          </p>
        </div>
        {settings?.currentRotationDay != null && (
          <p className="shrink-0 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-body-sm font-medium text-brand-700 dark:text-brand-300">
            Today: Day {settings.currentRotationDay}
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="text-body-sm text-content-muted">Loading global settings…</p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <p className="mb-1 text-xs font-medium text-content-muted">
              Global rotation start date
            </p>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              disabled={!isPlatformAdmin}
            />
            {settings?.globalRotationStartDate ? (
              <p className="mt-1 text-caption text-content-secondary">
                Saved: {settings.globalRotationStartDate}
              </p>
            ) : (
              <p className="mt-1 text-caption text-status-warning">
                Not configured yet — global deployments stay idle until this is set.
              </p>
            )}
          </div>
          {isPlatformAdmin && (
            <Button
              type="button"
              size="md"
              className="h-9 gap-2 px-4 sm:w-auto"
              disabled={isSaving || !startDate}
              onClick={() => void handleSave()}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save global date'}
            </Button>
          )}
        </div>
      )}

      {!isPlatformAdmin && (
        <p className="text-caption text-content-muted">
          Only Platform Admins can change the global start date. Content managers can view the
          current calendar.
        </p>
      )}
    </section>
  );
}
