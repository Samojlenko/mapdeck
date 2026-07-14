import type { RootStore } from "@core/framework/store";
import { logger } from "@core/shared/diagnostics/logger";
import { XyzProtocol } from "./impl/XyzProtocol";
import { WmsProtocol } from "./impl/WmsProtocol";
import { CogProtocol } from "./impl/CogProtocol";
import { VectorTileProtocol } from "./impl/VectorTileProtocol";
import { GeoJsonTiledProtocol } from "./impl/GeoJsonTiledProtocol";
import { CopcProtocol } from "./impl/CopcProtocol";
import { WfsProtocol } from "./impl/WfsProtocol";
import { OgcFeaturesProtocol } from "./impl/OgcFeaturesProtocol";

export function registerProtocols(rootStore: RootStore): void {
    try {
        const factory = rootStore.layerAdapterFactory;

        rootStore.protocolRegistry.register(new XyzProtocol(factory));
        rootStore.protocolRegistry.register(new WmsProtocol(factory));
        rootStore.protocolRegistry.register(new CogProtocol(factory));
        rootStore.protocolRegistry.register(new VectorTileProtocol(factory));
        rootStore.protocolRegistry.register(new GeoJsonTiledProtocol(factory));
        rootStore.protocolRegistry.register(
            new CopcProtocol(factory, rootStore.mapStore.overlayManager),
        );
        rootStore.protocolRegistry.register(new WfsProtocol(factory));
        rootStore.protocolRegistry.register(new OgcFeaturesProtocol(factory));
    } catch (error) {
        logger.error("Failed to register protocols:", error);
        throw error;
    }
}
