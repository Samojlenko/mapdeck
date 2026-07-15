/**
 * Pure WMS URL utility functions.
 * No side effects — only URL parsing and construction.
 */

import type { ParsedWmsUrl, WmsOptions } from "@core/framework/types/ogc/wms";
import { parseUrl } from "../url";

/**
 * Parse a WMS URL into its components.
 * Extracts the clean base URL, LAYERS, STYLES, VERSION, SRS, and CRS.
 */
export function parseWmsUrl(url: string): ParsedWmsUrl {
    const { baseUrl, params } = parseUrl(url);
    const result: ParsedWmsUrl = {
        baseUrl,
        layers: params["LAYERS"] ?? "",
        styles: params["STYLES"] ?? "",
    };
    if (params["VERSION"]) result.version = params["VERSION"];
    if (params["SRS"]) result.srs = params["SRS"];
    if (params["CRS"]) result.crs = params["CRS"];
    return result;
}

/**
 * Resolve WMS layer name with fallback chain:
 * 1. LAYERS param extracted from full GetMap URL (static STAC catalogs)
 * 2. configLayers — set from wms:layers asset field (WMS Extension) or explicit config
 * 3. ""  — empty string fallback
 */
export function getWmsLayerName(url: string, configLayers?: string): string {
    const { layers } = parseWmsUrl(url);
    if (layers) return layers;
    return configLayers ?? "";
}

/**
 * Build a WMS GetMap tile URL for a group of layers.
 */
export function buildWmsTileUrl(
    baseUrl: string,
    layers: string,
    options: WmsOptions = {},
): string {
    const base = parseWmsUrl(baseUrl).baseUrl;
    const version = options.version ?? "1.3.0";
    const format = options.format ?? "image/png";
    const styles = options.styles ?? "";
    const q = [
        `SERVICE=WMS`,
        `VERSION=${version}`,
        `REQUEST=GetMap`,
        `LAYERS=${encodeURIComponent(layers)}`,
        `STYLES=${encodeURIComponent(styles)}`,
        `FORMAT=${encodeURIComponent(format)}`,
        `TRANSPARENT=TRUE`,
        `SRS=EPSG:3857`,
        `CRS=EPSG:3857`,
        `BBOX={bbox-epsg-3857}`,
        `WIDTH=256`,
        `HEIGHT=256`,
    ];
    return `${base}?${q.join("&")}`;
}


