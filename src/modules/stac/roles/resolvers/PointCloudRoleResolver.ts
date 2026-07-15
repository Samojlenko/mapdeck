import { LayerRoles } from "@core/framework/types";
import type { IRoleResolver, ResolveContext, ResolvedRenderCapability } from "../IRoleResolver";
import type { STACAsset } from "../../types";
import { POINTCLOUD_MIMES } from "../../types/extensions/pointcloud";

export class PointCloudRoleResolver implements IRoleResolver {
    readonly priority = 22;

    canResolve(asset: STACAsset, ctx: ResolveContext): boolean {
        if (asset.roles?.includes("point-cloud")) return true;

        const hasDataRole = asset.roles?.includes("data") ?? false;
        if (!hasDataRole) return false;

        if (asset.type && POINTCLOUD_MIMES.has(asset.type)) return true;

        const isOctetStream = asset.type === "application/octet-stream";
        return isOctetStream && !!ctx.properties?.["pc:encoding"];
    }

    resolve(
        asset: STACAsset,
        _ctx: ResolveContext,
    ): ResolvedRenderCapability {
        return {
            category: "render",
            role: LayerRoles.POINT_CLOUD,
            sourceUrl: asset.href,
        };
    }
}
