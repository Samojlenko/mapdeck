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

/** Protocol implementation for XYZ raster tile URL templates. */
export class XyzProtocol implements Protocol {
    readonly id = "xyz";
    readonly label = "XYZ tiles";
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
                  type: "xyz",
                  url: sourceUrl,
              }
            : {
                  role: LayerRoles.RASTER,
                  type: "xyz",
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
