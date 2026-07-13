import { LayerRoles, type DataTable } from "@core/framework/types";
import type { IRoleResolver, ResolveContext } from "../IRoleResolver";
import type { STACAsset } from "../../types";

const DATA_TABLE_ROLES = new Set(["wfs", "ogc-feature-api"]);

export class DataTableResolver implements IRoleResolver {
    readonly priority = 10;

    canResolve(asset: STACAsset): boolean {
        return asset.roles?.some((role) => DATA_TABLE_ROLES.has(role)) ?? false;
    }

    resolve(asset: STACAsset, ctx: ResolveContext): DataTable {
        const adapterRole =
            asset.roles?.find((role) => DATA_TABLE_ROLES.has(role)) ?? "wfs";

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
