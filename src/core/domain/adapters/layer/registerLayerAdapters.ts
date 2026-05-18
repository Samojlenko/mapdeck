import { layerAdapterFactory } from "@core/domain/adapters";
import { type LayerAdapter, LayerRole } from "@core/framework/types";
import { logger } from "@core/shared/diagnostics/logger";
import { PointCloudAdapter } from "./impl/PointCloudAdapter";
import { RasterAdapter } from "./impl/RasterAdapter";
import { Vector3DAdapter } from "./impl/Vector3DAdapter";
import { VectorAdapter } from "./impl/VectorAdapter";

const ADAPTERS: [LayerRole, LayerAdapter][] = [
    [LayerRole.RASTER, new RasterAdapter()],
    [LayerRole.VECTOR, new VectorAdapter()],
    [LayerRole.POINT_CLOUD, new PointCloudAdapter()],
    [LayerRole.VECTOR3D, new Vector3DAdapter()],
];

export async function registerLayerAdapters(): Promise<void> {
    try {
        for (const [role, adapter] of ADAPTERS) {
            await layerAdapterFactory.register(role, adapter);
        }
    } catch (error) {
        logger.error("Failed to register layer adapters:", error);
        throw error;
    }
}
