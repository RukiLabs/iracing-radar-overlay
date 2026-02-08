import { useEffect, useRef, useState } from 'react';
import { Widget } from '@/components/Widget';
import { SettingsPanel } from '@/components/SettingsPanel';
import { OverlayChrome } from '@/components/OverlayChrome';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useSettings, useSettingsPanel } from '@/hooks/useSettings';
import { initAudio, setMasterVolume, playProximityBeep, getDangerLevelFromLateral } from '@/lib/audio';
import { SIDE_LATERAL_MIN_M, SIDE_LATERAL_MAX_M } from '@shared/constants';
import { CAR_LENGTH_M } from '@shared/constants';

/** Overlay tape from F9: 1 = normal, 2 = off (hidden), 3 = resize */
type OverlayTape = 1 | 2 | 3;

declare global {
  interface Window {
    electronAPI?: {
      onOverlayTapeChange?: (fn: (tape: number) => void) => void;
      setClickThrough?: (value: boolean) => void;
    };
  }
}

const SIDE_LONGITUDINAL_M = CAR_LENGTH_M * 2.5;

function getClosestForSide(
  cars: { longitudinalDist: number; lateralDist: number }[],
  side: 'left' | 'right'
): { lateralDist: number } | null {
  const sign = side === 'left' ? -1 : 1;
  const inRange = cars.filter((c) => {
    if (c.lateralDist * sign <= 0) return false;
    const absLat = Math.abs(c.lateralDist);
    if (absLat < SIDE_LATERAL_MIN_M || absLat > SIDE_LATERAL_MAX_M) return false;
    if (Math.abs(c.longitudinalDist) > SIDE_LONGITUDINAL_M) return false;
    return true;
  });
  if (inRange.length === 0) return null;
  inRange.sort((a, b) => Math.abs(a.longitudinalDist) + Math.abs(a.lateralDist) * 2 - (Math.abs(b.longitudinalDist) + Math.abs(b.lateralDist) * 2));
  return inRange[0];
}

export default function App(): JSX.Element {
  const telemetry = useTelemetry();
  const { settings, setSettings, hydrated } = useSettings();
  const { open: settingsOpen, setOpen: setSettingsOpen } = useSettingsPanel();
  const [overlayTape, setOverlayTape] = useState<OverlayTape>(1);
  const lastBeepSide = useRef<'left' | 'right' | null>(null);
  const lastBeepTime = useRef(0);

  useEffect(() => {
    window.electronAPI?.onOverlayTapeChange?.(setOverlayTape);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('settings-open', settingsOpen);
    window.electronAPI?.setClickThrough?.(!settingsOpen);
  }, [settingsOpen]);

  useEffect(() => {
    initAudio('');
    return () => {};
  }, []);

  useEffect(() => {
    setMasterVolume(settings.audio.volume);
  }, [settings.audio.volume]);

  useEffect(() => {
    if (!settings.audio.proximityAudio || !hydrated) return;
    const left = getClosestForSide(telemetry.cars, 'left');
    const right = getClosestForSide(telemetry.cars, 'right');
    const now = Date.now();
    if (left && (lastBeepSide.current !== 'left' || now - lastBeepTime.current > 800)) {
      const level = getDangerLevelFromLateral(Math.abs(left.lateralDist));
      playProximityBeep('left', level, settings.audio.volume);
      lastBeepSide.current = 'left';
      lastBeepTime.current = now;
    } else if (right && (lastBeepSide.current !== 'right' || now - lastBeepTime.current > 800)) {
      const level = getDangerLevelFromLateral(Math.abs(right.lateralDist));
      playProximityBeep('right', level, settings.audio.volume);
      lastBeepSide.current = 'right';
      lastBeepTime.current = now;
    } else if (!left && !right) {
      lastBeepSide.current = null;
    }
  }, [telemetry.cars, settings.audio.proximityAudio, settings.audio.volume, hydrated]);

  return (
    <div className="relative w-full h-full min-h-screen min-w-screen">
      <OverlayChrome overlayTape={overlayTape}>
        <div className="flex flex-col items-start justify-start p-2 flex-1 min-h-0">
          <div className="flex items-center gap-2">
            <Widget
              settings={settings}
              cars={telemetry.cars}
              session={telemetry.session}
              playerLapDistPct={telemetry.player.lapDistPct}
            />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="w-6 h-6 rounded flex items-center justify-center text-white/35 hover:text-white/65 transition shrink-0 focus:outline-none"
              aria-label="Settings (F8)"
              title="Settings (F8)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="mt-1 text-[10px] font-share text-white/50">
            {telemetry.connectionStatus === 'connected' && '● iRacing connected'}
            {telemetry.connectionStatus === 'disconnected' && '○ iRacing disconnected'}
            {telemetry.connectionStatus === 'waiting' && '◐ Waiting for iRacing…'}
          </div>
        </div>
      </OverlayChrome>
      {/* F9 tape indicator: only show in Resize mode (tape 3) */}
      {overlayTape === 3 && (
        <div
          className="fixed bottom-2 left-2 px-2 py-1 rounded text-[10px] font-medium bg-black/50 border border-blue-400/50 text-white/95 pointer-events-none"
          aria-live="polite"
        >
          F9 · Resize — drag top or bottom-right corner
        </div>
      )}
      {settingsOpen && (
        <SettingsPanel
          open
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
