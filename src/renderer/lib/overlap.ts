/**
 * Spotter bar overlap computation (benofficial2 / iOverlay logic).
 * relDist: longitudinal distance from player to other car.
 * Positive = other car is BEHIND player. Negative = other car is AHEAD of player.
 */

import { CAR_LENGTH_M, SIDE_GAP_CAR_LENGTHS } from '@shared/constants';

export interface OverlapResult {
  /** 0 = front/top of bar, 1 = rear/bottom of bar */
  top: number;
  /** Height of fill (0..1) */
  height: number;
}

/**
 * Compute where the other car overlaps the player along the car length.
 * Returns null if car is too far (no indicator), or OverlapResult for bar fill.
 */
export function computeOverlap(relDist: number): OverlapResult | null {
  const halfL = CAR_LENGTH_M / 2;

  // Other car occupies interval [relDist - halfL, relDist + halfL]
  // Player car occupies interval [-halfL, +halfL]
  const otherFront = relDist - halfL;
  const otherRear = relDist + halfL;
  const playerFront = -halfL;
  const playerRear = halfL;

  const overlapStart = Math.max(otherFront, playerFront);
  const overlapEnd = Math.min(otherRear, playerRear);
  const overlapLength = Math.max(0, overlapEnd - overlapStart);

  if (overlapLength <= 0) {
    // No direct overlap — show thin indicator if car is close (within 1.5 car lengths gap)
    const gap =
      relDist > 0
        ? otherFront - playerRear // car behind
        : playerFront - otherRear; // car ahead
    if (gap > CAR_LENGTH_M * SIDE_GAP_CAR_LENGTHS) return null;

    const proximity = 1 - gap / (CAR_LENGTH_M * SIDE_GAP_CAR_LENGTHS);
    if (relDist > 0) {
      return { top: 0.88, height: 0.06 + proximity * 0.06 };
    } else {
      return { top: 0.04, height: 0.06 + proximity * 0.06 };
    }
  }

  const barTop = (overlapStart + halfL) / CAR_LENGTH_M;
  const barBottom = (overlapEnd + halfL) / CAR_LENGTH_M;
  return { top: barTop, height: barBottom - barTop };
}
