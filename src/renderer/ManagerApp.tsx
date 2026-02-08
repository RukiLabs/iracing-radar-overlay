import React, { useState, useEffect } from 'react';
import type { OverlayId, EnabledOverlays } from '@shared/overlays';
import { OVERLAY_DEFINITIONS } from '@shared/overlays';

declare global {
  interface Window {
    managerAPI?: {
      getEnabledOverlays: () => Promise<EnabledOverlays>;
      setEnabledOverlays: (o: EnabledOverlays) => Promise<void>;
      openOverlaySettings: () => void;
      showOverlay: () => void;
      showManager: () => void;
    };
  }
}

export default function ManagerApp(): JSX.Element {
  const [enabled, setEnabled] = useState<EnabledOverlays>({ proximityRadar: true });

  useEffect(() => {
    document.body.classList.add('manager');
    const root = document.getElementById('root');
    if (root) root.classList.add('manager-root');
    window.managerAPI?.getEnabledOverlays().then(setEnabled);
  }, []);

  const toggle = (id: OverlayId) => {
    const next = { ...enabled, [id]: !enabled[id] };
    setEnabled(next);
    window.managerAPI?.setEnabledOverlays(next);
  };

  const openSettings = () => {
    window.managerAPI?.openOverlaySettings();
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] text-white font-share flex flex-col">
      <header className="px-5 py-4 border-b border-white/10">
        <h1 className="font-oxanium font-semibold text-lg tracking-wide">Overlay Manager</h1>
        <p className="text-xs text-white/50 mt-0.5">Turn overlays on or off. F9 cycles: Normal → Off → Resize.</p>
      </header>
      <main className="flex-1 p-4 overflow-auto">
        <section>
          <h2 className="text-xs uppercase tracking-wider text-white/50 mb-3">Overlays</h2>
          <ul className="space-y-2">
            {OVERLAY_DEFINITIONS.map((def) => (
              <li
                key={def.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.07] transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white/95">{def.name}</div>
                  <div className="text-xs text-white/50 mt-0.5">{def.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openSettings()}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                    title="Open overlay settings"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled[def.id]}
                    onClick={() => toggle(def.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      enabled[def.id] ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 mt-0.5 ${
                        enabled[def.id] ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-6 pt-4 border-t border-white/10">
          <h2 className="text-xs uppercase tracking-wider text-white/50 mb-2">Shortcuts</h2>
          <ul className="text-xs text-white/60 space-y-1">
            <li><kbd className="bg-white/10 px-1.5 py-0.5 rounded">F8</kbd> Open overlay settings (use when overlay is click-through)</li>
            <li><kbd className="bg-white/10 px-1.5 py-0.5 rounded">F9</kbd> Cycle overlay: Normal → Off → Resize</li>
            <li><kbd className="bg-white/10 px-1.5 py-0.5 rounded">F10</kbd> Toggle click-through (when visible)</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
