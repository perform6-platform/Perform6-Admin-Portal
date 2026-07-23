import { useEffect, useRef } from 'react';
import type { ContentItem } from '../../constants/contentLibrary';
import { getContentVideoUrl } from '../../constants/contentLibrary';
import { Modal } from '../ui';

export interface ContentVideoPlayerModalProps {
  open: boolean;
  item: ContentItem | null;
  onClose: () => void;
}

export function ContentVideoPlayerModal({ open, item, onClose }: ContentVideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = item ? getContentVideoUrl(item) : null;

  useEffect(() => {
    if (!open || !videoRef.current) return undefined;

    const video = videoRef.current;
    void video.play().catch(() => undefined);

    return () => {
      video.pause();
      video.currentTime = 0;
    };
  }, [open, videoUrl]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item?.title ?? 'Play video'}
      size="lg"
      footer={null}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          key={videoUrl}
          controls
          playsInline
          className="aspect-video w-full rounded-lg bg-black"
          src={videoUrl}
        >
          Your browser does not support video playback.
        </video>
      ) : (
        <p className="text-body-sm text-content-secondary">
          No playable video URL from the media library. Re-upload or wait until processing finishes.
        </p>
      )}
    </Modal>
  );
}
