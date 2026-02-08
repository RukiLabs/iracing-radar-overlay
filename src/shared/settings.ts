/** Persistent settings (electron-store + Zustand) - shared for main and renderer */

export type PlayerColorId =
  | 'blue'
  | 'green'
  | 'purple'
  | 'pink'
  | 'amber'
  | 'cyan'
  | 'red'
  | 'white';

export const PLAYER_COLOR_MAP: Record<PlayerColorId, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  pink: '#ec4899',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  red: '#ef4444',
  white: '#ffffff',
};

export interface RadarSettings {
  rangeM: number;
  radarSizePx: number;
  trackWidthM: number;
  showTrackEdges: boolean;
  showGridRings: boolean;
  opacity: number;
  carSizeScale: number;
  playerColor: PlayerColorId;
  showCarNumbers: boolean;
}

export interface SideBarSettings {
  barHeightPx: number;
  barWidthPx: number;
  showSideBars: boolean;
}

export interface AudioSettings {
  proximityAudio: boolean;
  volume: number;
}

export interface AppSettings {
  radar: RadarSettings;
  sideBars: SideBarSettings;
  audio: AudioSettings;
}

export const DEFAULT_RADAR_SETTINGS: RadarSettings = {
  rangeM: 100,
  radarSizePx: 280,
  trackWidthM: 20,
  showTrackEdges: true,
  showGridRings: true,
  opacity: 92,
  carSizeScale: 1.0,
  playerColor: 'blue',
  showCarNumbers: true,
};

export const DEFAULT_SIDEBAR_SETTINGS: SideBarSettings = {
  barHeightPx: 270,
  barWidthPx: 34,
  showSideBars: false,
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  proximityAudio: true,
  volume: 50,
};

export const DEFAULT_SETTINGS: AppSettings = {
  radar: { ...DEFAULT_RADAR_SETTINGS },
  sideBars: { ...DEFAULT_SIDEBAR_SETTINGS },
  audio: { ...DEFAULT_AUDIO_SETTINGS },
};
