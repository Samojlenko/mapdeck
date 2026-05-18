/**
 * IDW (Inverse Distance Weighted) surface Z interpolation.
 */

import type { MeasurementPoint3D } from "@core/framework/types/data/measurement";
import type { SpatialHash } from "./spatialHash";
import distance from "@turf/distance";
import { point } from "@turf/helpers";

export interface InterpolationConfig {
    searchRadiusMeters: number;
    neighborCount: number;
}

/**
 * Interpolate surface Z at a given point using IDW from nearby cloud points.
 */
export function interpolateSurfaceZ(
    lng: number,
    lat: number,
    spatialHash: SpatialHash,
    config: InterpolationConfig,
): number | null {
    const nearby = spatialHash.query(lng, lat, config.searchRadiusMeters);
    if (nearby.length === 0) return null;

    const dists = nearby.map((cp: MeasurementPoint3D) => ({
        z: cp.z,
        dist: distance(point([lng, lat]), point([cp.lng, cp.lat]), {
            units: "meters",
        }),
    }));

    dists.sort((a: { dist: number }, b: { dist: number }) => a.dist - b.dist);
    const neighbors = dists.slice(0, config.neighborCount);

    let sumWeight = 0;
    let sumZ = 0;
    for (const n of neighbors) {
        const weight = 1 / (n.dist * n.dist + 0.001);
        sumWeight += weight;
        sumZ += n.z * weight;
    }

    return sumZ / sumWeight;
}
