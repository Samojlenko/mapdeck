/**
 * WFS-specific types for feature fetching and pagination.
 * Pure contracts — no business logic.
 */

export interface WfsFeature {
    /** Feature ID from WFS response */
    id: string;
    /** Feature properties as key-value pairs */
    properties: Record<string, unknown>;
    /** GeoJSON geometry object (may be null) */
    geometry: Record<string, unknown> | null;
}

export interface WfsResponse {
    /** Loaded features (page) */
    features: WfsFeature[];
    /** Total number of features available (from WFS response) */
    totalFeatures: number;
}

/**
 * Parsed WFS URL with clean base URL and extracted query parameters.
 */
export interface ParsedWfsUrl {
    /** Clean endpoint URL without query parameters */
    baseUrl: string;
    /** WFS version from VERSION param */
    version?: string;
    /** Type names from TYPENAMES param */
    typeNames?: string;
    /** Output format from OUTPUTFORMAT param */
    outputFormat?: string;
}

export interface WfsRequestParams {
    /** WFS endpoint URL (should already contain typeName and other required params) */
    url: string;
    /** WFS version to use (default: 2.0.0) */
    version?: string | undefined;
    /** Number of features to return (pagination) */
    maxFeatures?: number | undefined;
    /** Starting index for pagination (0-based) */
    startIndex?: number | undefined;
    /** Optional CQL filter expression */
    cqlFilter?: string | undefined;
    /** Optional SRS name */
    srsName?: string | undefined;
    /** Optional sort column */
    sortBy?: string | undefined;
    /** Optional sort direction */
    sortDirection?: "asc" | "desc" | undefined;
    /** Bounding box filter (minLng,minLat,maxLng,maxLat) */
    bbox?: string | undefined;
    /** Additional custom parameters */
    extraParams?: Record<string, string> | undefined;
}
