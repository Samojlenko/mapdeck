import {
    LayerRoles,
    isPointCloudConfig,
    makeRenderDescriptor,
    type LayerAdapter,
    type LayerConfig,
    type LayerRole,
    type MapLayer,
    type PointCloudLayerConfig,
} from "@core/framework/types";
import type { LayerAdapterFactory } from "@core/domain/adapters/layer/LayerAdapterFactory";
import type { DeckOverlayManager } from "@core/domain/overlay";
import type { Protocol, ProtocolFeatureInfoParams } from "../Protocol";
import { EMPTY_FEATURE_INFO } from "../Protocol";

export class CopcProtocol implements Protocol {
    readonly id = "copc";
    readonly label: string;
    readonly roles = [LayerRoles.POINT_CLOUD];

    constructor(
        private readonly layerAdapterFactory: LayerAdapterFactory,
        private readonly overlayManager: DeckOverlayManager,
        label: string,
    ) {
        this.label = label;
    }

    createMapLayer(
        _role: LayerRole,
        sourceUrl: string,
        config: LayerConfig,
    ): MapLayer {
        const pointCloudConfig: PointCloudLayerConfig = isPointCloudConfig(
            config,
        )
            ? {
                  ...config,
                  role: LayerRoles.POINT_CLOUD,
              }
            : {
                  role: LayerRoles.POINT_CLOUD,
              };

        return {
            id: sourceUrl,
            category: "render",
            label: sourceUrl,
            render: makeRenderDescriptor(
                LayerRoles.POINT_CLOUD,
                sourceUrl,
                pointCloudConfig,
            ),
        };
    }

    getAdapter(_role: LayerRole): LayerAdapter {
        return this.layerAdapterFactory.get(LayerRoles.POINT_CLOUD);
    }

    async getFeatureInfo(
        params: ProtocolFeatureInfoParams,
    ): Promise<Record<string, unknown>> {
        const results = this.overlayManager.pickObjects(
            params.screenX,
            params.screenY,
            5,
        );

        if (results.length === 0) {
            return EMPTY_FEATURE_INFO;
        }

        const info = results[0]!;
        const obj = info.object as Record<string, unknown> | undefined;

        return (obj?.properties as Record<string, unknown>) ?? {};
    }
}
