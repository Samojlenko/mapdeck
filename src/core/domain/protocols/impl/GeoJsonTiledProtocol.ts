import {
    LayerRoles,
    isGeoJsonConfig,
    makeRenderDescriptor,
    type LayerAdapter,
    type LayerConfig,
    type LayerRole,
    type MapLayer,
    type GeoJsonLayerConfig,
} from "@core/framework/types";
import type { LayerAdapterFactory } from "@core/domain/adapters/layer/LayerAdapterFactory";
import type { Protocol } from "../Protocol";

export class GeoJsonTiledProtocol implements Protocol {
    readonly id = "geojson-tiled";
    readonly label = "GeoJSON Tiled";
    readonly roles = [LayerRoles.GEOJSON];

    constructor(private readonly layerAdapterFactory: LayerAdapterFactory) {}

    createMapLayer(
        _role: LayerRole,
        sourceUrl: string,
        config: LayerConfig,
    ): MapLayer {
        const geoJsonConfig: GeoJsonLayerConfig = isGeoJsonConfig(config)
            ? {
                  ...config,
                  role: LayerRoles.GEOJSON,
              }
            : {
                  role: LayerRoles.GEOJSON,
                  layerType: "fill",
              };

        return {
            id: sourceUrl,
            category: "render",
            label: sourceUrl,
            render: makeRenderDescriptor(
                LayerRoles.GEOJSON,
                sourceUrl,
                geoJsonConfig,
            ),
        };
    }

    getAdapter(_role: LayerRole): LayerAdapter {
        return this.layerAdapterFactory.get(LayerRoles.GEOJSON);
    }
}
