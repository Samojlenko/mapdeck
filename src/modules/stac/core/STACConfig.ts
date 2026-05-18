export interface STACConfig {
    /** STAC catalog URL (required) */
    url: string;

    /** Base URL for relative links (optional) */
    baseUrl?: string;

    /** Request timeout in milliseconds (optional, default: 10000) */
    timeout?: number;

    /** Additional HTTP headers (optional) */
    headers?: Record<string, string>;
}

export const DEFAULT_STAC_CONFIG: STACConfig = {
    url: "./catalog.json",
    baseUrl: "",
    timeout: 10000,
    headers: {},
};
