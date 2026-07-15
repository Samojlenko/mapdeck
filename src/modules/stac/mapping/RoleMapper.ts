import type {
    NodeCapabilities,
    MapLayer,
    DataTable,
    Download,
    LayerRole,
} from "@core/framework/types";
import { logger } from "@core/shared/diagnostics/logger";
import type { ProtocolRegistry } from "@core/domain/protocols";
import type { RoleResolverRegistry } from "../roles/RoleResolverRegistry";
import type {
    ResolveContext,
    ResolvedRenderCapability,
} from "../roles/IRoleResolver";
import type { STACAsset } from "../types";

interface MapAssetsOptions {
    properties?: Record<string, unknown>;
    itemBbox?: readonly number[];
    stac_extensions?: readonly string[];
}

export function mapAssetsToNodeCapabilities(
    assets: Readonly<Record<string, STACAsset>>,
    registry: RoleResolverRegistry,
    protocolRegistry: ProtocolRegistry,
    options?: MapAssetsOptions,
): NodeCapabilities {
    const mapLayerCandidates: MapLayer[] = [];
    const dataTableCandidates: DataTable[] = [];
    const downloads: Download[] = [];

    for (const [assetKey, asset] of Object.entries(assets)) {
        const collected = resolveSingleAsset({
            assetKey,
            asset,
            registry,
            protocolRegistry,
            ...(options !== undefined ? { options } : {}),
        });
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

interface ResolveSingleParams {
    assetKey: string;
    asset: STACAsset;
    registry: RoleResolverRegistry;
    protocolRegistry: ProtocolRegistry;
    options?: MapAssetsOptions;
}

function resolveSingleAsset(params: ResolveSingleParams): SingleAssetCapabilities | null {
    const { assetKey, asset, registry, protocolRegistry, options } = params;
    const ctx: ResolveContext = {
        assetKey,
        ...(options?.properties !== undefined
            ? { properties: options.properties }
            : {}),
        ...(options?.itemBbox !== undefined
            ? { itemBbox: options.itemBbox }
            : {}),
        ...(options?.stac_extensions !== undefined
            ? { stac_extensions: options.stac_extensions }
            : {}),
    };

    const capability = registry.resolve(asset, ctx);
    if (!capability) return null;

    if (capability.category === "render") {
        return resolveMapLayer(capability, assetKey, asset, protocolRegistry);
    }

    if (capability.category === "data") {
        return { dataTable: capability };
    }

    return { download: capability };
}

function resolveMapLayer(
    resolved: ResolvedRenderCapability,
    assetKey: string,
    asset: STACAsset,
    protocolRegistry: ProtocolRegistry,
): SingleAssetCapabilities {
    const protocol = protocolRegistry.getByRole(resolved.role);
    if (!protocol) {
        logger.warn(
            `[STAC] No protocol for role "${resolved.role}" (asset: ${assetKey})`,
        );
        return {};
    }

    const mapLayer = protocol.createMapLayer(
        resolved.role,
        resolved.sourceUrl,
        { role: resolved.role } as never,
    );

    if (asset.title) {
        mapLayer.label = asset.title;
    }
    if (asset.type) {
        mapLayer.mimeType = asset.type;
    }

    const hasOgcRole = asset.roles?.includes("ogc") ?? false;
    const roleStr = resolved.role;
    const isGeoJson = roleStr === "geojson" || roleStr === "ogc-features";

    if (!hasOgcRole || !isGeoJson) {
        return { mapLayer };
    }

    return {
        mapLayer,
        dataTable: buildDataTable(assetKey, asset, resolved),
    };
}

function buildDataTable(
    assetKey: string,
    asset: STACAsset,
    resolved: ResolvedRenderCapability,
): DataTable {
    return {
        id: assetKey,
        category: "data",
        label: asset.title ?? assetKey,
        sourceUrl: resolved.sourceUrl,
        ...(asset.type ? { mimeType: asset.type } : {}),
        endpointUrl: resolved.sourceUrl,
        role: resolved.role,
    };
}

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

    const rasterOrPointCloudRoles = new Set(["raster", "point-cloud"]);

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

function degradeToDataTable(mapLayer: MapLayer): DataTable {
    return {
        id: mapLayer.id,
        category: "data",
        label: mapLayer.label,
        sourceUrl: mapLayer.render.sourceUrl,
        ...(mapLayer.mimeType ? { mimeType: mapLayer.mimeType } : {}),
        endpointUrl: mapLayer.render.sourceUrl,
        role: mapLayer.render.role as LayerRole,
    };
}
