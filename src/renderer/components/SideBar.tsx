import React from 'react';
import { computeOverlap } from '@/lib/overlap';
import type { CarTelemetry } from '@/types/telemetry';
import { SIDE_LATERAL_MIN_M, SIDE_LATERAL_MAX_M } from '@shared/constants';
import { CAR_LENGTH_M } from '@shared/constants';
import { getDangerLevelFromLateral } from '@/lib/audio';

const SIDE_LONGITUDINAL_M = CAR_LENGTH_M * 2.5;

function scoreCar(car: CarTelemetry): number {
  return Math.abs(car.longitudinalDist) + Math.abs(car.lateralDist) * 2;
}

function getClosestCarForSide(cars: CarTelemetry[], side: 'left' | 'right'): CarTelemetry | null {
  const lateralSign = side === 'left' ? -1 : 1;
  const inRange = cars.filter((c) => {
    const lat = c.lateralDist;
    const absLat = Math.abs(lat);
    if (lat * lateralSign <= 0) return false;
    if (absLat < SIDE_LATERAL_MIN_M || absLat > SIDE_LATERAL_MAX_M) return false;
    if (Math.abs(c.longitudinalDist) > SIDE_LONGITUDINAL_M) return false;
    return true;
  });
  if (inRange.length === 0) return null;
  inRange.sort((a, b) => scoreCar(a) - scoreCar(b));
  return inRange[0];
}

export type DangerLevel = 'far' | 'close' | 'danger';

export interface SideBarProps {
  side: 'left' | 'right';
  cars: CarTelemetry[];
  widthPx: number;
  heightPx: number;
  visible: boolean;
}

const LEVEL_STYLES: Record<DangerLevel, { gradient: string; glow: string; pulse?: boolean }> = {
  far: {
    gradient: 'linear-gradient(180deg, #d97706, #b45309)',
    glow: 'rgba(217, 119, 6, 0.5)',
  },
  close: {
    gradient: 'linear-gradient(180deg, #ea580c, #c2410c)',
    glow: 'rgba(234, 88, 12, 0.5)',
  },
  danger: {
    gradient: 'linear-gradient(180deg, #dc2626, #b91c1c)',
    glow: 'rgba(220, 38, 38, 0.6)',
    pulse: true,
  },
};

export function SideBar({ side, cars, widthPx, heightPx, visible }: SideBarProps): JSX.Element {
  const car = getClosestCarForSide(cars, side);
  const overlap = car ? computeOverlap(car.longitudinalDist) : null;
  const lateralAbs = car ? Math.abs(car.lateralDist) : 0;
  const level: DangerLevel = car ? getDangerLevelFromLateral(lateralAbs) : 'far';
  const style = LEVEL_STYLES[level];

  if (!visible) return <div className="w-0 h-0 overflow-hidden" />;

  return (
    <div
      className="relative flex flex-col items-center rounded-full overflow-visible"
      style={{
        width: widthPx,
        height: heightPx,
        background: 'rgba(12,13,18,0.92)',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
        ...(style.pulse && { animation: 'dangerPulse 0.35s ease-in-out infinite alternate' }),
      }}
    >
      {overlap && (
        <>
          <div
            className="absolute left-0 right-0 rounded-full transition-all duration-75"
            style={{
              top: `${overlap.top * 100}%`,
              height: `${overlap.height * 100}%`,
              left: 3,
              right: 3,
              background: style.gradient,
              boxShadow: `0 0 12px ${style.glow}`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full pointer-events-none -z-10"
            style={{
              boxShadow: `0 0 20px ${style.glow}`,
            }}
          />
        </>
      )}
    </div>
  );
}
