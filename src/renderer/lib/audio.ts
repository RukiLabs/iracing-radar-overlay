/**
 * Proximity audio warnings with Howler.js and stereo panning.
 * Left car -> pan left, right car -> pan right.
 * Intensity: far = single beep, close = double, danger = rapid.
 */

import { Howl } from 'howler';

export type DangerLevel = 'far' | 'close' | 'danger';

const BEEP_LOW = '/sounds/beep-low.mp3';
const BEEP_MID = '/sounds/beep-mid.mp3';
const BEEP_HIGH = '/sounds/beep-high.mp3';

let sounds: {
  low: Howl | null;
  mid: Howl | null;
  high: Howl | null;
} = { low: null, mid: null, high: null };

let lastBeepSide: 'left' | 'right' | null = null;
let lastBeepTime = 0;
const MIN_BEEP_INTERVAL_MS = 150;

export function initAudio(basePath: string): void {
  try {
    const p = (s: string) => (basePath ? `${basePath.replace(/\/$/, '')}${s}` : s);
    sounds.low = new Howl({ src: [p(BEEP_LOW)], volume: 0.6 });
    sounds.mid = new Howl({ src: [p(BEEP_MID)], volume: 0.6 });
    sounds.high = new Howl({ src: [p(BEEP_HIGH)], volume: 0.7 });
  } catch {
    // Sound files may be missing; proximity audio will be disabled
  }
}

export function setMasterVolume(volume0To100: number): void {
  const v = volume0To100 / 100;
  if (sounds.low) sounds.low.volume(v * 0.6);
  if (sounds.mid) sounds.mid.volume(v * 0.6);
  if (sounds.high) sounds.high.volume(v * 0.7);
}

export function playProximityBeep(
  side: 'left' | 'right',
  level: DangerLevel,
  volume0To100: number
): void {
  if (!sounds.low && !sounds.mid && !sounds.high) return;
  const now = Date.now();
  if (now - lastBeepTime < MIN_BEEP_INTERVAL_MS && lastBeepSide === side) return;
  lastBeepTime = now;
  lastBeepSide = side;

  const pan = side === 'left' ? -1 : 1;
  const vol = volume0To100 / 100;

  const play = (s: Howl | null) => {
    if (!s) return;
    try {
      s.volume(vol);
      s.stereo(Math.max(0, Math.min(1, (pan + 1) / 2)));
      s.play();
    } catch {}
  };

  switch (level) {
    case 'far':
      play(sounds.low);
      break;
    case 'close':
      play(sounds.mid);
      setTimeout(() => play(sounds.mid), 120);
      break;
    case 'danger':
      play(sounds.high);
      setTimeout(() => play(sounds.high), 80);
      setTimeout(() => play(sounds.high), 160);
      break;
  }
}

export function getDangerLevelFromLateral(lateralM: number): DangerLevel {
  if (lateralM < 2) return 'danger';
  if (lateralM < 3.5) return 'close';
  return 'far';
}
