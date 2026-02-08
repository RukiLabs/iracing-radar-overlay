import { useState, useEffect } from 'react';
import type { TelemetryState } from '@/types/telemetry';

declare global {
  interface Window {
    electronAPI?: {
      onTelemetryUpdate: (fn: (state: unknown) => void) => void;
    };
  }
}

const defaultState: TelemetryState = {
  connectionStatus: 'disconnected',
  player: {
    speed: 0,
    rpm: 0,
    gear: 0,
    throttle: 0,
    brake: 0,
    clutch: 0,
    steeringWheelAngle: 0,
    lapBestLapTime: 0,
    lapLastLapTime: 0,
    lapDeltaToBestLap: 0,
    lapCurrentLapTime: 0,
    position: 0,
    playerCarIdx: 0,
    fuelLevel: 0,
    fuelUsePerHour: 0,
    lapDistPct: 0,
    carLeftRight: 0,
  },
  cars: [],
  session: null,
  timestamp: 0,
};

export function useTelemetry(): TelemetryState {
  const [state, setState] = useState<TelemetryState>(defaultState);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onTelemetryUpdate) return;
    const handler = (payload: unknown) => {
      setState(payload as TelemetryState);
    };
    api.onTelemetryUpdate(handler);
  }, []);

  return state;
}
