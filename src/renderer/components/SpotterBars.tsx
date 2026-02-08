import React from 'react';
import { SideBar } from './SideBar';
import type { CarTelemetry } from '@/types/telemetry';
import type { SideBarSettings } from '@/types/settings';

export interface SpotterBarsProps {
  settings: SideBarSettings;
  cars: CarTelemetry[];
}

export function SpotterBars({ settings, cars }: SpotterBarsProps): JSX.Element {
  const { barHeightPx, barWidthPx, showSideBars } = settings;
  return (
    <div className="flex items-center gap-2 shrink-0">
      <SideBar
        side="left"
        cars={cars}
        widthPx={barWidthPx}
        heightPx={barHeightPx}
        visible={showSideBars}
      />
      <SideBar
        side="right"
        cars={cars}
        widthPx={barWidthPx}
        heightPx={barHeightPx}
        visible={showSideBars}
      />
    </div>
  );
}
