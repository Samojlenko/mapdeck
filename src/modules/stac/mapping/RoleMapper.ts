import type {
    NodeCapabilities,
    MapLayer,
    DataTable,
    Download,
} from "@core/framework/types";
import { LayerRoles } from "@core/framework/types";
import type { LayerConfigRegistry } from "@core/domain/adapters";
import { logger } from "@core/shared/diagnostics/logger";
import type { RoleResolverRegistry } from "../roles/RoleResolverRegistry";
import type { ResolveContext } from "../roles/IRoleResolver";
import type { STACAsset } from "../types";
import { resolveOgcFeaturesUrl } from "../roles/resolvers/GeoJsonRoleResolver";

export function mapAssetsToNodeCapabilities( // eslint-disable-line max-params
    assets: Readonly<Record<string, STACAsset>>,
    registry: RoleResolverRegistry,
    layerConfigRegistry: LayerConfigRegistry,
    properties?: Record<string, unknown>,
    itemBbox?: readonly number[],
    stac_extensions?: readonly string[],
): NodeCapabilities {
    const mapLayerCandidates: MapLayer[] = [];
    const dataTableCandidates: DataTable[] = [];
    const downloads: Download[] = [];

    for (const [assetKey, asset] of Object.entries(assets)) {
        const collected = resolveSingleAsset(
            assetKey,
            asset,
            registry,
            layerConfigRegistry,
            properties,
            itemBbox,
            stac_extensions,
        );
        if (!collected) continue;
        if (collected.mapLayer) mapLayerCandidates.push(collected.mapLayer);
        if (collected.dataTable) dataTableCandidates.push(collected.dataTable);
        if (collected.download) downloads.push(collected.download);
    }

    const { mapLayer, dataTable } = resolveMapLayerPriority(
        mapLayerCandidates,
        dataTableCandidates,
    );

    const result: NodeCapabilities = { downloads };
    if (mapLayer) result.mapLayer = mapLayer;
    if (dataTable) result.dataTable = dataTable;

    return result;
}

interface SingleAssetCapabilities {
    mapLayer?: MapLayer;
    dataTable?: DataTable;
    download?: Download;
}

function resolveSingleAsset( // eslint-disable-line max-params
    assetKey: string,
    asset: STACAsset,
    registry: RoleResolverRegistry,
    layerConfigRegistry: LayerConfigRegistry,
    properties?: Record<string, unknown>,
    itemBbox?: readonly number[],
    stac_extensions?: readonly string[],
): SingleAssetCapabilities | null {
    const ctx: ResolveContext = {
        assetKey,
        registry: layerConfigRegistry,
        ...(properties !== undefined ? { properties } : {}),
        ...(itemBbox !== undefined ? { itemBbox } : {}),
        ...(stac_extensions !== undefined ? { stac_extensions } : {}),
    };

    const capability = registry.resolve(asset, ctx);
    if (!capability) return null;

    if (capability.category === "render") {
        return resolveMapLayerWithDataTable(capability, asset, ctx);
    }

    switch (capability.category) {
        case "data":
            return { dataTable: capability };
        case "report":
            return { download: capability };
    }
}

/**
 * When a GeoJSON map layer originates from an OGC API Features endpoint,
 * also expose the same source as a data table.
 */
function resolveMapLayerWithDataTable(
    mapLayer: MapLayer,
    asset: STACAsset,
    ctx: ResolveContext,
): SingleAssetCapabilities {
    const hasOgcRole = asset.roles?.includes("ogc") ?? false;
    const isGeoJsonMapLayer = mapLayer.render.role === LayerRoles.GEOJSON;

    if (!hasOgcRole || !isGeoJsonMapLayer) {
        return { mapLayer };
    }

    const itemsUrl = resolveOgcFeaturesUrl(asset.href);

    return {
        mapLayer,
        dataTable: {
            id: ctx.assetKey,
            category: "data",
            label: asset.title ?? ctx.assetKey,
            sourceUrl: itemsUrl,
            ...(asset.type ? { mimeType: asset.type } : {}),
            endpointUrl: itemsUrl,
            role: LayerRoles.of("ogc-features"),
        },
    };
}

/**
 * If a raster or point-cloud map layer exists, vector and GeoJSON candidates
 * degrade to data tables. If no data table exists yet, the first degraded
 * vector or GeoJSON candidate takes its place.
 */
function resolveMapLayerPriority(
    mapLayerCandidates: MapLayer[],
    dataTableCandidates: DataTable[],
): {
    mapLayer: MapLayer | undefined;
    dataTable: DataTable | undefined;
} {
    if (mapLayerCandidates.length === 0) {
        return { mapLayer: undefined, dataTable: dataTableCandidates[0] };
    }

    const rasterOrPointCloudRoles = new Set([
        LayerRoles.RASTER,
        LayerRoles.POINT_CLOUD,
    ]);

    const rasterMapLayers = mapLayerCandidates.filter((candidate): boolean =>
        rasterOrPointCloudRoles.has(candidate.render.role),
    );
    const vectorMapLayers = mapLayerCandidates.filter(
        (candidate): boolean =>
            !rasterOrPointCloudRoles.has(candidate.render.role),
    );

    if (rasterMapLayers.length > 0) {
        if (rasterMapLayers.length > 1) {
            logger.debug(
                `Multiple raster map layers, using first: ${rasterMapLayers[0]!.id}`,
            );
        }
        const promotedDataTable =
            vectorMapLayers.length > 0
                ? degradeToDataTable(vectorMapLayers[0]!)
                : undefined;

        return {
            mapLayer: rasterMapLayers[0]!,
            dataTable: dataTableCandidates[0] ?? promotedDataTable,
        };
    }

    if (mapLayerCandidates.length > 1) {
        logger.debug(
            `Multiple map layers, using first: ${mapLayerCandidates[0]!.id}`,
        );
    }
    return {
        mapLayer: mapLayerCandidates[0],
        dataTable: dataTableCandidates[0],
    };
}

/** Converts a vector or GeoJSON map layer into a data table. */
function degradeToDataTable(mapLayer: MapLayer): DataTable {
    return {
        id: mapLayer.id,
        category: "data",
        label: mapLayer.label,
        sourceUrl: mapLayer.render.sourceUrl,
        ...(mapLayer.mimeType ? { mimeType: mapLayer.mimeType } : {}),
        endpointUrl: mapLayer.render.sourceUrl,
        role: LayerRoles.of(mapLayer.render.role),
    };
}
