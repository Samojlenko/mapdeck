import maplibregl from "maplibre-gl";
import type { BaseMapConfig } from "@core/framework/types";

export const basemapAsRasterSource = (
    basemap: BaseMapConfig,
): maplibregl.RasterSourceSpecification => ({
    type: "raster",
    tiles: [basemap.url],
    tileSize: 256,
    attribution: basemap.attribution || "",
    minzoom: basemap.minZoom || 0,
    maxzoom: basemap.maxZoom || 22,
});

export const updateBasemap = (
    map: maplibregl.Map,
    basemap: BaseMapConfig | undefined,
    basemap_id: string = "basemap",
): void => {
    // Always remove the old basemap layer if it exists
    if (map.getSource(basemap_id)) {
        map.removeLayer(basemap_id);
        map.removeSource(basemap_id);
    }

    if (!basemap) return;

    const source = basemapAsRasterSource(basemap);
    const style = map.getStyle();
    const layerIds = style.layers?.map((layer) => layer.id) || [];

    let beforeId: string | undefined = undefined;
    for (const layerId of layerIds) {
        if (layerId !== basemap_id) {
            beforeId = layerId;
            break;
        }
    }

    map.addSource(basemap_id, source);
    map.addLayer(
        {
            id: basemap_id,
            type: "raster",
            source: basemap_id,
        },
        beforeId,
    );
};
