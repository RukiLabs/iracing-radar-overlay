/**
 * Track layout: centerline in world (x,z) meters, for drawing the circuit shape on the radar.
 * Centerline is ordered from start/finish line along the lap.
 */

export interface TrackLayout {
  /** iRacing track id (e.g. "spa", "charlotte") for matching session */
  trackId: string;
  /** Total length in meters (should match session when available) */
  trackLengthM: number;
  /** Centerline points [x, z] in meters. First point = start/finish. */
  centerline: [number, number][];
  /** Cumulative distance along centerline (computed from centerline) */
  distancesM?: number[];
}

/** Get cumulative distances along centerline and total length */
export function computeTrackDistances(layout: TrackLayout): number[] {
  const pts = layout.centerline;
  const dist: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dz = pts[i][1] - pts[i - 1][1];
    dist[i] = dist[i - 1] + Math.sqrt(dx * dx + dz * dz);
  }
  return dist;
}

/** Get position and heading (radians) at a given distance along the track. Wraps by track length. */
export function getPositionAtDistance(
  layout: TrackLayout,
  distanceM: number
): { x: number; z: number; headingRad: number } {
  const pts = layout.centerline;
  const dist = layout.distancesM ?? computeTrackDistances(layout);
  const total = dist[dist.length - 1] ?? 0;
  if (total <= 0) return { x: pts[0][0], z: pts[0][1], headingRad: 0 };
  let d = distanceM % total;
  if (d < 0) d += total;
  let i = 0;
  while (i < dist.length - 1 && dist[i + 1] <= d) i++;
  const i1 = Math.min(i + 1, pts.length - 1);
  const segLen = dist[i1] - dist[i];
  const t = segLen > 0 ? (d - dist[i]) / segLen : 0;
  const x = pts[i][0] + t * (pts[i1][0] - pts[i][0]);
  const z = pts[i][1] + t * (pts[i1][1] - pts[i][1]);
  const dx = pts[i1][0] - pts[i][0];
  const dz = pts[i1][1] - pts[i][1];
  const headingRad = Math.atan2(dx, dz);
  return { x, z, headingRad };
}

/** Normal perpendicular to the left of the direction (dx, dz) */
function normalLeft(dx: number, dz: number): [number, number] {
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  return [-dz / len, dx / len];
}

/** Get left and right edge points at distance, for track width */
export function getTrackEdgesAtDistance(
  layout: TrackLayout,
  distanceM: number,
  halfWidthM: number
): { left: [number, number]; right: [number, number]; center: [number, number] } {
  const { x, z, headingRad } = getPositionAtDistance(layout, distanceM);
  const [nx, nz] = normalLeft(Math.sin(headingRad), Math.cos(headingRad));
  return {
    center: [x, z],
    left: [x + nx * halfWidthM, z + nz * halfWidthM],
    right: [x - nx * halfWidthM, z - nz * halfWidthM],
  };
}
