/**
 * Types for 3D Ruler tool
 */

import type { MeasurementPoint3D } from "@core/framework/types";

// Re-export MeasurementPoint3D as Point3D for backward compatibility
export type { MeasurementPoint3D as Point3D } from "@core/framework/types";

/**
 * Segment between two points with calculated distances
 */
export interface SegmentDistance3D {
    from: MeasurementPoint3D;
    to: MeasurementPoint3D;
    distanceMeters: number; // full 3D Euclidean distance
    horizontalDistance: number; // horizontal distance in meters
    verticalDistance: number; // vertical distance in meters
}
