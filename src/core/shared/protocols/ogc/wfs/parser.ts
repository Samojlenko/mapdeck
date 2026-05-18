/**
 * Pure WFS GeoJSON response parser.
 * No side effects — only data transformation.
 */

import type { WfsFeature, WfsResponse } from "@core/framework/types/ogc/wfs";

/**
 * Parse GeoJSON response into WfsResponse.
 */
export function parseGeoJsonResponse(
    json: unknown,
    requestedCount?: number,
): WfsResponse {
    if (!json || typeof json !== "object") {
        return { features: [], totalFeatures: 0 };
    }

    const data = json as Record<string, unknown>;
    const features = parseGeoJsonFeatures(data);

    let totalFeatures = features.length;
    if (data.numberMatched !== undefined) {
        const parsed = Number(data.numberMatched);
        if (!isNaN(parsed)) {
            totalFeatures = parsed;
        }
    } else if (
        requestedCount !== undefined &&
        features.length >= requestedCount
    ) {
        totalFeatures = features.length + 1;
    }

    return { features, totalFeatures };
}

/**
 * Extract features from GeoJSON FeatureCollection.
 */
export function parseGeoJsonFeatures(
    data: Record<string, unknown>,
): WfsFeature[] {
    if (!Array.isArray(data.features)) return [];

    const features: WfsFeature[] = [];
    for (const feature of data.features) {
        const parsed = parseFeature(feature);
        if (parsed) {
            features.push(parsed);
        }
    }
    return features;
}

export function parseFeature(feature: unknown): WfsFeature | null {
    if (!feature || typeof feature !== "object") return null;

    const f = feature as Record<string, unknown>;

    return {
        id: f.id !== undefined && f.id !== null ? String(f.id) : "",
        properties: parseProperties(f.properties),
        geometry: parseGeometry(f.geometry),
    };
}

function parseProperties(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
}

function parseGeometry(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : null;
}
