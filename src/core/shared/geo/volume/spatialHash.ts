/**
 * Spatial hash for O(1) cloud point lookup.
 */

import type { MeasurementPoint3D } from "@core/framework/types/data/measurement";
import { geodesicDistance } from "@core/shared/geo/spatial";

export class SpatialHash {
    private buckets = new Map<string, MeasurementPoint3D[]>();
    private cellSizeDeg: number;

    constructor(
        points: MeasurementPoint3D[],
        cellSizeMeters: number,
        centerLat: number,
    ) {
        this.cellSizeDeg =
            cellSizeMeters / (111_320 * Math.cos((centerLat * Math.PI) / 180));

        for (const pt of points) {
            const key = `${Math.floor(pt.lng / this.cellSizeDeg)},${Math.floor(pt.lat / this.cellSizeDeg)}`;
            const bucket = this.buckets.get(key);
            if (bucket) {
                bucket.push(pt);
            } else {
                this.buckets.set(key, [pt]);
            }
        }
    }

    query(
        lng: number,
        lat: number,
        radiusMeters: number,
    ): MeasurementPoint3D[] {
        const bx = Math.floor(lng / this.cellSizeDeg);
        const by = Math.floor(lat / this.cellSizeDeg);
        const result: MeasurementPoint3D[] = [];

        this.forEachNeighborBucket(bx, by, (bucket) => {
            for (const pt of bucket) {
                const d = geodesicDistance([lng, lat], [pt.lng, pt.lat]);
                if (d <= radiusMeters) {
                    result.push(pt);
                }
            }
        });

        return result;
    }

    private forEachNeighborBucket(
        bx: number,
        by: number,
        fn: (bucket: MeasurementPoint3D[]) => void,
    ): void {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const bucket = this.buckets.get(`${bx + dx},${by + dy}`);
                if (bucket) fn(bucket);
            }
        }
    }
}
