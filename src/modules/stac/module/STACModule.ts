import { type Module } from "@core/framework/types";
import type { RootStore } from "@core/framework/store";
import { STACTreeAdapter } from "../adapter/STACTreeAdapter";
import { RoleResolverRegistry } from "../roles/RoleResolverRegistry";
import { DownloadResolver } from "../roles/resolvers/DownloadResolver";
import { DataTableResolver } from "../roles/resolvers/DataTableResolver";
import { RasterTileRoleResolver } from "../roles/resolvers/RasterTileRoleResolver";
import { WmsRoleResolver } from "../roles/resolvers/WmsRoleResolver";
import { VectorTileRoleResolver } from "../roles/resolvers/VectorTileRoleResolver";
import { GeoJsonRoleResolver } from "../roles/resolvers/GeoJsonRoleResolver";
import { PointCloudRoleResolver } from "../roles/resolvers/PointCloudRoleResolver";
import { logger } from "@core/shared/diagnostics/logger";

export class STACModule implements Module {
    readonly id = "stac";
    readonly name = "STAC Catalog Module";

    private rootStore: RootStore | null = null;

    setRootStore(rootStore: RootStore): void {
        this.rootStore = rootStore;
    }

    async register(): Promise<void> {
        if (!this.rootStore) {
            throw new Error(
                "STACModule requires rootStore — call setRootStore before register()",
            );
        }

        logger.debug("Registering STAC adapter...");

        const roleRegistry = createDefaultRoleRegistry();
        const adapter = new STACTreeAdapter(
            roleRegistry,
            this.rootStore.protocolRegistry,
        );
        await this.rootStore.sourceAdapterFactory.register("stac", adapter);

        logger.debug("STAC adapter registered successfully");
    }
}

function createDefaultRoleRegistry(): RoleResolverRegistry {
    const registry = new RoleResolverRegistry();
    registry.register(new DownloadResolver());
    registry.register(new DataTableResolver());
    registry.register(new RasterTileRoleResolver());
    registry.register(new WmsRoleResolver());
    registry.register(new VectorTileRoleResolver());
    registry.register(new GeoJsonRoleResolver());
    registry.register(new PointCloudRoleResolver());
    return registry;
}

export const stacModule = new STACModule();
