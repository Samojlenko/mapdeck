import type { StyleSpecification } from "maplibre-gl";

export interface BaseMapConfig {
    id: string;
    name: string;
    /** Maplibre style fragment with sources and layers. */
    style?: StyleSpecification;
    /**
     * URL to an external maplibre style JSON file.
     * When set, the style is fetched from this URL instead of using the inline `style`.
     */
    styleUrl?: string;
    /** Path to a static preview image, relative to the config file location. */
    previewImage?: string;
    /** Optional attribution override; sources may also carry their own attribution. */
    attribution?: string;
}
