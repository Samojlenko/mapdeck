import { LayerRoles } from "@core/framework/types";
import type { IRoleResolver, ResolveContext, ResolvedRenderCapability } from "../IRoleResolver";
import type { STACAsset } from "../../types";

export class WmsRoleResolver implements IRoleResolver {
    readonly priority = 25;

    canResolve(asset: STACAsset): boolean {
        return asset.roles?.includes("wms") ?? false;
    }

    resolve(
        asset: STACAsset,
        _ctx: ResolveContext,
    ): ResolvedRenderCapability {
        return {
            category: "render",
            role: LayerRoles.RASTER,
            sourceUrl: asset.href,
            protocolId: "wms",
        };
    }
}
