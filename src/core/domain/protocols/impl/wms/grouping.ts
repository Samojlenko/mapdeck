/**
 * Pure WMS grouping key utilities.
 * No side effects — only key generation and comparison.
 */

import type { WmsGroupKey, RasterLayerConfig } from "@core/framework/types";
import { parseWmsUrl } from "./url";

/**
 * Generate a deterministic group ID from node IDs and the group key.
 */
export function generateGroupId(nodeIds: string[], key: WmsGroupKey): string {
    const hashInput = nodeIds.join(",") + "|" + JSON.stringify(key);
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
        const char = hashInput.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    const suffix = Math.abs(hash).toString(36);
    return `wms-group:${suffix}`;
}

/**
 * Check if two WMS group keys match (all fields equal).
 */
export function keysMatch(a: WmsGroupKey, b: WmsGroupKey): boolean {
    return (
        a.baseUrl === b.baseUrl &&
        a.format === b.format &&
        a.version === b.version &&
        a.opacity === b.opacity
    );
}

/**
 * Extract the WMS group key from a RasterLayerConfig.
 * Returns null if the config is not a WMS type.
 */
export function getWmsGroupKey(config: RasterLayerConfig): WmsGroupKey | null {
    if (config.type !== "wms") return null;

    return {
        baseUrl: parseWmsUrl(config.url).baseUrl,
        format: "image/png",
        version: config.version ?? "1.3.0",
        opacity: config.opacity ?? 1.0,
    };
}
