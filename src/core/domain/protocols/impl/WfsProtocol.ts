import {
    LayerRoles,
    isGeoJsonConfig,
    makeRenderDescriptor,
    type AttributeFetchRequest,
    type AttributeFetchResult,
    type AttributeSourceConfig,
    type GeoJsonLayerConfig,
    type LayerAdapter,
    type LayerConfig,
    type LayerRole,
    type MapLayer,
} from "@core/framework/types";
import type { LayerAdapterFactory } from "@core/domain/adapters/layer/LayerAdapterFactory";
import {
    buildWfsUrl,
    fetchWfsPageAsRows,
    parseGeoJsonFeatures,
} from "@core/shared/protocols/ogc/wfs";
import type { Protocol, ProtocolFeatureInfoParams } from "../Protocol";

export class WfsProtocol implements Protocol {
    readonly id = "wfs";
    readonly label = "Web Feature Service";
    readonly roles = [LayerRoles.GEOJSON, LayerRoles.of("wfs")];

    constructor(private readonly layerAdapterFactory: LayerAdapterFactory) {}

    createMapLayer(
        _role: LayerRole,
        sourceUrl: string,
        config: LayerConfig,
    ): MapLayer {
        const geoJsonConfig: GeoJsonLayerConfig = isGeoJsonConfig(config)
            ? {
                  ...config,
                  role: LayerRoles.GEOJSON,
              }
            : {
                  role: LayerRoles.GEOJSON,
                  layerType: "fill",
              };

        return {
            id: sourceUrl,
            category: "render",
            label: sourceUrl,
            render: makeRenderDescriptor(
                LayerRoles.GEOJSON,
                sourceUrl,
                geoJsonConfig,
            ),
        };
    }

    getAdapter(_role: LayerRole): LayerAdapter {
        return this.layerAdapterFactory.get(LayerRoles.GEOJSON);
    }

    async fetchAttributes(
        config: AttributeSourceConfig,
        request: AttributeFetchRequest,
        signal?: AbortSignal,
    ): Promise<AttributeFetchResult> {
        const result = await fetchWfsPageAsRows(
            {
                url: config.endpointUrl,
                version: config.extraParams?.version ?? "2.0.0",
                startIndex: request.startIndex ?? 0,
                maxFeatures: request.maxFeatures ?? 50,
                sortBy: request.sortBy,
                sortDirection: request.sortDirection,
                extraParams: config.extraParams,
            },
            signal ?? request.signal,
        );

        return { rows: result.rows, totalFeatures: result.totalFeatures };
    }

    async getFeatureInfo(
        params: ProtocolFeatureInfoParams,
    ): Promise<Record<string, unknown>> {
        const buffer = 0.001;
        const bbox = [
            params.lng - buffer,
            params.lat - buffer,
            params.lng + buffer,
            params.lat + buffer,
        ].join(",");

        const url = buildWfsUrl({
            url: params.descriptor.sourceUrl,
            maxFeatures: 1,
            srsName: "EPSG:4326",
            extraParams: { BBOX: bbox },
        });

        const response = await globalThis.fetch(
            url,
            params.signal ? { signal: params.signal } : {},
        );

        if (!response.ok) {
            throw new Error(
                `WFS GetFeature returned ${response.status} ${response.statusText}`,
            );
        }

        const json: unknown = await response.json();
        const features = parseGeoJsonFeatures(
            (json ?? {}) as Record<string, unknown>,
        );

        if (features.length === 0) {
            return { noFeatures: "No features found" };
        }

        return features[0]!.properties;
    }
}
