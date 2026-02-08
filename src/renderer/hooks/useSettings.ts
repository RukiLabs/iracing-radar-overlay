import { useEffect, useCallback, useState } from 'react';
import { create } from 'zustand';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

declare global {
  interface Window {
    electronAPI?: {
      getSettings: () => Promise<AppSettings>;
      setSettings: (s: AppSettings) => Promise<void>;
      getSettingsJson: () => Promise<string>;
      importSettingsJson: (json: string) => Promise<{ ok: boolean; error?: string }>;
      setClickThrough: (value: boolean) => void;
      onToggleSettings: (fn: () => void) => void;
    };
  }
}

interface SettingsStore {
  settings: AppSettings;
  setSettings: (s: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  hydrated: boolean;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (s) =>
    set((state) => ({
      settings: typeof s === 'function' ? s(state.settings) : s,
    })),
  hydrated: false,
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 300;

export function useSettings(): {
  settings: AppSettings;
  setSettings: (s: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  hydrated: boolean;
} {
  const { settings, setSettings, hydrated } = useSettingsStore();

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.getSettings) return;
    api.getSettings().then((loaded) => {
      useSettingsStore.setState({ settings: loaded, hydrated: true });
    });
  }, []);

  const persist = useCallback((next: AppSettings) => {
    useSettingsStore.setState({ settings: next });
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      window.electronAPI?.setSettings?.(next);
      saveTimeout = null;
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const setAndPersist = useCallback(
    (s: AppSettings | ((prev: AppSettings) => AppSettings)) => {
      const next = typeof s === 'function' ? s(useSettingsStore.getState().settings) : s;
      persist(next);
    },
    [persist]
  );

  return {
    settings,
    setSettings: setAndPersist,
    hydrated,
  };
}

export function useSettingsPanel(): {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
} {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onToggleSettings) return;
    const handler = () => setOpen((o) => !o);
    api.onToggleSettings(handler);
  }, []);
  return { open, setOpen, toggle: () => setOpen((o) => !o) };
}
