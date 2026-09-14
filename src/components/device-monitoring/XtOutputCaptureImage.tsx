import type { ScreenCaptureOutput, ScreenCaptureSnapshot } from '../../types/monitoring';

export function XtOutputCaptureImage({
  capture,
  output,
  className = '',
}: {
  capture: ScreenCaptureSnapshot;
  output: ScreenCaptureOutput;
  className?: string;
}) {
  const cacheBusted = `${capture.url}${capture.url.includes('?') ? '&' : '?'}capturedAt=${encodeURIComponent(capture.capturedAt)}`;
  const canvasWidth = Math.max(1, capture.canvas.width);
  const canvasHeight = Math.max(1, capture.canvas.height);
  const widthPercent = (canvasWidth / output.width) * 100;
  const heightPercent = (canvasHeight / output.height) * 100;
  const leftPercent = -(output.x / output.width) * 100;
  const topPercent = -(output.y / output.height) * 100;

  return (
    <div className={`relative aspect-video overflow-hidden bg-black ${className}`}>
      <img
        src={cacheBusted}
        alt={`Captured ${output.label} output`}
        className="pointer-events-none absolute max-w-none select-none"
        style={{
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
        }}
      />
    </div>
  );
}
