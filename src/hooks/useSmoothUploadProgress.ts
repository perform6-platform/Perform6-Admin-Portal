import { useCallback, useEffect, useRef, useState } from 'react';
import type { UploadProgressState } from '../components/content-library/UploadProgressPanel';

const idle: UploadProgressState = { phase: 'idle', percent: 0 };

/**
 * Smooth professional progress:
 * - HTTP upload bytes map to 1–55%
 * - Server processing job maps to 55–99%
 * - READY completes at 100% and stops the spinner
 */
export function useSmoothUploadProgress() {
  const [state, setState] = useState<UploadProgressState>(idle);
  const targetRef = useRef(0);
  const displayRef = useRef(0);
  const phaseRef = useRef<UploadProgressState['phase']>('idle');
  const completeRequestedRef = useRef(false);
  const doneResolversRef = useRef<Array<() => void>>([]);

  const resolveDoneWaiters = useCallback(() => {
    const waiters = doneResolversRef.current;
    doneResolversRef.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  const reset = useCallback(() => {
    targetRef.current = 0;
    displayRef.current = 0;
    phaseRef.current = 'idle';
    completeRequestedRef.current = false;
    doneResolversRef.current = [];
    setState(idle);
  }, []);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const target = targetRef.current;
      const current = displayRef.current;
      if (current < target) {
        const delta = target - current;
        const step = Math.max(0.35, delta * 0.065);
        displayRef.current = Math.min(target, current + step);
      }

      const rounded = Math.min(100, Math.round(displayRef.current));
      const phase = phaseRef.current;

      if (
        completeRequestedRef.current &&
        rounded >= 100 &&
        phase !== 'done' &&
        phase !== 'error'
      ) {
        phaseRef.current = 'done';
        setState({
          phase: 'done',
          percent: 100,
          label: 'Upload complete',
        });
        resolveDoneWaiters();
      } else if (phase !== 'idle' && phase !== 'done' && phase !== 'error') {
        setState((prev) =>
          prev.percent === rounded && prev.phase === phase
            ? prev
            : {
                phase,
                percent: rounded,
                label:
                  phase === 'uploading'
                    ? 'Uploading video'
                    : 'Processing video',
              },
        );
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [resolveDoneWaiters]);

  const start = useCallback(() => {
    completeRequestedRef.current = false;
    doneResolversRef.current = [];
    targetRef.current = 1;
    displayRef.current = 0;
    phaseRef.current = 'uploading';
    setState({ phase: 'uploading', percent: 1, label: 'Uploading video' });
  }, []);

  /** HTTP transfer percent 0–100 → display target capped at 55%. */
  const setHttpUploadPercent = useCallback((httpPercent: number) => {
    const clamped = Math.max(0, Math.min(100, httpPercent));
    const mapped = Math.max(1, Math.round((clamped / 100) * 55));
    targetRef.current = Math.max(targetRef.current, mapped);
    phaseRef.current = 'uploading';
  }, []);

  /** Mark file received by API; keep bar under 60 until processing reports. */
  const markUploadReceived = useCallback(() => {
    phaseRef.current = 'processing';
    targetRef.current = Math.max(targetRef.current, 58);
  }, []);

  /** BullMQ job progress 0–100 → display target 55–99%. */
  const setProcessingJobPercent = useCallback((jobPercent: number) => {
    const clamped = Math.max(0, Math.min(100, jobPercent));
    const mapped = 55 + Math.round((clamped / 100) * 44);
    targetRef.current = Math.max(targetRef.current, Math.min(99, mapped));
    phaseRef.current = 'processing';
  }, []);

  /** Finish: animate remaining bar to 100%, then stop loader. */
  const complete = useCallback(() => {
    completeRequestedRef.current = true;
    targetRef.current = 100;
    if (phaseRef.current !== 'done' && phaseRef.current !== 'error') {
      phaseRef.current = 'processing';
    }
  }, []);

  const waitUntilDone = useCallback(
    (timeoutMs = 15_000) =>
      new Promise<void>((resolve) => {
        if (phaseRef.current === 'done') {
          resolve();
          return;
        }
        const timer = window.setTimeout(() => {
          doneResolversRef.current = doneResolversRef.current.filter(
            (entry) => entry !== onDone,
          );
          resolve();
        }, timeoutMs);
        const onDone = () => {
          window.clearTimeout(timer);
          resolve();
        };
        doneResolversRef.current.push(onDone);
      }),
    [],
  );

  const fail = useCallback((label = 'Upload failed') => {
    completeRequestedRef.current = false;
    phaseRef.current = 'error';
    setState({ phase: 'error', percent: Math.round(displayRef.current), label });
    resolveDoneWaiters();
  }, [resolveDoneWaiters]);

  return {
    progress: state,
    start,
    setHttpUploadPercent,
    markUploadReceived,
    setProcessingJobPercent,
    complete,
    waitUntilDone,
    fail,
    reset,
  };
}
