/**
 * WMS parameter preparation — pure functions that build typed parameter dicts.
 */

export interface WmsFeatureInfoOptions {
    layers: string;
    version?: string;
    width: number;
    height: number;
    screenX: number;
    screenY: number;
    bbox: { west: number; south: number; east: number; north: number };
    infoFormat?: string;
    featureCount?: number;
}

/**
 * Prepare WMS GetFeatureInfo query parameters.
 * Returns a flat parameter dictionary ready for buildUrl().
 */
export function prepareWmsFeatureInfoParams(
    options: WmsFeatureInfoOptions,
): Record<string, string> {
    const version = options.version ?? "1.3.0";
    const p: Record<string, string> = {
        SERVICE: "WMS",
        VERSION: version,
        REQUEST: "GetFeatureInfo",
        LAYERS: options.layers,
        QUERY_LAYERS: options.layers,
        STYLES: "",
        FORMAT: "image/png",
        TRANSPARENT: "TRUE",
        INFO_FORMAT: options.infoFormat ?? "application/json",
        FEATURE_COUNT: String(options.featureCount ?? 50),
        WIDTH: String(options.width),
        HEIGHT: String(options.height),
    };

    const usesSrs = version.startsWith("1.1") || version.startsWith("1.0");

    if (usesSrs) {
        p["X"] = String(options.screenX);
        p["Y"] = String(options.screenY);
        p["SRS"] = "EPSG:4326";
        p["BBOX"] = `${options.bbox.west},${options.bbox.south},${options.bbox.east},${options.bbox.north}`;
    } else {
        p["I"] = String(options.screenX);
        p["J"] = String(options.screenY);
        p["CRS"] = "EPSG:4326";
        p["BBOX"] = `${options.bbox.south},${options.bbox.west},${options.bbox.north},${options.bbox.east}`;
    }

    return p;
}
