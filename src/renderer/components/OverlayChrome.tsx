import React, { useCallback, useRef } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      setOverlayIgnoreMouse: (ignore: boolean) => void;
      getOverlaySize: () => Promise<{ width: number; height: number }>;
      setOverlaySize: (width: number, height: number) => void;
    };
  }
}

/** 1 = normal, 2 = off (hidden), 3 = resize */
export function OverlayChrome({
  children,
  overlayTape = 1,
}: {
  children: React.ReactNode;
  overlayTape?: 1 | 2 | 3;
}): JSX.Element {
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const isResizeMode = overlayTape === 3;

  const handleDragEnter = useCallback(() => {
    window.electronAPI?.setOverlayIgnoreMouse?.(false);
  }, []);
  const handleDragLeave = useCallback(() => {
    // Don't revert to click-through while user is resizing (mouse left the handle during drag)
    if (resizeStart.current !== null) return;
    window.electronAPI?.setOverlayIgnoreMouse?.(true);
  }, []);

  const onResizeMouseDown = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    const size = await window.electronAPI?.getOverlaySize?.();
    if (!size) return;
    resizeStart.current = { x: e.screenX, y: e.screenY, w: size.width, h: size.height };
    const onMove = (ev: MouseEvent) => {
      if (!resizeStart.current) return;
      const dw = ev.screenX - resizeStart.current.x;
      const dh = ev.screenY - resizeStart.current.y;
      window.electronAPI?.setOverlaySize?.(
        resizeStart.current.w + dw,
        resizeStart.current.h + dh
      );
    };
    const onUp = () => {
      resizeStart.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.electronAPI?.setOverlayIgnoreMouse?.(true);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Invisible drag strip - no visible UI, keeps move/resize working */}
      <div
        className="h-1 shrink-0 cursor-move"
        style={{ WebkitAppRegion: 'drag' as const }}
        onMouseEnter={handleDragEnter}
        onMouseLeave={handleDragLeave}
        aria-hidden
      />
      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ WebkitAppRegion: 'no-drag' as const }}>
        {children}
      </div>
      {/* Resize handle: in Resize mode (tape 3) show a subtle corner hint */}
      <div
        className={`absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-10 flex items-end justify-end ${
          isResizeMode ? 'ring-1 ring-blue-400/60 ring-inset rounded-tl bg-white/5' : ''
        }`}
        onMouseEnter={handleDragEnter}
        onMouseLeave={handleDragLeave}
        onMouseDown={onResizeMouseDown}
        aria-label="Resize overlay"
        title={isResizeMode ? 'Drag to resize overlay' : undefined}
      >
        {isResizeMode && (
          <svg className="w-4 h-4 text-white/50 mb-0.5 mr-0.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 9l6 6m0 0v-6m0 6h-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
