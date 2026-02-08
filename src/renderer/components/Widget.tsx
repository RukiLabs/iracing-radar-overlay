import React from 'react';
import { Radar } from './Radar';
import { SideBar } from './SideBar';
import type { CarTelemetry } from '@/types/telemetry';
import type { AppSettings } from '@/types/settings';
import type { SessionInfo } from '@/types/telemetry';

export interface WidgetProps {
  settings: AppSettings;
  cars: CarTelemetry[];
  session?: SessionInfo | null;
  playerLapDistPct?: number;
}

export function Widget({
  settings,
  cars,
  session,
  playerLapDistPct,
}: WidgetProps): JSX.Element {
  const { radar, sideBars } = settings;
  const size = radar.radarSizePx;
  const showBars = sideBars.showSideBars;
  const sessionForRadar =
    session != null
      ? { trackName: session.trackName, trackLengthMeters: session.trackLengthMeters }
      : null;
  return (
    <div className="flex items-center gap-2 p-2">
      {showBars && (
        <SideBar
          side="left"
          cars={cars}
          widthPx={sideBars.barWidthPx}
          heightPx={sideBars.barHeightPx}
          visible
        />
      )}
      <div
        className="rounded-[14px] overflow-hidden"
        style={{
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(0,0,0,0.2)',
        }}
      >
        <Radar
          settings={radar}
          cars={cars}
          width={size}
          height={size}
          session={sessionForRadar}
          playerLapDistPct={playerLapDistPct}
        />
      </div>
      {showBars && (
        <SideBar
          side="right"
          cars={cars}
          widthPx={sideBars.barWidthPx}
          heightPx={sideBars.barHeightPx}
          visible
        />
      )}
    </div>
  );
}
