/**
 * Radar coordinate helpers: map world distances to canvas pixels.
 * Player is always at center, pointing UP (0° = up).
 * X: positive = ahead, negative = behind
 * Y: positive = right, negative = left
 * Canvas: origin at center, +y down. So we use: canvasX = x, canvasY = -y (flip left/right to screen)
 * Actually for "top-down, player up": ahead = up = negative canvas Y. Left = negative canvas X.
 * So: canvasX = lateral (positive right), canvasY = -longitudinal (ahead = up = negative Y)
 */

export interface RadarTransform {
  centerX: number;
  centerY: number;
  scale: number; // pixels per meter
  rangeM: number;
  sizePx: number;
}

export function makeRadarTransform(
  sizePx: number,
  rangeM: number
): RadarTransform {
  const scale = sizePx / (2 * rangeM);
  return {
    centerX: sizePx / 2,
    centerY: sizePx / 2,
    scale,
    rangeM,
    sizePx,
  };
}

/** World: longitudinal (m, + = ahead), lateral (m, + = right) -> canvas x, y */
export function worldToCanvas(
  longitudinalM: number,
  lateralM: number,
  t: RadarTransform
): { x: number; y: number } {
  const x = t.centerX + lateralM * t.scale;
  const y = t.centerY - longitudinalM * t.scale; // ahead = up
  return { x, y };
}

/** Get grid ring interval in meters based on range */
export function getGridRingIntervalM(rangeM: number): number {
  if (rangeM <= 50) return 10;
  if (rangeM <= 100) return 25;
  return 50;
}

/** Danger zone radius: min(15, range * 0.15) meters */
export function getDangerZoneRadiusM(rangeM: number): number {
  return Math.min(15, rangeM * 0.15);
}

/**
 * Transform world (x,z) to player-relative (longitudinal ahead, lateral right).
 * Player at (px, pz) with headingRad (0 = facing +z in world).
 */
export function worldToPlayerRelative(
  wx: number,
  wz: number,
  px: number,
  pz: number,
  headingRad: number
): { longitudinal: number; lateral: number } {
  const dx = wx - px;
  const dz = wz - pz;
  const cosH = Math.cos(headingRad);
  const sinH = Math.sin(headingRad);
  const longitudinal = -dx * sinH + dz * cosH;
  const lateral = dx * cosH + dz * sinH;
  return { longitudinal, lateral };
}

/** Player-relative to canvas (uses same convention as worldToCanvas) */
export function playerRelativeToCanvas(
  longitudinalM: number,
  lateralM: number,
  t: RadarTransform
): { x: number; y: number } {
  return worldToCanvas(longitudinalM, lateralM, t);
}
