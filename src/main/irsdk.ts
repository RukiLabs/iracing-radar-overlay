/**
 * iRacing SDK reader (Electron main process).
 * Polls at 60Hz and sends telemetry to renderer via IPC.
 * Uses mock data when node-irsdk is not available (e.g. dev without native build).
 */

import { BrowserWindow } from 'electron';
import type {
  TelemetryState,
  CarTelemetry,
  PlayerTelemetry,
  SessionInfo,
  DriverInfo,
} from '../shared/telemetry';

const TRACK_LENGTH_DEFAULT_M = 4000;
const POLL_INTERVAL_MS = 1000 / 60;

function getLongitudinalDistance(
  playerLapDistPct: number,
  otherLapDistPct: number,
  trackLengthM: number
): number {
  let delta = otherLapDistPct - playerLapDistPct;
  if (delta > 0.5) delta -= 1.0;
  if (delta < -0.5) delta += 1.0;
  return delta * trackLengthM;
}

function parseTrackLengthM(str: string): number {
  const match = str.match(/([\d.]+)\s*km/i);
  if (match) return parseFloat(match[1]) * 1000;
  const mi = str.match(/([\d.]+)\s*mi/i);
  if (mi) return parseFloat(mi[1]) * 1609.34;
  return TRACK_LENGTH_DEFAULT_M;
}

function mockSession(): SessionInfo {
  return {
    trackName: 'Charlotte Motor Speedway',
    trackDisplayName: 'Charlotte',
    trackLengthMeters: 1500,
    sessionType: 'Practice',
    sessionLaps: 0,
    drivers: [],
  };
}

export function getMockTelemetry(): TelemetryState {
  const now = Date.now();
  const t = now / 1000;
  return {
    connectionStatus: 'disconnected',
    player: {
      speed: 60 + Math.sin(t * 0.5) * 10,
      rpm: 6000,
      gear: 4,
      throttle: 0.8,
      brake: 0,
      clutch: 0,
      steeringWheelAngle: 0,
      lapBestLapTime: 120,
      lapLastLapTime: 121,
      lapDeltaToBestLap: 1,
      lapCurrentLapTime: 60,
      position: 1,
      playerCarIdx: 0,
      fuelLevel: 45,
      fuelUsePerHour: 3.2,
      lapDistPct: 0.25 + (t * 0.01) % 0.5,
      carLeftRight: 0,
    },
    cars: [
      {
        carIdx: 1,
        longitudinalDist: -15,
        lateralDist: 2,
        distance: Math.sqrt(15 * 15 + 2 * 2),
        carNumber: '12',
        position: 2,
        trackSurface: 0,
        lap: 5,
      },
      {
        carIdx: 2,
        longitudinalDist: 25,
        lateralDist: -3,
        distance: Math.sqrt(25 * 25 + 9),
        carNumber: '55',
        position: 3,
        trackSurface: 0,
        lap: 5,
      },
      {
        carIdx: 3,
        longitudinalDist: -80,
        lateralDist: 0,
        distance: 80,
        carNumber: '7',
        position: 4,
        trackSurface: 0,
        lap: 5,
      },
    ],
    session: mockSession(),
    timestamp: now,
  };
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let mainWindow: BrowserWindow | null = null;
let useLiveSdk = false;
let iracingInstance: { telemetry: unknown; sessionInfo: unknown; on: (e: string, fn: () => void) => void } | null = null;

function sendTelemetry(state: TelemetryState): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('telemetry-update', state);
  }
}

function readLiveTelemetry(): TelemetryState {
  try {
    const inst = iracingInstance;
    if (!inst) return getMockTelemetry();
    const session = inst.sessionInfo as Record<string, unknown> | null | undefined;
    const telemetry = inst.telemetry as Record<string, unknown> | null | undefined;
    if (!session || !telemetry) return getMockTelemetry();

    const playerCarIdx = (telemetry.PlayerCarIdx as number) ?? 0;
    const lapDistPctArr = telemetry.CarIdxLapDistPct as number[] | undefined;
    const lapDistPct = (lapDistPctArr && lapDistPctArr[playerCarIdx]) ?? 0;
    const trackLengthM = parseTrackLengthFromSession(session);
    const drivers = parseDrivers(session);
    const cars: CarTelemetry[] = [];
    const carIdxLapDistPct = (telemetry.CarIdxLapDistPct as number[]) ?? [];
    const carIdxTrackSurface = (telemetry.CarIdxTrackSurface as number[]) ?? [];
    const carIdxPosition = (telemetry.CarIdxPosition as number[]) ?? [];
    const carIdxLap = (telemetry.CarIdxLap as number[]) ?? [];

    for (let i = 0; i < carIdxLapDistPct.length; i++) {
      if (i === playerCarIdx) continue;
      const surface = carIdxTrackSurface[i];
      if (surface === undefined || surface < 0) continue;
      const otherPct = carIdxLapDistPct[i] ?? 0;
      const longDist = getLongitudinalDistance(lapDistPct, otherPct, trackLengthM);
      const carLeftRight = (telemetry.CarLeftRight as number) ?? 0;
      const latDist = estimateLateral(i, playerCarIdx, carLeftRight);
      const dist = Math.sqrt(longDist * longDist + latDist * latDist);
      const driver = drivers.find((d) => d.carIdx === i);
      cars.push({
        carIdx: i,
        longitudinalDist: longDist,
        lateralDist: latDist,
        distance: dist,
        carNumber: driver?.carNumber ?? String(i),
        position: carIdxPosition[i] ?? 0,
        trackSurface: surface,
        lap: carIdxLap[i] ?? 0,
      });
    }

    const player: PlayerTelemetry = {
      speed: ((telemetry.Speed as number) ?? 0) * 0.44704,
      rpm: (telemetry.RPM as number) ?? 0,
      gear: (telemetry.Gear as number) ?? 0,
      throttle: (telemetry.Throttle as number) ?? 0,
      brake: (telemetry.Brake as number) ?? 0,
      clutch: (telemetry.Clutch as number) ?? 0,
      steeringWheelAngle: ((telemetry.SteeringWheelAngle as number) ?? 0) * (Math.PI / 180),
      lapBestLapTime: (telemetry.LapBestLapTime as number) ?? 0,
      lapLastLapTime: (telemetry.LapLastLapTime as number) ?? 0,
      lapDeltaToBestLap: (telemetry.LapDeltaToBestLap as number) ?? 0,
      lapCurrentLapTime: (telemetry.LapCurrentLapTime as number) ?? 0,
      position: (telemetry.PlayerCarPosition as number) ?? 0,
      playerCarIdx,
      fuelLevel: (telemetry.FuelLevel as number) ?? 0,
      fuelUsePerHour: (telemetry.FuelUsePerHour as number) ?? 0,
      lapDistPct,
      carLeftRight: (telemetry.CarLeftRight as number) ?? 0,
    };

    const si = session.SessionInfo as { Sessions?: Array<{ SessionType?: string; SessionLaps?: string | number }> } | undefined;
    const sess0 = si?.Sessions?.[0];
    const sessionInfo: SessionInfo = {
      trackName: (session.WeekendInfo as Record<string, string>)?.TrackName ?? 'unknown',
      trackDisplayName: (session.WeekendInfo as Record<string, string>)?.TrackDisplayName ?? 'Unknown',
      trackLengthMeters: trackLengthM,
      sessionType: sess0?.SessionType ?? 'Practice',
      sessionLaps: parseInt(String(sess0?.SessionLaps ?? 0), 10) || 0,
      drivers,
    };

    return {
      connectionStatus: 'connected',
      player,
      cars,
      session: sessionInfo,
      timestamp: Date.now(),
    };
  } catch {
    return getMockTelemetry();
  }
}

function parseTrackLengthFromSession(session: Record<string, unknown>): number {
  try {
    const wi = session.WeekendInfo as { TrackLength?: string } | undefined;
    if (wi?.TrackLength) return parseTrackLengthM(wi.TrackLength);
  } catch {}
  return TRACK_LENGTH_DEFAULT_M;
}

function parseDrivers(session: Record<string, unknown>): DriverInfo[] {
  const out: DriverInfo[] = [];
  try {
    const di = session.DriverInfo as { Drivers?: Array<{ CarIdx?: number; UserName?: string; CarNumber?: string; CarClassID?: number; IRating?: number }> } | undefined;
    const drivers = di?.Drivers;
    if (!Array.isArray(drivers)) return out;
    for (const d of drivers) {
      out.push({
        carIdx: d.CarIdx ?? out.length,
        userName: d.UserName ?? '',
        carNumber: String(d.CarNumber ?? ''),
        carClassId: d.CarClassID ?? 0,
        iRating: d.IRating ?? 0,
      });
    }
  } catch {}
  return out;
}

function estimateLateral(carIdx: number, playerCarIdx: number, carLeftRight: number): number {
  if (carLeftRight === 2) return -2;
  if (carLeftRight === 3) return 2;
  if (carLeftRight === 5) return -3;
  if (carLeftRight === 6) return 3;
  return (carIdx - playerCarIdx) % 3 - 1;
}

function poll(): void {
  const state = useLiveSdk ? readLiveTelemetry() : getMockTelemetry();
  sendTelemetry(state);
}

export function initIrsdk(win: BrowserWindow): void {
  mainWindow = win;
  try {
    const irsdk = require('node-irsdk');
    const iracing = irsdk.init({ telemetryUpdateInterval: 0 });
    iracingInstance = iracing;
    useLiveSdk = true;
    iracing.on('Connected', () => {
      sendTelemetry({ ...getMockTelemetry(), connectionStatus: 'connected' });
    });
    iracing.on('Disconnected', () => {
      sendTelemetry({ ...getMockTelemetry(), connectionStatus: 'disconnected' });
    });
  } catch {
    iracingInstance = null;
    useLiveSdk = false;
  }
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  poll();
}

export function stopIrsdk(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  mainWindow = null;
  iracingInstance = null;
  useLiveSdk = false;
}
