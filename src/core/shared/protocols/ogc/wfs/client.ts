/**
 * WFS client — fetch layer with error handling.
 * Depends on pure URL builder and parser.
 */

import type { WfsRequestParams, WfsResponse } from "@core/framework/types/ogc/wfs";
import type { GeoJSONGeometry } from "@core/framework/types/geo";
import { buildWfsUrl } from "./url";
import { parseGeoJsonResponse } from "./parser";
import { bboxFromGeometry } from "@core/shared/geo";
import { logger } from "@core/shared/diagnostics/logger";

/**
 * Fetch features from a WFS endpoint with pagination support.
 */
export async function fetchWfsFeatures(
    params: WfsRequestParams,
    signal?: AbortSignal,
): Promise<WfsResponse> {
    const url = buildWfsUrl(params);

    logger.debug(`WFS request: ${url}`);

    try {
        const fetchInit: RequestInit = signal ? { signal } : {};
        const response = await globalThis.fetch(url, fetchInit);

        if (!response.ok) {
            throw new Error(
                `WFS GetFeature returned ${response.status} ${response.statusText}`,
            );
        }

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
            const text = await response.text();
            try {
                const json = JSON.parse(text);
                return parseGeoJsonResponse(json, params.maxFeatures);
            } catch {
                throw new Error(
                    `WFS response was not JSON (content-type: ${contentType})`,
                );
            }
        }

        const json = await response.json();
        return parseGeoJsonResponse(json, params.maxFeatures);
    } catch (error) {
        logger.error("WFS request failed:", error);
        throw error;
    }
}

/**
 * Fetch a single page of features and return them as flat attribute rows.
 */
export async function fetchWfsPageAsRows(
    params: WfsRequestParams,
    signal?: AbortSignal,
): Promise<{ rows: Record<string, unknown>[]; totalFeatures: number }> {
    const response = await fetchWfsFeatures(params, signal);

    const rows: Record<string, unknown>[] = response.features.map((f) => {
        const row: Record<string, unknown> = {
            _id: f.id,
            ...f.properties,
        };

        const bbox = bboxFromGeometry(
            f.geometry as GeoJSONGeometry | null | undefined,
        );
        if (bbox) {
            row._bbox = bbox;
        }

        return row;
    });

    return { rows, totalFeatures: response.totalFeatures };
}
