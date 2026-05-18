/**
 * Grid + Trapezoid volume calculation — orchestrator.
 *
 * Base surface is interpolated from polygon boundary vertices via TIN,
 * top surface is interpolated from cloud points via spatial-hashed IDW.
 */

import type { MeasurementPoint3D } from "@core/framework/types/data/measurement";
import {
    isPointInPolygon,
    isPointInBoundingBox,
    polygonBoundingBox,
} from "@core/shared/geo";
import { SpatialHash } from "./spatialHash";
import { BaseSurfaceInterpolator } from "./tinInterpolator";
import { interpolateSurfaceZ, type InterpolationConfig } from "./idw";

export interface DrapedSurfaceConfig {
    cellSizeMeters: number;
    searchRadiusMeters: number;
    surfaceNeighborCount: number;
}

const DEFAULT_CONFIG: DrapedSurfaceConfig = {
    cellSizeMeters: 2.0,
    searchRadiusMeters: 6.0,
    surfaceNeighborCount: 4,
};

interface ZRange {
    min: number;
    max: number;
}

interface CellProcessResult {
    totalVolume: number;
    totalSurfaceArea: number;
    cellsWithData: number;
    baseRange: ZRange;
    surfaceRange: ZRange;
}

interface CellProcessContext {
    spatialHash: SpatialHash;
    baseSurface: BaseSurfaceInterpolator;
    surfaceConfig: InterpolationConfig;
    cellArea: number;
}

function updateZRange(range: ZRange, value: number): ZRange {
    return {
        min: value < range.min ? value : range.min,
        max: value > range.max ? value : range.max,
    };
}

function createEmptyResult(cellSizeMeters: number) {
    return {
        volumeCubicMeters: 0,
        surfaceAreaSquareMeters: 0,
        baseZMin: 0,
        baseZMax: 0,
        surfaceZMin: 0,
        surfaceZMax: 0,
        gridCellCount: 0,
        totalGridCells: 0,
        gridResolution: cellSizeMeters,
    };
}

function buildGridCenters(
    boundary: MeasurementPoint3D[],
    cellSizeMeters: number,
): { centers: { lng: number; lat: number }[]; centerLat: number } {
    const polygon2D: [number, number][] = boundary.map((p) => [p.lng, p.lat]);
    const bbox = polygonBoundingBox(polygon2D);
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const cellSizeDeg =
        cellSizeMeters / (111_320 * Math.cos((centerLat * Math.PI) / 180));

    const centers: { lng: number; lat: number }[] = [];
    for (
        let lng = bbox[0] + cellSizeDeg / 2;
        lng <= bbox[2];
        lng += cellSizeDeg
    ) {
        for (
            let lat = bbox[1] + cellSizeDeg / 2;
            lat <= bbox[3];
            lat += cellSizeDeg
        ) {
            // Fast O(1) bounding box pre-check before O(V) ray-casting
            if (
                !isPointInBoundingBox([lng, lat], bbox) ||
                !isPointInPolygon([lng, lat], polygon2D)
            ) {
                continue;
            }
            centers.push({ lng, lat });
        }
    }

    return { centers, centerLat };
}

function processAllCells(
    gridCenters: { lng: number; lat: number }[],
    ctx: CellProcessContext,
): CellProcessResult {
    let totalVolume = 0;
    let totalSurfaceArea = 0;
    let cellsWithData = 0;
    let baseRange: ZRange = { min: Infinity, max: -Infinity };
    let surfaceRange: ZRange = { min: Infinity, max: -Infinity };

    for (const center of gridCenters) {
        const surfaceZ = interpolateSurfaceZ(
            center.lng,
            center.lat,
            ctx.spatialHash,
            ctx.surfaceConfig,
        );
        if (surfaceZ === null) continue;

        const baseZ = ctx.baseSurface.interpolate(center.lng, center.lat);
        cellsWithData++;

        const heightAboveBase = surfaceZ - baseZ;
        if (heightAboveBase > 0) {
            totalVolume += ctx.cellArea * heightAboveBase;
        }
        totalSurfaceArea += ctx.cellArea;
        baseRange = updateZRange(baseRange, baseZ);
        surfaceRange = updateZRange(surfaceRange, surfaceZ);
    }

    return {
        totalVolume,
        totalSurfaceArea,
        cellsWithData,
        baseRange,
        surfaceRange,
    };
}

/**
 * Main Grid + Trapezoid volume calculation.
 */
export function calculateGridTrapezoidVolume(
    boundary: MeasurementPoint3D[],
    cloudPoints: MeasurementPoint3D[],
    config: Partial<DrapedSurfaceConfig> = {},
): {
    volumeCubicMeters: number;
    surfaceAreaSquareMeters: number;
    baseZMin: number;
    baseZMax: number;
    surfaceZMin: number;
    surfaceZMax: number;
    gridCellCount: number;
    totalGridCells: number;
    gridResolution: number;
} {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (boundary.length < 3 || cloudPoints.length === 0) {
        return createEmptyResult(cfg.cellSizeMeters);
    }

    const { centers: gridCenters, centerLat } = buildGridCenters(
        boundary,
        cfg.cellSizeMeters,
    );
    if (gridCenters.length === 0) return createEmptyResult(cfg.cellSizeMeters);

    const spatialHash = new SpatialHash(
        cloudPoints,
        cfg.searchRadiusMeters,
        centerLat,
    );
    const baseSurface = new BaseSurfaceInterpolator(boundary);

    const cellArea = cfg.cellSizeMeters * cfg.cellSizeMeters;
    const surfaceConfig: InterpolationConfig = {
        searchRadiusMeters: cfg.searchRadiusMeters,
        neighborCount: cfg.surfaceNeighborCount,
    };

    const ctx: CellProcessContext = {
        spatialHash,
        baseSurface,
        surfaceConfig,
        cellArea,
    };
    const result = processAllCells(gridCenters, ctx);

    return {
        volumeCubicMeters: result.totalVolume,
        surfaceAreaSquareMeters: result.totalSurfaceArea,
        baseZMin: result.baseRange.min === Infinity ? 0 : result.baseRange.min,
        baseZMax: result.baseRange.max === -Infinity ? 0 : result.baseRange.max,
        surfaceZMin:
            result.surfaceRange.min === Infinity ? 0 : result.surfaceRange.min,
        surfaceZMax:
            result.surfaceRange.max === -Infinity ? 0 : result.surfaceRange.max,
        gridCellCount: result.cellsWithData,
        totalGridCells: gridCenters.length,
        gridResolution: cfg.cellSizeMeters,
    };
}
