/**
 * Core geospatial type definitions.
 * Pure contracts — no business logic.
 */

/**
 * Bounding box with named fields.
 * Construct with a 4-element [w, s, e, n] or 6-element [w, s, minZ, e, n, maxZ] tuple.
 */
export class Bbox {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
    readonly minZ: number | undefined;
    readonly maxZ: number | undefined;

    constructor(tuple: readonly number[]) {
        if (tuple.length < 4) {
            throw new Error(
                `Bbox requires at least 4 elements, got ${tuple.length}`,
            );
        }
        if (tuple.length === 6) {
            this.west = tuple[0]!;
            this.south = tuple[1]!;
            this.minZ = tuple[2]!;
            this.east = tuple[3]!;
            this.north = tuple[4]!;
            this.maxZ = tuple[5]!;
        } else {
            this.west = tuple[0]!;
            this.south = tuple[1]!;
            this.east = tuple[2]!;
            this.north = tuple[3]!;
            this.minZ = undefined;
            this.maxZ = undefined;
        }
    }

    /** True if this bbox has Z dimension. */
    get is3D(): boolean {
        return this.minZ !== undefined && this.maxZ !== undefined;
    }

    /** Center point as [longitude, latitude, z]. Z is 0 for 2D bbox. */
    get center(): [number, number, number] {
        const z = this.is3D ? (this.minZ! + this.maxZ!) / 2 : 0;
        return [(this.west + this.east) / 2, (this.south + this.north) / 2, z];
    }

    /** 2D bounds as [[west, south], [east, north]] for map libraries. */
    get bounds(): [[number, number], [number, number]] {
        return [
            [this.west, this.south],
            [this.east, this.north],
        ];
    }

    /** 6-element tuple [west, south, minZ, east, north, maxZ] or null if 2D. */
    get bounds3D(): [number, number, number, number, number, number] | null {
        if (!this.is3D) return null;
        return [
            this.west,
            this.south,
            this.minZ!,
            this.east,
            this.north,
            this.maxZ!,
        ];
    }
}

/** 2D point: [longitude, latitude] */
export type Point2D = [number, number];

/** GeoJSON geometry object (minimal representation) */
export interface GeoJSONGeometry {
    type: string;
    coordinates?: unknown[];
    geometries?: GeoJSONGeometry[];
}
