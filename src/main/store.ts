import Store from 'electron-store';
import type { AppSettings } from '../shared/settings';
import { DEFAULT_SETTINGS } from '../shared/settings';
import type { EnabledOverlays } from '../shared/overlays';
import { DEFAULT_ENABLED_OVERLAYS } from '../shared/overlays';

function mergeDefaults<T>(loaded: unknown, defaults: T): T {
  if (!loaded || typeof loaded !== 'object') return defaults;
  const out = { ...defaults } as Record<string, unknown>;
  const d = defaults as Record<string, unknown>;
  for (const key of Object.keys(d)) {
    const l = (loaded as Record<string, unknown>)[key];
    const def = d[key];
    if (def !== null && typeof def === 'object' && !Array.isArray(def)) {
      out[key] = mergeDefaults(l, def);
    } else if (l !== undefined) {
      out[key] = l;
    }
  }
  return out as T;
}

const store = new Store<Record<string, unknown>>();

export function getSettings(): AppSettings {
  const raw = store.get('settings');
  return mergeDefaults(raw, DEFAULT_SETTINGS) as AppSettings;
}

export function setSettings(settings: AppSettings): void {
  store.set('settings', settings);
}

export function getEnabledOverlays(): EnabledOverlays {
  const raw = store.get('enabledOverlays');
  return mergeDefaults(raw, DEFAULT_ENABLED_OVERLAYS) as EnabledOverlays;
}

export function setEnabledOverlays(overlays: EnabledOverlays): void {
  store.set('enabledOverlays', overlays);
}

export interface OverlayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_OVERLAY_BOUNDS: OverlayBounds = { x: 0, y: 0, width: 500, height: 400 };

export function getOverlayBounds(): OverlayBounds {
  const raw = store.get('overlayBounds');
  if (!raw || typeof raw !== 'object') return DEFAULT_OVERLAY_BOUNDS;
  const o = raw as Record<string, unknown>;
  const x = typeof o.x === 'number' ? o.x : DEFAULT_OVERLAY_BOUNDS.x;
  const y = typeof o.y === 'number' ? o.y : DEFAULT_OVERLAY_BOUNDS.y;
  const width = typeof o.width === 'number' && o.width >= 300 ? o.width : DEFAULT_OVERLAY_BOUNDS.width;
  const height = typeof o.height === 'number' && o.height >= 200 ? o.height : DEFAULT_OVERLAY_BOUNDS.height;
  return { x, y, width, height };
}

export function setOverlayBounds(bounds: OverlayBounds): void {
  store.set('overlayBounds', bounds);
}

export function getSettingsJson(): string {
  return JSON.stringify(getSettings(), null, 2);
}

export function setSettingsFromJson(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json) as AppSettings;
    setSettings(mergeDefaults(parsed, DEFAULT_SETTINGS) as AppSettings);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}
