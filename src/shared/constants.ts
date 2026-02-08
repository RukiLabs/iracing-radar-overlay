/** Shared constants for main and renderer */

export const CAR_LENGTH_M = 4.8;

/** Lateral range for side bar detection (meters) */
export const SIDE_LATERAL_MIN_M = 0.3;
export const SIDE_LATERAL_MAX_M = 6;

/** Longitudinal range for side bar (car lengths) */
export const SIDE_LONGITUDINAL_CAR_LENGTHS = 2.5;

/** Gap threshold for "no overlap" thin indicator (car lengths) */
export const SIDE_GAP_CAR_LENGTHS = 1.5;

/** Danger distance thresholds for radar colors (meters) */
export const RADAR_DANGER_DISTANCE_M = 8;
export const RADAR_WARNING_DISTANCE_M = 20;

/** Default track width (meters) */
export const DEFAULT_TRACK_WIDTH_M = 14;

/** iRacing CarLeftRight enum values */
export const CarLeftRight = {
  Off: 0,
  Clear: 1,
  CarLeft: 2,
  CarRight: 3,
  ThreeWide: 4,
  ThreeWideLeft: 5,
  ThreeWideRight: 6,
} as const;
