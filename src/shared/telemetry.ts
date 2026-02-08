/** Telemetry data (shared between main and renderer) */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'waiting';

export interface CarTelemetry {
  carIdx: number;
  longitudinalDist: number;
  lateralDist: number;
  distance: number;
  carNumber: string;
  position: number;
  trackSurface: number;
  lap: number;
  heading?: number;
}

export interface PlayerTelemetry {
  speed: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  clutch: number;
  steeringWheelAngle: number;
  lapBestLapTime: number;
  lapLastLapTime: number;
  lapDeltaToBestLap: number;
  lapCurrentLapTime: number;
  position: number;
  playerCarIdx: number;
  fuelLevel: number;
  fuelUsePerHour: number;
  lapDistPct: number;
  carLeftRight: number;
}

export interface SessionInfo {
  trackName: string;
  trackDisplayName: string;
  trackLengthMeters: number;
  sessionType: string;
  sessionLaps: number;
  drivers: DriverInfo[];
}

export interface DriverInfo {
  carIdx: number;
  userName: string;
  carNumber: string;
  carClassId: number;
  iRating: number;
}

export interface TelemetryState {
  connectionStatus: ConnectionStatus;
  player: PlayerTelemetry;
  cars: CarTelemetry[];
  session: SessionInfo | null;
  timestamp: number;
}
