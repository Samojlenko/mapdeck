/**
 * TIN-based base surface interpolator from boundary vertices.
 */

import type { MeasurementPoint3D } from "@core/framework/types/data/measurement";
import {
    delaunayTriangulate,
    type PointXY,
    type Triangle,
} from "@core/shared/geo";

export class BaseSurfaceInterpolator {
    private vertices: PointXY[];
    private zValues: number[];
    private triangles: Triangle[];
    private fallbackZ: number;

    constructor(boundary: MeasurementPoint3D[]) {
        this.vertices = boundary.map((p) => ({ x: p.lng, y: p.lat }));
        this.zValues = boundary.map((p) => p.z);
        this.triangles = delaunayTriangulate(this.vertices);
        this.fallbackZ = this.zValues.length > 0 ? this.zValues[0]! : 0;
    }

    interpolate(lng: number, lat: number): number {
        const pt = { x: lng, y: lat };

        for (const tri of this.triangles) {
            const z = this.tryBarycentric(pt, tri);
            if (z !== null) return z;
        }

        return this.fallbackZ;
    }

    private tryBarycentric(pt: PointXY, tri: Triangle): number | null {
        const a = this.vertices[tri.a]!;
        const b = this.vertices[tri.b]!;
        const c = this.vertices[tri.c]!;

        const denom = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        if (Math.abs(denom) < 1e-12) return null;

        const w1 =
            ((b.y - c.y) * (pt.x - c.x) + (c.x - b.x) * (pt.y - c.y)) / denom;
        const w2 =
            ((c.y - a.y) * (pt.x - c.x) + (a.x - c.x) * (pt.y - c.y)) / denom;
        const w3 = 1 - w1 - w2;

        if (w1 < -0.001 || w2 < -0.001 || w3 < -0.001) return null;

        return (
            w1 * this.zValues[tri.a]! +
            w2 * this.zValues[tri.b]! +
            w3 * this.zValues[tri.c]!
        );
    }
}
