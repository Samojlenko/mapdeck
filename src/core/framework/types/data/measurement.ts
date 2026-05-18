/**
 * Shared types for measurement tools.
 */

/**
 * Point in 3D space with WGS84 coordinates (degrees)
 */
export interface MeasurementPoint3D {
    lng: number; // longitude in degrees (EPSG:4326)
    lat: number; // latitude in degrees (EPSG:4326)
    z: number; // elevation in meters
    layerId?: string; // ID of the point cloud layer
    pointIndex?: number; // Index in the point cloud data
    coordinateOrigin?: [number, number, number]; // coordinate origin in WGS84 degrees [lng, lat, 0] from source layer
}

/**
 * Computed measurements for volume measurement (TIN-based).
 */
export interface VolumeMeasurements {
    /** Volume in cubic meters (between TIN surface and base Z) */
    volumeCubicMeters: number;
    /** Surface area of the TIN in square meters */
    surfaceAreaSquareMeters: number;
    /** Base elevation (minimum Z of points inside polygon) */
    baseZ: number;
    /** Maximum Z of points inside polygon */
    maxZ: number;
    /** Number of points inside the polygon */
    pointCount: number;
    /** Number of TIN triangles */
    triangleCount: number;
}
