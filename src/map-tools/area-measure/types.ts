/**
 * Types for Area Measure tool
 */

import type { MeasurementPoint3D } from "@core/framework/types";

// Re-export MeasurementPoint3D as Point3D for consistency with ruler-3d
export type { MeasurementPoint3D as Point3D } from "@core/framework/types";

/**
 * Segment between two consecutive vertices with edge distance
 */
export interface PolygonEdge {
    from: MeasurementPoint3D;
    to: MeasurementPoint3D;
    distanceMeters: number; // geodesic distance in meters
}

/**
 * Computed measurements for a polygon
 */
export interface AreaMeasurements {
    /** Area in square meters (2D projection) */
    areaSquareMeters: number;
    /** Perimeter in meters (sum of edge distances) */
    perimeterMeters: number;
    /** Individual edges with distances */
    edges: PolygonEdge[];
    /** Number of vertices */
    vertexCount: number;
}
