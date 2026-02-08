/**
 * Canvas drawing logic for the proximity radar (60fps, imperative).
 * Player at center, pointing UP. Cars drawn as rectangles (length × width) for easier gauging.
 */

import type { CarTelemetry } from '@/types/telemetry';
import type { RadarSettings } from '@/types/settings';
import type { TrackLayout } from '@/types/trackLayout';
import { getPositionAtDistance, getTrackEdgesAtDistance } from '@/types/trackLayout';
import { getTrackLayout } from '@/data/trackLayouts';
import {
  makeRadarTransform,
  worldToCanvas,
  worldToPlayerRelative,
  getGridRingIntervalM,
  getDangerZoneRadiusM,
  type RadarTransform,
} from '@/lib/radarMath';
import { RADAR_DANGER_DISTANCE_M, RADAR_WARNING_DISTANCE_M } from '@shared/constants';
import { PLAYER_COLOR_MAP } from '@/types/settings';

function getCarColor(distance: number): string {
  if (distance < RADAR_DANGER_DISTANCE_M) return '#ef4444';
  if (distance < RADAR_WARNING_DISTANCE_M) return '#f59e0b';
  return 'rgba(170,170,180,0.4)';
}

function getCarOpacity(distance: number, rangeM: number): number {
  const t = distance / rangeM;
  return Math.max(0.3, 1 - t * 0.7);
}

/** Rounded rect path; radius in px. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  if (r <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

/** Car proportions: ~2.5:1 length:width. Premium: rounded corners, soft shadow, crisp stroke. */
function drawCarRect(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  opacity: number,
  headingRad: number = 0,
  isPlayer: boolean = false
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(headingRad);
  const halfLength = size;
  const halfWidth = size * 0.4;
  const r = Math.max(1.5, size * 0.12);

  if (!isPlayer) {
    ctx.globalAlpha = opacity * 0.35;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  }
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  roundRect(ctx, -halfWidth, -halfLength, halfWidth * 2, halfLength * 2, r);
  ctx.fill();
  if (!isPlayer) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.strokeStyle = isPlayer ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)';
  ctx.lineWidth = isPlayer ? 2 : 1.2;
  ctx.beginPath();
  roundRect(ctx, -halfWidth, -halfLength, halfWidth * 2, halfLength * 2, r);
  ctx.stroke();
  ctx.restore();
}

/** Player car: larger, premium glow, nose-up. */
function drawPlayerCar(
  ctx: CanvasRenderingContext2D,
  t: RadarTransform,
  playerColor: string,
  carSizeScale: number
): void {
  const size = 12 * carSizeScale;
  ctx.save();
  ctx.shadowColor = playerColor;
  ctx.shadowBlur = 14;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = playerColor;
  const halfL = size;
  const halfW = size * 0.4;
  const r = Math.max(1.5, size * 0.12);
  ctx.beginPath();
  roundRect(ctx, t.centerX - halfW, t.centerY - halfL, halfW * 2, halfL * 2, r);
  ctx.fill();
  ctx.restore();
  drawCarRect(ctx, t.centerX, t.centerY, size, playerColor, 1, 0, true);
}

/** Draw track shape from layout: centerline + optional edges, in player-relative coords. */
function drawTrackFromLayout(
  ctx: CanvasRenderingContext2D,
  t: RadarTransform,
  layout: TrackLayout,
  trackWidthM: number,
  playerDistM: number,
  playerX: number,
  playerZ: number,
  playerHeadingRad: number
): void {
  const dist = layout.distancesM ?? [];
  const halfW = trackWidthM / 2;
  const leftPts: { x: number; y: number }[] = [];
  const rightPts: { x: number; y: number }[] = [];
  const centerPts: { x: number; y: number }[] = [];

  for (let i = 0; i < layout.centerline.length; i++) {
    const d = dist[i] ?? 0;
    const { left, right, center } = getTrackEdgesAtDistance(layout, d, halfW);
    const relL = worldToPlayerRelative(left[0], left[1], playerX, playerZ, playerHeadingRad);
    const relR = worldToPlayerRelative(right[0], right[1], playerX, playerZ, playerHeadingRad);
    const relC = worldToPlayerRelative(center[0], center[1], playerX, playerZ, playerHeadingRad);
    leftPts.push(worldToCanvas(relL.longitudinal, relL.lateral, t));
    rightPts.push(worldToCanvas(relR.longitudinal, relR.lateral, t));
    centerPts.push(worldToCanvas(relC.longitudinal, relC.lateral, t));
  }

  ctx.save();
  if (leftPts.length >= 2 && rightPts.length >= 2) {
    const grad = ctx.createLinearGradient(0, 0, t.sizePx, t.sizePx);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < leftPts.length; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
    for (let i = rightPts.length - 1; i >= 0; i--) ctx.lineTo(rightPts[i].x, rightPts[i].y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  if (leftPts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < leftPts.length; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
    ctx.stroke();
  }
  if (rightPts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(rightPts[0].x, rightPts[0].y);
    for (let i = 1; i < rightPts.length; i++) ctx.lineTo(rightPts[i].x, rightPts[i].y);
    ctx.stroke();
  }
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  if (leftPts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < leftPts.length; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
    ctx.stroke();
  }
  if (rightPts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(rightPts[0].x, rightPts[0].y);
    for (let i = 1; i < rightPts.length; i++) ctx.lineTo(rightPts[i].x, rightPts[i].y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1;
  if (centerPts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(centerPts[0].x, centerPts[0].y);
    for (let i = 1; i < centerPts.length; i++) ctx.lineTo(centerPts[i].x, centerPts[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Track edges: refined double-stroke and subtle gradient fill (straight strip when no layout). */
function drawTrackEdges(
  ctx: CanvasRenderingContext2D,
  t: RadarTransform,
  trackWidthM: number
): void {
  const halfW = (trackWidthM / 2) * t.scale;
  const leftX = t.centerX - halfW;
  const rightX = t.centerX + halfW;
  const top = 0;
  const bottom = t.sizePx;

  ctx.save();
  const trackW = rightX - leftX;
  const grad = ctx.createLinearGradient(leftX, 0, rightX, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.022)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(leftX, top, trackW, bottom - top);

  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.moveTo(leftX, top);
  ctx.lineTo(leftX, bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightX, top);
  ctx.lineTo(rightX, bottom);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(leftX, top);
  ctx.lineTo(leftX, bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightX, top);
  ctx.lineTo(rightX, bottom);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(t.centerX, top);
  ctx.lineTo(t.centerX, bottom);
  ctx.stroke();
  ctx.restore();
}

/** Grid rings: soft concentric circles with slight fade. */
function drawGridRings(ctx: CanvasRenderingContext2D, t: RadarTransform): void {
  const interval = getGridRingIntervalM(t.rangeM);
  const maxR = t.rangeM;
  ctx.save();
  const maxRadiusPx = maxR * t.scale;
  for (let r = interval; r < maxR; r += interval) {
    const radius = r * t.scale;
    const alpha = 0.03 + (1 - radius / maxRadiusPx) * 0.04;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(t.centerX, t.centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(t.centerX, 0);
  ctx.lineTo(t.centerX, t.sizePx);
  ctx.stroke();
  ctx.restore();
}

/** Danger zone: radial gradient for a soft, premium halo. */
function drawDangerZone(ctx: CanvasRenderingContext2D, t: RadarTransform): void {
  const r = getDangerZoneRadiusM(t.rangeM) * t.scale;
  ctx.save();
  const grad = ctx.createRadialGradient(
    t.centerX, t.centerY, 0,
    t.centerX, t.centerY, r
  );
  grad.addColorStop(0, 'rgba(239,68,68,0.06)');
  grad.addColorStop(0.6, 'rgba(239,68,68,0.02)');
  grad.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(t.centerX, t.centerY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(239,68,68,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(t.centerX, t.centerY, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export interface DrawRadarOptions {
  ctx: CanvasRenderingContext2D;
  settings: RadarSettings;
  cars: CarTelemetry[];
  playerColorHex: string;
  /** When set, track layout is drawn on radar if we have layout data for this track. */
  session?: { trackName: string; trackLengthMeters: number } | null;
  /** 0–1, distance along track as fraction of lap. Used to place player on layout. */
  playerLapDistPct?: number;
}

export function drawRadar(opts: DrawRadarOptions): void {
  const { ctx, settings, cars, playerColorHex, session, playerLapDistPct } = opts;
  const {
    rangeM,
    radarSizePx,
    trackWidthM,
    showTrackEdges,
    showGridRings,
    opacity,
    carSizeScale,
    showCarNumbers,
  } = settings;

  const t = makeRadarTransform(radarSizePx, rangeM);

  const layout =
    session != null &&
    typeof playerLapDistPct === 'number' &&
    !Number.isNaN(playerLapDistPct)
      ? getTrackLayout(session.trackName)
      : null;
  const playerDistM =
    layout && session != null && typeof playerLapDistPct === 'number'
      ? playerLapDistPct * (session.trackLengthMeters || layout.trackLengthM)
      : 0;
  const playerPos =
    layout && session != null
      ? getPositionAtDistance(layout, playerDistM)
      : null;

  ctx.save();
  ctx.globalAlpha = opacity / 100;

  const bgOpacity = opacity / 100;
  const radius = 14;
  const x = 0;
  const y = 0;
  const w = radarSizePx;
  const h = radarSizePx;
  const centerX = w / 2;
  const centerY = h / 2;
  const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.6);
  bgGrad.addColorStop(0, `rgba(18,20,26,${bgOpacity * 0.98})`);
  bgGrad.addColorStop(0.7, `rgba(12,14,20,${bgOpacity * 0.96})`);
  bgGrad.addColorStop(1, `rgba(10,12,16,${bgOpacity * 0.95})`);
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.stroke();

  if (showGridRings) drawGridRings(ctx, t);
  drawDangerZone(ctx, t);
  if (layout && playerPos && showTrackEdges) {
    drawTrackFromLayout(
      ctx,
      t,
      layout,
      trackWidthM,
      playerDistM,
      playerPos.x,
      playerPos.z,
      playerPos.headingRad
    );
  } else if (showTrackEdges) {
    drawTrackEdges(ctx, t, trackWidthM);
  }

  const sortedCars = [...cars].sort((a, b) => a.distance - b.distance);
  const baseSize = 8 * carSizeScale;

  for (const car of sortedCars) {
    const { x: canvasX, y: canvasY } = worldToCanvas(
      car.longitudinalDist,
      car.lateralDist,
      t
    );
    if (canvasX < -20 || canvasX > radarSizePx + 20 || canvasY < -20 || canvasY > radarSizePx + 20) continue;
    const color = getCarColor(car.distance);
    const alpha = getCarOpacity(car.distance, rangeM);
    const heading = car.heading ?? 0;
    drawCarRect(ctx, canvasX, canvasY, baseSize, color, alpha, heading, false);
    if (showCarNumbers) {
      ctx.save();
      const numY = canvasY - baseSize - 5;
      ctx.font = '600 11px Share Tech Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillText(car.carNumber, canvasX, numY);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  drawPlayerCar(ctx, t, playerColorHex, carSizeScale);
  ctx.restore();
}
