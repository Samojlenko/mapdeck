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
import { fetchOgcFeaturesPage } from "@core/shared/protocols/ogc/features";
import type { Protocol, ProtocolFeatureInfoParams } from "../Protocol";

const RATE_LIMIT_MS = 1000;

export class OgcFeaturesProtocol implements Protocol {
    readonly id = "ogc-features";
    readonly label = "OGC API Features";
    readonly roles = [LayerRoles.GEOJSON, LayerRoles.of("ogc-features")];

    private lastRequestTime = 0;

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
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < RATE_LIMIT_MS) {
            const delay = RATE_LIMIT_MS - elapsed;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        this.lastRequestTime = Date.now();

        const result = await fetchOgcFeaturesPage(
            {
                url: config.endpointUrl,
                offset: request.startIndex ?? 0,
                limit: request.maxFeatures ?? 50,
            },
            signal ?? request.signal,
        );

        return { rows: result.features, totalFeatures: result.totalFeatures };
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

        const url = new URL(params.descriptor.sourceUrl);
        url.searchParams.set("bbox", bbox);
        url.searchParams.set("limit", "1");

        const response = await globalThis.fetch(
            url.toString(),
            params.signal ? { signal: params.signal } : {},
        );

        if (!response.ok) {
            throw new Error(
                `OGC Features returned ${response.status} ${response.statusText}`,
            );
        }

        const data: unknown = await response.json();

        if (
            !data ||
            typeof data !== "object" ||
            !("features" in data) ||
            !Array.isArray((data as Record<string, unknown>).features)
        ) {
            return { noFeatures: "No features found" };
        }

        const fc = data as { features: Array<{ properties?: Record<string, unknown> | null }> };

        if (fc.features.length === 0) {
            return { noFeatures: "No features found" };
        }

        return fc.features[0]!.properties ?? {};
    }
}
