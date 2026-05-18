import type {
    Feature,
    FeatureGroup,
    CollectParams,
    CollectResult,
} from "../types";
import {
    featureProviderRegistry,
    FeatureProviderRegistry,
} from "../providers/FeatureProvider";

/**
 * Orchestrator that collects features from all registered providers.
 *
 * - Runs all providers in parallel
 * - Results are grouped by layerId
 * - Loading state tracks whether any provider is still pending
 */
export class FeatureCollector {
    private registry: FeatureProviderRegistry;

    constructor(registry: FeatureProviderRegistry = featureProviderRegistry) {
        this.registry = registry;
    }

    /**
     * Collect features from all registered providers.
     *
     * Runs all providers in parallel. Calls onUpdate twice:
     * 1. Immediately with empty groups and loading=true
     * 2. When all providers complete with groups and loading=false
     *
     * @returns Final CollectResult when all providers complete
     */
    async collect(
        params: CollectParams,
        onUpdate: (result: CollectResult) => void,
    ): Promise<CollectResult> {
        const providers = this.registry.getAll();

        // Signal initial loading state
        onUpdate({ groups: [], loading: true });

        // Check if already aborted
        if (params.signal?.aborted) {
            return { groups: [], loading: false };
        }

        // Run all providers in parallel
        const results = await Promise.allSettled(
            providers.map((provider) => provider.collect(params)),
        );

        // Check again after providers complete
        if (params.signal?.aborted) {
            return { groups: [], loading: false };
        }

        // Combine all features from successful results
        const allFeatures: Feature[] = [];
        for (const result of results) {
            if (result.status === "fulfilled") {
                allFeatures.push(...result.value);
            }
        }

        const finalResult: CollectResult = {
            groups: this.groupFeatures(allFeatures),
            loading: false,
        };

        onUpdate(finalResult);
        return finalResult;
    }

    /**
     * Group features by their groupId (layerId).
     */
    private groupFeatures(features: Feature[]): FeatureGroup[] {
        const groupMap = new Map<string, FeatureGroup>();

        for (const feature of features) {
            if (!groupMap.has(feature.groupId)) {
                groupMap.set(feature.groupId, {
                    layerId: feature.layerId,
                    layerName: feature.layerName,
                    sourceType: feature.sourceType,
                    features: [],
                    loading: false,
                });
            }
            groupMap.get(feature.groupId)!.features.push(feature);
        }

        return Array.from(groupMap.values());
    }
}

// Singleton instance
export const featureCollector = new FeatureCollector();
