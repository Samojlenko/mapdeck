/**
 * Pure WFS URL building and parsing functions.
 * No side effects — only URL construction and parsing.
 */

import type { ParsedWfsUrl, WfsRequestParams } from "@core/framework/types/ogc/wfs";
import { buildUrl, parseUrl } from "../url";
import { prepareWfsParams } from "./params";

/**
 * Build WFS GetFeature URL.
 */
export function buildWfsUrl(params: WfsRequestParams): string {
    const { url } = params;

    try {
        new URL(url);
    } catch {
        throw new Error(
            `Invalid WFS endpoint URL: "${url}". Ensure the URL is absolute and properly encoded.`,
        );
    }

    return buildUrl(url, prepareWfsParams(params));
}

/**
 * Parse a WFS URL into its components.
 * Extracts the clean base URL, VERSION, TYPENAMES, and OUTPUTFORMAT.
 */
export function parseWfsUrl(url: string): ParsedWfsUrl {
    const { baseUrl, params } = parseUrl(url);
    const result: ParsedWfsUrl = { baseUrl };
    if (params["VERSION"]) result.version = params["VERSION"];
    if (params["TYPENAMES"]) result.typeNames = params["TYPENAMES"];
    if (params["OUTPUTFORMAT"]) result.outputFormat = params["OUTPUTFORMAT"];
    return result;
}
