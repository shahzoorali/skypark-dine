'use client';

import { useEffect, useRef, useState } from 'react';

type ModelViewerElement = HTMLElement & {
  canActivateAR: boolean;
  activateAR: () => Promise<void>;
};

/**
 * "View on your table": a 3D view of the dish that opens the phone camera and
 * places it on the table at real size. Android uses WebXR / Scene Viewer,
 * iPhone uses AR Quick Look (model-viewer builds the USDZ on the fly), and
 * anything else gets a 3D model the guest can spin.
 */
export function ArView({ src, dishName }: { src: string; dishName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewerRef = useRef<ModelViewerElement>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [arSupported, setArSupported] = useState<boolean | null>(null);

  async function show() {
    setLoading(true);
    try {
      // ~1 MB of 3D runtime — only fetched once a guest actually asks for it.
      await import('@google/model-viewer');
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.showModal();
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onLoad = () => setArSupported(viewer.canActivateAR);
    viewer.addEventListener('load', onLoad);
    return () => viewer.removeEventListener('load', onLoad);
  }, [open]);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="ar-btn"
        onClick={show}
        disabled={loading}
        aria-label={`See ${dishName} in 3D and on your table`}
      >
        <CubeIcon />
        {loading ? 'Loading…' : 'View in 3D'}
      </button>

      {open ? (
        <dialog
          ref={dialogRef}
          className="ar-dialog"
          aria-label={`${dishName} in 3D`}
          onClose={() => {
            setOpen(false);
            setArSupported(null);
          }}
          onClick={event => {
            if (event.target === dialogRef.current) close();
          }}
        >
          <div className="ar-dialog__head">
            <h2 className="ar-dialog__title">{dishName}</h2>
            <button type="button" className="ar-dialog__close" onClick={close} aria-label="Close">
              ×
            </button>
          </div>

          <model-viewer
            ref={viewerRef}
            class="ar-dialog__viewer"
            src={src}
            alt={`3D model of ${dishName}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="floor"
            ar-scale="fixed"
            camera-controls
            touch-action="pan-y"
            auto-rotate
            shadow-intensity="1"
          >
            <button slot="ar-button" type="button" className="ar-dialog__launch">
              <CubeIcon />
              Place it on my table
            </button>
          </model-viewer>

          <p className="ar-dialog__hint">
            {arSupported === false
              ? 'Your phone can’t open the camera view here — drag to turn the dish around.'
              : 'Tap “Place it on my table”, point your camera at the table, then move your phone slowly until the dish appears.'}
          </p>
        </dialog>
      ) : null}
    </>
  );
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
      <path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" />
    </svg>
  );
}
