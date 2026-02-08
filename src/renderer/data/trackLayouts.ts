/**
 * Track layouts for radar: centerline (x,z) in meters.
 * iRacing track names are lowercase (e.g. "spa", "charlotte").
 * Add more tracks by exporting layouts and registering in TRACK_LAYOUTS.
 */

import type { TrackLayout } from '@/types/trackLayout';
import { computeTrackDistances } from '@/types/trackLayout';

/** Generate ellipse points; a,b = semi-axes in m. Returns centerline [x,z][] */
function ellipseCenterline(a: number, b: number, numPoints: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    pts.push([a * Math.cos(t), b * Math.sin(t)]);
  }
  return pts;
}

/** Simple oval: ~1.5km, good for Charlotte-style */
function makeOval(): TrackLayout {
  const a = 280;
  const b = 180;
  const centerline = ellipseCenterline(a, b, 80);
  const layout: TrackLayout = {
    trackId: 'charlotte',
    trackLengthM: 1500,
    centerline,
  };
  layout.distancesM = computeTrackDistances(layout);
  layout.trackLengthM = layout.distancesM[layout.distancesM.length - 1] ?? 1500;
  return layout;
}

/** Second oval (e.g. Texas style) - slightly different shape */
function makeOval2(): TrackLayout {
  const a = 260;
  const b = 200;
  const centerline = ellipseCenterline(a, b, 72);
  const layout: TrackLayout = {
    trackId: 'texas',
    trackLengthM: 2300,
    centerline,
  };
  layout.distancesM = computeTrackDistances(layout);
  layout.trackLengthM = layout.distancesM[layout.distancesM.length - 1] ?? 2300;
  return layout;
}

/** Indianapolis-style oval (rectangular with rounded corners) */
function makeIndianapolis(): TrackLayout {
  const a = 320;
  const b = 130;
  const centerline = ellipseCenterline(a, b, 64);
  const layout: TrackLayout = {
    trackId: 'indianapolis',
    trackLengthM: 2500,
    centerline,
  };
  layout.distancesM = computeTrackDistances(layout);
  layout.trackLengthM = layout.distancesM[layout.distancesM.length - 1] ?? 2500;
  return layout;
}

/** Simplified "road" shape: long straight + hairpin + straight (e.g. minimal Spa-like) */
function makeRoadCourse(): TrackLayout {
  const pts: [number, number][] = [];
  const straight = 400;
  const w = 200;
  for (let i = 0; i <= 20; i++) pts.push([-straight + (i / 20) * straight * 2, -w]);
  for (let i = 1; i <= 15; i++) pts.push([straight, -w + (i / 15) * w * 2]);
  for (let i = 1; i <= 20; i++) pts.push([straight - (i / 20) * straight * 2, w]);
  for (let i = 1; i <= 14; i++) pts.push([-straight, w - (i / 14) * w * 2]);
  const layout: TrackLayout = {
    trackId: 'roadcourse',
    trackLengthM: 4000,
    centerline: pts,
  };
  layout.distancesM = computeTrackDistances(layout);
  layout.trackLengthM = layout.distancesM[layout.distancesM.length - 1] ?? 4000;
  return layout;
}

const _oval = makeOval();
const _oval2 = makeOval2();
const _indy = makeIndianapolis();
const _road = makeRoadCourse();

/** Map iRacing track name (lowercase) to layout. Add more as needed. */
export const TRACK_LAYOUTS: Record<string, TrackLayout> = {
  charlotte: _oval,
  charlotte_motor_speedway: _oval,
  texas: _oval2,
  texas_motor_speedway: _oval2,
  indianapolis: _indy,
  indianapolis_motor_speedway: _indy,
  roadcourse: _road,
};

/** Normalize iRacing track name for lookup (lowercase, no spaces) */
export function normalizeTrackId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function getTrackLayout(trackName: string): TrackLayout | null {
  const id = normalizeTrackId(trackName);
  return TRACK_LAYOUTS[id] ?? null;
}
