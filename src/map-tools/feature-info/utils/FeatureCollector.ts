import type { RootStore } from "@core/framework/store";
import { logger } from "@core/shared/diagnostics/logger";
import { EMPTY_FEATURE_INFO } from "@core/domain/protocols";
import type {
    Feature,
    FeatureGroup,
    CollectParams,
    CollectResult,
} from "../types";

const NOT_SUPPORTED_ROLES = new Set(["raster"]);

export class FeatureCollector {
    constructor(private readonly rootStore: RootStore) {}

    async collect(
        params: CollectParams,
        onUpdate: (result: CollectResult) => void,
    ): Promise<CollectResult> {
        onUpdate({ groups: [], loading: true });

        if (params.signal?.aborted) {
            return { groups: [], loading: false };
        }

        const features: Feature[] = [];

        for (const node of params.visibleLayers) {
            if (params.signal?.aborted) break;
            this.collectNode(node, params, features);
        }

        if (params.signal?.aborted) {
            return { groups: [], loading: false };
        }

        const finalResult: CollectResult = {
            groups: this.groupFeatures(features),
            loading: false,
        };

        onUpdate(finalResult);
        return finalResult;
    }

    private collectNode(
        node: CollectParams["visibleLayers"][number],
        params: CollectParams,
        features: Feature[],
    ): void {
        const mapLayer = node.capabilities.mapLayer;
        if (!mapLayer) return;

        const role = mapLayer.render.role;
        const protocol = this.rootStore.protocolRegistry.getByRole(role);

        if (!protocol?.getFeatureInfo) {
            this.addPlaceholder(node, role, params, features);
            return;
        }

        this.queryProtocol(node, protocol, params, features);
    }

    private addPlaceholder(
        node: CollectParams["visibleLayers"][number],
        role: string,
        params: CollectParams,
        features: Feature[],
    ): void {
        if (!NOT_SUPPORTED_ROLES.has(role)) return;

        features.push({
            id: `${node.id}_placeholder`,
            layerId: node.id,
            layerName: node.title,
            sourceType: "wms",
            attributes: {
                info: params.xyzNotAvailableMessage ?? "",
            },
            groupId: node.id,
        });
    }

    private async queryProtocol(
        node: CollectParams["visibleLayers"][number],
        protocol: NonNullable<ReturnType<RootStore["protocolRegistry"]["getByRole"]>>,
        params: CollectParams,
        features: Feature[],
    ): Promise<void> {
        const getFeatureInfo = protocol.getFeatureInfo;
        if (!getFeatureInfo) return;

        const mapLayer = node.capabilities.mapLayer;
        if (!mapLayer) return;

        const lngLat = params.map.unproject([
            params.screenX,
            params.screenY,
        ]);

        try {
            const baseParams = {
                layerId: node.id,
                descriptor: mapLayer.render,
                screenX: params.screenX,
                screenY: params.screenY,
                lng: lngLat.lng,
                lat: lngLat.lat,
                map: params.map,
            };
            const attributes = await getFeatureInfo(
                params.signal
                    ? { ...baseParams, signal: params.signal }
                    : baseParams,
            );

            if (
                Object.keys(attributes).length === 0 ||
                attributes === EMPTY_FEATURE_INFO
            )
                return;

            features.push({
                id: `${node.id}_${protocol.id}`,
                layerId: node.id,
                layerName: node.title,
                sourceType: "vector",
                attributes,
                groupId: node.id,
            });
        } catch (error) {
            logger.error(
                `FeatureCollector: getFeatureInfo failed for "${node.id}"`,
                error,
            );
        }
    }

    private groupFeatures(features: Feature[]): FeatureGroup[] {
        return features.map((feature) => ({
            layerId: feature.layerId,
            layerName: feature.layerName,
            sourceType: feature.sourceType,
            features: [feature],
            loading: false,
        }));
    }
}
