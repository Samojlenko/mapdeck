import {
    LayerRoles,
    isVectorConfig,
    makeRenderDescriptor,
    type LayerAdapter,
    type LayerConfig,
    type LayerRole,
    type MapLayer,
    type VectorLayerConfig,
} from "@core/framework/types";
import type { LayerAdapterFactory } from "@core/domain/adapters/layer/LayerAdapterFactory";
import type { Protocol, ProtocolFeatureInfoParams } from "../Protocol";
import { EMPTY_FEATURE_INFO } from "../Protocol";

export class VectorTileProtocol implements Protocol {
    readonly id = "vector-tile";
    readonly label: string;
    readonly roles = [LayerRoles.VECTOR];

    constructor(
        private readonly layerAdapterFactory: LayerAdapterFactory,
        label: string,
    ) {
        this.label = label;
    }

    createMapLayer(
        _role: LayerRole,
        sourceUrl: string,
        config: LayerConfig,
    ): MapLayer {
        const vectorConfig: VectorLayerConfig = isVectorConfig(config)
            ? {
                  ...config,
                  role: LayerRoles.VECTOR,
              }
            : {
                  role: LayerRoles.VECTOR,
                  layerType: "fill",
              };

        return {
            id: sourceUrl,
            category: "render",
            label: sourceUrl,
            render: makeRenderDescriptor(
                LayerRoles.VECTOR,
                sourceUrl,
                vectorConfig,
            ),
        };
    }

    getAdapter(_role: LayerRole): LayerAdapter {
        return this.layerAdapterFactory.get(LayerRoles.VECTOR);
    }

    async getFeatureInfo(
        params: ProtocolFeatureInfoParams,
    ): Promise<Record<string, unknown>> {
        const features = params.map.queryRenderedFeatures(
            [params.screenX, params.screenY],
            { layers: [params.layerId] },
        );

        if (features.length === 0) {
            return EMPTY_FEATURE_INFO;
        }

        const feature = features[0]!;
        return (feature.properties ?? {}) as Record<string, unknown>;
    }
}
