/** Overlay IDs and visibility state - which overlays are enabled */

export type OverlayId = 'proximityRadar';

export interface EnabledOverlays {
  proximityRadar: boolean;
}

export const DEFAULT_ENABLED_OVERLAYS: EnabledOverlays = {
  proximityRadar: true,
};

export interface OverlayDefinition {
  id: OverlayId;
  name: string;
  description: string;
}

export const OVERLAY_DEFINITIONS: OverlayDefinition[] = [
  { id: 'proximityRadar', name: 'Proximity Radar', description: 'Radar + spotter bars' },
];
