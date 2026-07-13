import {
    LayerRoles,
    isRasterConfig,
    makeRenderDescriptor,
    type LayerAdapter,
    type LayerConfig,
    type LayerRole,
    type MapLayer,
    type RasterLayerConfig,
} from "@core/framework/types";
import type { LayerAdapterFactory } from "@core/domain/adapters/layer/LayerAdapterFactory";
import type { Protocol } from "../Protocol";

/** Protocol implementation for Cloud Optimized GeoTIFF endpoints. */
export class CogProtocol implements Protocol {
    readonly id = "cog";
    readonly label = "Cloud Optimized GeoTIFF";
    readonly roles = [LayerRoles.RASTER];

    constructor(private readonly layerAdapterFactory: LayerAdapterFactory) {}

    createMapLayer(
        _role: LayerRole,
        sourceUrl: string,
        config: LayerConfig,
    ): MapLayer {
        const rasterConfig: RasterLayerConfig = isRasterConfig(config)
            ? {
                  ...config,
                  role: LayerRoles.RASTER,
                  type: "cog",
                  url: sourceUrl,
              }
            : {
                  role: LayerRoles.RASTER,
                  type: "cog",
                  url: sourceUrl,
              };

        return {
            id: sourceUrl,
            category: "render",
            label: sourceUrl,
            render: makeRenderDescriptor(
                LayerRoles.RASTER,
                sourceUrl,
                rasterConfig,
            ),
        };
    }

    getAdapter(_role: LayerRole): LayerAdapter {
        return this.layerAdapterFactory.get(LayerRoles.RASTER);
    }
}
