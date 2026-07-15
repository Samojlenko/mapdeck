import { LayerRoles } from "@core/framework/types";
import type { IRoleResolver, ResolveContext, ResolvedRenderCapability } from "../IRoleResolver";
import type { STACAsset } from "../../types";

/**
 * GeoJSON for DeckGL.
 * Matches: explicit role "geojson", role "ogc", or specific geo+json MIME.
 * URL: if this is an OGC API Features endpoint, appends /items.
 *
 * Note: "data" role is intentionally excluded — it is too broad and
 * overlaps with COG, GeoTIFF, LAZ, and other formats. GeoJSON detection
 * relies on explicit roles or specific MIME types only.
 */
export class GeoJsonRoleResolver implements IRoleResolver {
    readonly priority = 35;

    canResolve(asset: STACAsset): boolean {
        if (asset.roles?.includes("geojson")) return true;
        if (asset.roles?.includes("ogc")) return true;
        return (
            asset.type === "application/geo+json" ||
            asset.type === "application/vnd.geo+json"
        );
    }

    resolve(
        asset: STACAsset,
        _ctx: ResolveContext,
    ): ResolvedRenderCapability {
        return {
            category: "render",
            role: LayerRoles.GEOJSON,
            sourceUrl: resolveOgcFeaturesUrl(asset.href),
        };
    }
}

export function resolveOgcFeaturesUrl(href: string): string {
    const clean = href.endsWith("/") ? href.slice(0, -1) : href;
    return clean.endsWith("/items") ? href : `${clean}/items`;
}
