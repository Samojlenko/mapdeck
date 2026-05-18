/**
 * Configuration for a data source adapter.
 * Kept minimal — only what's needed to identify and initialize an adapter.
 */
export interface DataSourceConfig {
    /** Unique identifier for the source (e.g., "stac-catalog") */
    id: string;
    /** Type of data source (e.g., 'stac', 'geojson', 'wms') - used as factory key */
    type: string;
    /** Display name for the source */
    name: string;
    /** Source URL or reference */
    url: string;
    /** Additional configuration for the adapter */
    config?: Record<string, unknown>;
}
