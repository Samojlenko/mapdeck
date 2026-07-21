import { LayerRoles } from "@core/framework/types";
import type { IRoleResolver, ResolveContext, ResolvedRenderCapability } from "../IRoleResolver";
import type { STACAsset } from "../../types";

export class RasterTileRoleResolver implements IRoleResolver {
    readonly priority = 20;

    canResolve(asset: STACAsset): boolean {
        const hasRole = asset.roles?.includes("raster-tile") ?? false;
        const isXyz = /\{[zxy]\}/.test(asset.href);
        return hasRole || isXyz;
    }

    resolve(
        asset: STACAsset,
        _ctx: ResolveContext,
    ): ResolvedRenderCapability {
        return {
            category: "render",
            role: LayerRoles.RASTER,
            sourceUrl: asset.href,
            protocolId: "xyz",
        };
    }
}
