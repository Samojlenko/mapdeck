/**
 * WMS-specific types for layer grouping and configuration.
 * Pure contracts — no business logic.
 */

/**
 * Common WMS request parameters.
 * All fields are optional — used to override defaults when building URLs.
 */
export interface WmsOptions {
    /** WMS version (default: 1.3.0) */
    version?: string;
    /** Image format (default: image/png) */
    format?: string;
    /** Comma-separated style names */
    styles?: string;
    /** Layer opacity (0.0 to 1.0) */
    opacity?: number;
}

/**
 * Key used to determine if two WMS layers can be grouped together.
 * Layers must match on all fields to share a group.
 */
export interface WmsGroupKey {
    baseUrl: string;
    format: string;
    version: string;
    opacity: number;
}

/**
 * Configuration for a single WMS group — the output of WmsGrouper.
 */
export interface WmsGroupConfig {
    groupId: string;
    nodeIds: string[];
    baseUrl: string;
    format: string;
    version: string;
    opacity: number;
}

/**
 * Parsed WMS URL with clean base URL and extracted query parameters.
 */
export interface ParsedWmsUrl {
    /** Clean endpoint URL without query parameters */
    baseUrl: string;
    /** WMS layer names from LAYERS param */
    layers: string;
    /** WMS styles from STYLES param */
    styles: string;
    /** WMS version from VERSION param */
    version?: string;
    /** Spatial reference system from SRS param (WMS 1.1) */
    srs?: string;
    /** Spatial reference system from CRS param (WMS 1.3) */
    crs?: string;
}
