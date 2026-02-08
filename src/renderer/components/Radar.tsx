import React, { useRef, useEffect } from 'react';
import { drawRadar } from './RadarCanvas';
import type { CarTelemetry } from '@/types/telemetry';
import type { RadarSettings } from '@/types/settings';
import { PLAYER_COLOR_MAP } from '@/types/settings';

export interface RadarProps {
  settings: RadarSettings;
  cars: CarTelemetry[];
  width: number;
  height: number;
  /** When provided, real track layout is drawn on radar if we have data for this track. */
  session?: { trackName: string; trackLengthMeters: number } | null;
  /** 0–1, lap distance as fraction. Used to place player on track layout. */
  playerLapDistPct?: number;
}

export function Radar({
  settings,
  cars,
  width,
  height,
  session,
  playerLapDistPct,
}: RadarProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerColorHex = PLAYER_COLOR_MAP[settings.playerColor];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      drawRadar({
        ctx,
        settings,
        cars,
        playerColorHex,
        session,
        playerLapDistPct,
      });
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [settings, cars, width, height, playerColorHex, session, playerLapDistPct]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block rounded-[14px]"
      style={{ width, height, display: 'block' }}
    />
  );
}
