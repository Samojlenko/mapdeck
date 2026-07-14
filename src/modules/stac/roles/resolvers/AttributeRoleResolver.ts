import { LayerRoles, type DataTable } from "@core/framework/types";
import type { IRoleResolver, ResolveContext } from "../IRoleResolver";
import type { STACAsset } from "../../types";

const ATTRIBUTE_ROLES = new Set(["wfs", "ogc-feature-api"]);

export class AttributeRoleResolver implements IRoleResolver {
    readonly priority = 10;

    canResolve(asset: STACAsset): boolean {
        return asset.roles?.some((r) => ATTRIBUTE_ROLES.has(r)) ?? false;
    }

    resolve(asset: STACAsset, ctx: ResolveContext): DataTable {
        const adapterRole =
            asset.roles?.find((r) => ATTRIBUTE_ROLES.has(r)) ?? "wfs";

        return {
            id: ctx.assetKey,
            category: "data",
            label: asset.title ?? ctx.assetKey,
            sourceUrl: asset.href,
            ...(asset.type ? { mimeType: asset.type } : {}),
            endpointUrl: asset.href,
            role: LayerRoles.of(adapterRole),
        };
    }
}
