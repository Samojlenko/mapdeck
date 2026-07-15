import {
    LayerRoles,
    type LayerAdapter,
    type LayerRole,
} from "@core/framework/types";
import type { RootStore } from "@core/framework/store";
import { logger } from "@core/shared/diagnostics/logger";
import type { ProtocolRegistry } from "./ProtocolRegistry";
import type { LayerAdapterFactory } from "@core/domain/adapters/layer/LayerAdapterFactory";
import type { DeckOverlayManager } from "@core/domain/overlay";
import { RasterAdapter } from "@core/domain/adapters/layer/impl/RasterAdapter";
import { VectorAdapter } from "@core/domain/adapters/layer/impl/VectorAdapter";
import { PointCloudAdapter } from "@core/domain/adapters/layer/impl/PointCloudAdapter";
import { GeoJsonAdapter } from "@core/domain/adapters/layer/impl/GeoJsonAdapter";
import { registerDefaultLayerConfigs } from "@core/domain/adapters/layer/createDefaultLayerConfig";
import { XyzProtocol } from "./impl/XyzProtocol";
import { WmsProtocol } from "./impl/wms";
import { CogProtocol } from "./impl/CogProtocol";
import { VectorTileProtocol } from "./impl/VectorTileProtocol";
import { GeoJsonTiledProtocol } from "./impl/GeoJsonTiledProtocol";
import { CopcProtocol } from "./impl/CopcProtocol";
import { WfsProtocol } from "./impl/wfs";
import { OgcFeaturesProtocol } from "./impl/ogc-features";

const ADAPTERS: [LayerRole, LayerAdapter][] = [
    [LayerRoles.RASTER, new RasterAdapter()],
    [LayerRoles.VECTOR, new VectorAdapter()],
    [LayerRoles.POINT_CLOUD, new PointCloudAdapter()],
    [LayerRoles.GEOJSON, new GeoJsonAdapter()],
];

export function registerProtocols(rootStore: RootStore): void {
    try {
        registerDefaultLayerConfigs(rootStore.layerConfigRegistry);

        for (const [role, adapter] of ADAPTERS) {
            rootStore.layerAdapterFactory.register(role, adapter);
        }

        const factory = rootStore.layerAdapterFactory;
        const labels = rootStore.localeStore.t("protocols");
        const registry = rootStore.protocolRegistry;

        registerAll(registry, factory, rootStore.mapStore.overlayManager, labels);
    } catch (error) {
        logger.error("Failed to register protocols:", error);
        throw error;
    }
}

function registerAll(
    registry: ProtocolRegistry,
    factory: LayerAdapterFactory,
    overlayManager: DeckOverlayManager,
    labels: Record<string, string | undefined>,
): void {
    registry.register(new XyzProtocol(factory, labels["xyz"] ?? "XYZ tiles"));
    registry.register(new WmsProtocol(factory, labels["wms"] ?? "Web Map Service"));
    registry.register(new CogProtocol(factory, labels["cog"] ?? "Cloud Optimized GeoTIFF"));
    registry.register(new VectorTileProtocol(factory, labels["vector-tile"] ?? "Vector Tile"));
    registry.register(new GeoJsonTiledProtocol(factory, labels["geojson-tiled"] ?? "GeoJSON Tiled"));
    registry.register(new CopcProtocol(factory, overlayManager, labels["copc"] ?? "Cloud Optimized Point Cloud"));
    registry.register(new WfsProtocol(factory, labels["wfs"] ?? "Web Feature Service"));
    registry.register(new OgcFeaturesProtocol(factory, labels["ogc-features"] ?? "OGC API Features"));
}
