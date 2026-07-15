/**
 * WFS parameter preparation — pure functions that build typed parameter dicts.
 */

import type { WfsRequestParams } from "@core/framework/types/ogc/wfs";

/** WFS version detection */
export function detectVersion(params: WfsRequestParams): string {
    return params.version ?? "2.0.0";
}

function setPagination(
    p: Record<string, string>,
    version: string,
    params: WfsRequestParams,
): void {
    if (params.startIndex === undefined && params.maxFeatures === undefined) return;

    const key = version.startsWith("2.");
    if (params.startIndex !== undefined) {
        p["STARTINDEX"] = key
            ? String(params.startIndex)
            : String(params.startIndex + 1);
    }
    if (params.maxFeatures !== undefined) {
        p[key ? "COUNT" : "MAXFEATURES"] = String(params.maxFeatures);
    }
}

function setOptional(p: Record<string, string>, params: WfsRequestParams): void {
    if (params.srsName) p["SRSNAME"] = params.srsName;
    if (params.cqlFilter) p["CQL_FILTER"] = params.cqlFilter;
    if (params.bbox) p["BBOX"] = params.bbox;
    if (params.extraParams) {
        for (const [key, value] of Object.entries(params.extraParams)) {
            p[key] = value;
        }
    }
}

/**
 * Prepare WFS GetFeature query parameters.
 * Returns a flat parameter dictionary ready for buildUrl().
 */
export function prepareWfsParams(
    params: WfsRequestParams,
): Record<string, string> {
    const version = detectVersion(params);
    const p: Record<string, string> = {
        SERVICE: "WFS",
        VERSION: version,
        REQUEST: "GetFeature",
        OUTPUTFORMAT: "application/json",
    };

    setPagination(p, version, params);
    setOptional(p, params);

    if (params.sortBy) {
        p["SORTBY"] =
            params.sortDirection === "desc"
                ? `${params.sortBy} D`
                : `${params.sortBy} A`;
    }

    return p;
}
