/**
 * Volume formatting and TIN-based volume calculation utilities.
 */

import type { MeasurementPoint3D } from "@core/framework/types/data/measurement";
import type { Triangle } from "@core/shared/geo";
import { triangleArea } from "@core/shared/geo/spatial";

/**
 * Format volume in cubic meters to human-readable string.
 */
export function formatVolume(cubicMeters: number): string {
    if (cubicMeters >= 1_000_000) {
        return `${(cubicMeters / 1_000_000).toFixed(3)} km³`;
    }
    if (cubicMeters >= 1) {
        return `${cubicMeters.toFixed(2)} m³`;
    }
    if (cubicMeters >= 0.001) {
        return `${(cubicMeters * 1000).toFixed(1)} litres`;
    }
    return `${(cubicMeters * 1_000_000).toFixed(1)} ml`;
}

/**
 * Calculate volume from TIN triangles and a base Z level.
 *
 * For each triangle, the volume is: area_2d * avg_height_above_base
 */
export function calculateVolumeFromTin(
    points: MeasurementPoint3D[],
    triangles: Triangle[],
    baseZ: number,
): {
    volumeCubicMeters: number;
    surfaceAreaSquareMeters: number;
    triangleCount: number;
} {
    let totalVolume = 0;
    let totalSurfaceArea = 0;

    for (const tri of triangles) {
        const a = points[tri.a]!;
        const b = points[tri.b]!;
        const c = points[tri.c]!;

        const area2D = triangleArea(a, b, c);
        const avgHeight = (a.z + b.z + c.z) / 3 - baseZ;

        if (avgHeight > 0) {
            totalVolume += area2D * avgHeight;
        }

        totalSurfaceArea += area2D;
    }

    return {
        volumeCubicMeters: totalVolume,
        surfaceAreaSquareMeters: totalSurfaceArea,
        triangleCount: triangles.length,
    };
}
