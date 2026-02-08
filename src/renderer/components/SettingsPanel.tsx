import React, { useState } from 'react';
import type { AppSettings } from '@/types/settings';
import { PLAYER_COLOR_MAP, type PlayerColorId } from '@/types/settings';

export interface SettingsPanelProps {
  open: boolean;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onClose: () => void;
}

const COLOR_IDS: PlayerColorId[] = ['blue', 'green', 'purple', 'pink', 'amber', 'cyan', 'red', 'white'];

export function SettingsPanel({ open, settings, onSettingsChange, onClose }: SettingsPanelProps): JSX.Element {
  const updateRadar = <K extends keyof AppSettings['radar']>(key: K, value: AppSettings['radar'][K]) => {
    onSettingsChange({
      ...settings,
      radar: { ...settings.radar, [key]: value },
    });
  };
  const updateSideBars = <K extends keyof AppSettings['sideBars']>(key: K, value: AppSettings['sideBars'][K]) => {
    onSettingsChange({
      ...settings,
      sideBars: { ...settings.sideBars, [key]: value },
    });
  };
  const updateAudio = <K extends keyof AppSettings['audio']>(key: K, value: AppSettings['audio'][K]) => {
    onSettingsChange({
      ...settings,
      audio: { ...settings.audio, [key]: value },
    });
  };

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: 320,
          background: 'rgba(12,13,18,0.97)',
          backdropFilter: 'blur(12px)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="p-4 flex flex-col gap-6 overflow-y-auto h-full font-share">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-oxanium font-semibold uppercase tracking-wider text-white/90">
              Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white transition"
              aria-label="Close settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Radar */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-white/60 border-b border-white/5 pb-1">
              Radar
            </h3>
            <SliderRow
              label="Zoom (Range)"
              value={settings.radar.rangeM}
              min={25}
              max={200}
              step={5}
              onChange={(v) => updateRadar('rangeM', v)}
            />
            <SliderRow
              label="Radar Size"
              value={settings.radar.radarSizePx}
              min={180}
              max={400}
              step={10}
              onChange={(v) => updateRadar('radarSizePx', v)}
            />
            <SliderRow
              label="Track Width"
              value={settings.radar.trackWidthM}
              min={8}
              max={24}
              step={1}
              onChange={(v) => updateRadar('trackWidthM', v)}
            />
            <ToggleRow
              label="Show Track Edges"
              checked={settings.radar.showTrackEdges}
              onChange={(v) => updateRadar('showTrackEdges', v)}
            />
            <ToggleRow
              label="Show Grid Rings"
              checked={settings.radar.showGridRings}
              onChange={(v) => updateRadar('showGridRings', v)}
            />
            <SliderRow
              label="Opacity"
              value={settings.radar.opacity}
              min={30}
              max={100}
              step={5}
              onChange={(v) => updateRadar('opacity', v)}
            />
          </section>

          {/* Side Bars */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-white/60 border-b border-white/5 pb-1">
              Side Bars
            </h3>
            <SliderRow
              label="Bar Height"
              value={settings.sideBars.barHeightPx}
              min={120}
              max={400}
              step={10}
              onChange={(v) => updateSideBars('barHeightPx', v)}
            />
            <SliderRow
              label="Bar Width"
              value={settings.sideBars.barWidthPx}
              min={16}
              max={60}
              step={2}
              onChange={(v) => updateSideBars('barWidthPx', v)}
            />
            <ToggleRow
              label="Show Side Bars"
              checked={settings.sideBars.showSideBars}
              onChange={(v) => updateSideBars('showSideBars', v)}
            />
          </section>

          {/* Cars */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-white/60 border-b border-white/5 pb-1">
              Cars
            </h3>
            <SliderRow
              label="Car Size"
              value={settings.radar.carSizeScale}
              min={0.6}
              max={2}
              step={0.1}
              format={(v) => v.toFixed(1)}
              onChange={(v) => updateRadar('carSizeScale', v)}
            />
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-white/60 w-full">Player Color</span>
              {COLOR_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-white/50 transition"
                  style={{ backgroundColor: PLAYER_COLOR_MAP[id] }}
                  onClick={() => updateRadar('playerColor', id)}
                  aria-label={`Color ${id}`}
                />
              ))}
            </div>
            <ToggleRow
              label="Show Car Numbers"
              checked={settings.radar.showCarNumbers}
              onChange={(v) => updateRadar('showCarNumbers', v)}
            />
          </section>

          {/* Audio */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-white/60 border-b border-white/5 pb-1">
              Audio
            </h3>
            <ToggleRow
              label="Proximity Audio"
              checked={settings.audio.proximityAudio}
              onChange={(v) => updateAudio('proximityAudio', v)}
            />
            <SliderRow
              label="Volume"
              value={settings.audio.volume}
              min={0}
              max={100}
              step={5}
              onChange={(v) => updateAudio('volume', v)}
            />
          </section>

          {/* Export / Import */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-white/60 border-b border-white/5 pb-1">
              Backup
            </h3>
            <ExportImportSection
              onExport={() => window.electronAPI?.getSettingsJson?.() ?? Promise.resolve('')}
              onImport={(json) => window.electronAPI?.importSettingsJson?.(json) ?? Promise.resolve({ ok: false, error: 'Unavailable' })}
              onImportSuccess={async () => {
                const loaded = await window.electronAPI?.getSettings?.();
                if (loaded) onSettingsChange(loaded);
              }}
            />
          </section>
        </div>
      </div>
    </>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format = (v: number) => String(v),
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-white/70 w-32 shrink-0">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 flex-1 rounded bg-white/10 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(59,130,246,0.6)]"
      />
      <span className="text-xs text-white/90 w-12 text-right font-mono">{format(value)}</span>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-white/70">{label}</label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          checked ? 'bg-blue-500/40' : 'bg-white/10'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 mt-0.5 ${
            checked ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function ExportImportSection({
  onExport,
  onImport,
  onImportSuccess,
}: {
  onExport: () => Promise<string>;
  onImport: (json: string) => Promise<{ ok: boolean; error?: string }>;
  onImportSuccess: () => Promise<void>;
}): JSX.Element {
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<'idle' | 'copied' | 'ok' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState('');

  const handleExport = async () => {
    const json = await onExport();
    try {
      await navigator.clipboard.writeText(json);
      setMessage('copied');
      setTimeout(() => setMessage('idle'), 2000);
    } catch {
      setMessage('error');
      setErrorDetail('Could not copy to clipboard');
    }
  };

  const handleImport = async () => {
    const res = await onImport(importText);
    if (res.ok) {
      await onImportSuccess();
      setMessage('ok');
      setImportText('');
      setTimeout(() => setMessage('idle'), 2000);
    } else {
      setMessage('error');
      setErrorDetail(res.error ?? 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-white/90 transition"
        >
          Export to clipboard
        </button>
        {message === 'copied' && <span className="text-xs text-green-400 self-center">Copied</span>}
      </div>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="Paste JSON here to import..."
        className="w-full h-20 px-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white/80 placeholder-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        rows={4}
      />
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={handleImport}
          disabled={!importText.trim()}
          className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:pointer-events-none text-white/90 transition"
        >
          Import
        </button>
        {message === 'ok' && <span className="text-xs text-green-400">Imported</span>}
        {message === 'error' && <span className="text-xs text-red-400">{errorDetail}</span>}
      </div>
    </div>
  );
}
