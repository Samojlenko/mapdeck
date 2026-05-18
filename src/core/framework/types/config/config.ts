export interface BaseMapConfig {
    id: string;
    name: string;
    url: string;
    attribution?: string;
    maxZoom?: number;
    minZoom?: number;
}

export interface BaseMapSettings {
    active_basemap_id: string;
    available_basemaps: BaseMapConfig[];
}
