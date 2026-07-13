import {
    LayerRoles,
    isRasterConfig,
    makeRenderDescriptor,
    type LayerAdapter,
    type LayerConfig,
    type LayerRole,
    type MapLayer,
    type RasterLayerConfig,
    type RenderDescriptor,
    type RenderUnit,
    type SnapshotItem,
    type WmsGroupConfig,
} from "@core/framework/types";
import type { LayerAdapterFactory } from "@core/domain/adapters/layer/LayerAdapterFactory";
import {
    buildWmsFeatureInfoUrl,
    buildWmsTileUrl,
    getWmsLayerName,
    groupVisibleWmsNodes,
    parseWmsUrl,
} from "@core/shared/protocols/ogc/wms";
import { parseFeature } from "@core/shared/protocols/ogc/wfs/parser";
import type { Protocol, ProtocolFeatureInfoParams } from "../Protocol";

interface WmsGroupInput {
    id: string;
    descriptor: RenderDescriptor;
}

/** Protocol implementation for WMS GetMap and GetFeatureInfo requests. */
export class WmsProtocol implements Protocol {
    readonly id = "wms";
    readonly label = "Web Map Service";
    readonly roles = [LayerRoles.RASTER];

    constructor(private readonly layerAdapterFactory: LayerAdapterFactory) {}

    createMapLayer(
        _role: LayerRole,
        sourceUrl: string,
        config: LayerConfig,
    ): MapLayer {
        const rasterConfig = createWmsConfig(sourceUrl, config);

        return {
            id: sourceUrl,
            category: "render",
            label: sourceUrl,
            render: makeRenderDescriptor(
                LayerRoles.RASTER,
                sourceUrl,
                rasterConfig,
            ),
        };
    }

    getAdapter(_role: LayerRole): LayerAdapter {
        return this.layerAdapterFactory.get(LayerRoles.RASTER);
    }

    groupRenderUnits(
        renderUnits: Map<string, RenderUnit>,
        snapshot: SnapshotItem[],
    ): void {
        const wmsInputs = collectWmsInputs(snapshot);
        if (wmsInputs.length === 0) return;

        const groups = groupVisibleWmsNodes(wmsInputs);
        const rasterAdapter = this.getAdapter(LayerRoles.RASTER);

        for (const input of wmsInputs) {
            renderUnits.delete(input.id);
        }

        for (const group of groups) {
            renderUnits.set(
                group.groupId,
                buildGroupRenderUnit(group, wmsInputs, rasterAdapter),
            );
        }
    }

    async getFeatureInfo(
        params: ProtocolFeatureInfoParams,
    ): Promise<Record<string, unknown>> {
        const config = getWmsConfig(params.descriptor);
        const baseUrl = parseWmsUrl(config.url).baseUrl;
        const layers = getWmsLayerName(config.url, config.layers);
        const version = config.version ?? "1.3.0";
        const url = buildFeatureInfoUrl(baseUrl, layers, version, params);
        const response = await globalThis.fetch(
            url,
            params.signal ? { signal: params.signal } : {},
        );

        if (!response.ok) {
            throw new Error(
                `GetFeatureInfo returned ${response.status} ${response.statusText}`,
            );
        }

        return parseFeatureInfoResponse(response);
    }
}

function createWmsConfig(
    sourceUrl: string,
    config: LayerConfig,
): RasterLayerConfig {
    const layers = getWmsQueryParam(sourceUrl, "LAYERS");
    const version = getWmsQueryParam(sourceUrl, "VERSION");
    const srs =
        getWmsQueryParam(sourceUrl, "SRS") ??
        getWmsQueryParam(sourceUrl, "CRS");
    const result: RasterLayerConfig = isRasterConfig(config)
        ? {
              ...config,
              role: LayerRoles.RASTER,
              type: "wms",
              url: sourceUrl,
          }
        : {
              role: LayerRoles.RASTER,
              type: "wms",
              url: sourceUrl,
          };

    if (layers) result.layers = layers;
    if (version) result.version = version;
    if (srs) result.srs = srs;

    return result;
}

function getWmsQueryParam(url: string, name: string): string | undefined {
    try {
        const value = [...new URL(url).searchParams.entries()].find(
            ([key]) => key.toUpperCase() === name,
        )?.[1];
        return value || undefined;
    } catch {
        return undefined;
    }
}

function collectWmsInputs(snapshot: SnapshotItem[]): WmsGroupInput[] {
    const inputs: WmsGroupInput[] = [];
    for (const item of snapshot) {
        if (!item.visible || !item.descriptor) continue;
        if (isWmsDescriptor(item.descriptor)) {
            inputs.push({ id: item.id, descriptor: item.descriptor });
        }
    }
    return inputs;
}

function buildGroupRenderUnit(
    group: WmsGroupConfig,
    wmsInputs: WmsGroupInput[],
    rasterAdapter: LayerAdapter,
): RenderUnit {
    const reversedNodeIds = [...group.nodeIds].reverse();
    const layerNames: string[] = [];
    const styleNames: string[] = [];

    for (const nodeId of reversedNodeIds) {
        const input = wmsInputs.find((candidate) => candidate.id === nodeId);
        if (!input) continue;
        const config = getWmsConfig(input.descriptor);
        layerNames.push(getWmsLayerName(config.url, config.layers));
        styleNames.push(parseWmsUrl(config.url).styles);
    }

    const firstInput = wmsInputs.find(
        (input) => input.id === group.nodeIds[0],
    );
    const firstConfig = firstInput ? getWmsConfig(firstInput.descriptor) : null;
    const groupConfig: RasterLayerConfig = {
        ...(firstConfig ?? {}),
        role: LayerRoles.RASTER,
        type: "wms",
        url: group.baseUrl,
        opacity: group.opacity,
    };
    const tileUrl = buildWmsTileUrl(group.baseUrl, layerNames.join(","), {
        version: group.version,
        format: group.format,
        styles: styleNames.join(","),
    });

    return {
        id: group.groupId,
        nodeIds: group.nodeIds,
        adapter: rasterAdapter,
        descriptor: makeRenderDescriptor(
            LayerRoles.RASTER,
            tileUrl,
            groupConfig,
        ),
    };
}

function getWmsConfig(descriptor: RenderDescriptor): RasterLayerConfig {
    const config = descriptor.config;
    if (!isRasterConfig(config) || config.type !== "wms") {
        throw new Error("WMS protocol requires a WMS raster descriptor");
    }
    return config;
}

function isWmsDescriptor(
    descriptor: RenderDescriptor,
): descriptor is RenderDescriptor & { config: RasterLayerConfig } {
    return (
        isRasterConfig(descriptor.config) && descriptor.config.type === "wms"
    );
}

function buildFeatureInfoUrl(
    baseUrl: string,
    layers: string,
    version: string,
    params: ProtocolFeatureInfoParams,
): string {
    const parsedUrl = new URL(buildWmsFeatureInfoUrl(baseUrl, layers, { version }));
    const canvas = params.map.getCanvas();
    const bounds = params.map.getBounds();
    const west = Math.max(-180, Math.min(180, bounds.getWest()));
    const east = Math.max(-180, Math.min(180, bounds.getEast()));
    const south = Math.max(-90, Math.min(90, bounds.getSouth()));
    const north = Math.max(-90, Math.min(90, bounds.getNorth()));
    const clickLngLat = params.map.unproject([params.screenX, params.screenY]);
    const screenX = Math.round(
        ((clickLngLat.lng - west) / (east - west)) * canvas.clientWidth,
    );
    const screenY = Math.round(
        ((north - clickLngLat.lat) / (north - south)) * canvas.clientHeight,
    );

    parsedUrl.searchParams.set("WIDTH", String(canvas.clientWidth));
    parsedUrl.searchParams.set("HEIGHT", String(canvas.clientHeight));
    setFeatureInfoCoordinates(parsedUrl.searchParams, {
        version,
        screenX,
        screenY,
        west,
        south,
        east,
        north,
    });

    return parsedUrl.toString();
}

function setFeatureInfoCoordinates(
    queryParams: URLSearchParams,
    params: {
        version: string;
        screenX: number;
        screenY: number;
        west: number;
        south: number;
        east: number;
        north: number;
    },
): void {
    const usesSrs =
        params.version.startsWith("1.1") || params.version.startsWith("1.0");

    if (usesSrs) {
        queryParams.set("X", String(params.screenX));
        queryParams.set("Y", String(params.screenY));
        queryParams.set("SRS", "EPSG:4326");
        queryParams.set(
            "BBOX",
            `${params.west},${params.south},${params.east},${params.north}`,
        );
        return;
    }

    queryParams.set("I", String(params.screenX));
    queryParams.set("J", String(params.screenY));
    queryParams.set("CRS", "EPSG:4326");
    queryParams.set(
        "BBOX",
        `${params.south},${params.west},${params.north},${params.east}`,
    );
}

async function parseFeatureInfoResponse(
    response: Response,
): Promise<Record<string, unknown>> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        return parseFeatureInfoJson(await response.json());
    }
    if (contentType.includes("text/html")) {
        return { htmlResponse: await response.text() };
    }
    if (contentType.includes("text/plain")) {
        return { textResponse: await response.text() };
    }

    try {
        return parseFeatureInfoJson(await response.json());
    } catch {
        return { rawResponse: (await response.text()).substring(0, 1000) };
    }
}

function parseFeatureInfoJson(json: unknown): Record<string, unknown> {
    if (!json || typeof json !== "object" || !("features" in json)) {
        return { rawJson: JSON.stringify(json, null, 2).substring(0, 2000) };
    }

    const features = (json as Record<string, unknown>).features;
    if (!Array.isArray(features) || features.length === 0) {
        return { noFeatures: "No features found in WMS response" };
    }

    const attributes: Record<string, unknown> = {};
    for (const feature of features) {
        const parsed = parseFeature(feature);
        if (parsed) Object.assign(attributes, parsed.properties);
    }
    return attributes;
}
