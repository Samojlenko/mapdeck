import { LayerRoles } from "@core/framework/types";
import type { IRoleResolver, ResolveContext, ResolvedRenderCapability } from "../IRoleResolver";
import type { STACAsset } from "../../types";

export class VectorTileRoleResolver implements IRoleResolver {
    readonly priority = 30;

    canResolve(asset: STACAsset): boolean {
        return asset.roles?.includes("vector-tile") ?? false;
    }

    resolve(
        asset: STACAsset,
        _ctx: ResolveContext,
    ): ResolvedRenderCapability {
        return {
            category: "render",
            role: LayerRoles.VECTOR,
            sourceUrl: asset.href,
        };
    }
}
