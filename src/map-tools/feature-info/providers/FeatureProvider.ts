import type { FeatureProvider } from "../types";

/**
 * Registry for feature providers.
 * Allows extensible feature collection from different data sources.
 */
export class FeatureProviderRegistry {
    private providers = new Map<string, FeatureProvider>();

    /**
     * Register a feature provider with a unique ID.
     */
    register(id: string, provider: FeatureProvider): void {
        if (this.providers.has(id)) {
            return;
        }
        this.providers.set(id, provider);
    }

    /**
     * Unregister a feature provider by ID.
     */
    unregister(id: string): boolean {
        return this.providers.delete(id);
    }

    /**
     * Get all registered providers.
     */
    getAll(): FeatureProvider[] {
        return Array.from(this.providers.values());
    }

    /**
     * Check if a provider with the given ID is registered.
     */
    has(id: string): boolean {
        return this.providers.has(id);
    }
}

export const featureProviderRegistry = new FeatureProviderRegistry();
