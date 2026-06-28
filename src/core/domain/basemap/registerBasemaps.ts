import type { RootStore } from "@core/framework/store";
import type { BaseMapConfig } from "@core/framework/types";
import basemapConfigData from "@map-tools/basemap/config.json";

/**
 * Load basemap configs and register them in BasemapStore.
 * Fetches external styleUrl styles for configs that don't have inline styles.
 */
export async function registerBasemaps(rootStore: RootStore): Promise<void> {
    const basemapConfigs = basemapConfigData as BaseMapConfig[];

    await Promise.all(
        basemapConfigs
            .filter((bm) => bm.styleUrl && !bm.style)
            .map(async (bm) => {
                try {
                    const response = await fetch(bm.styleUrl!);
                    if (response.ok) {
                        bm.style = await response.json();
                    }
                } catch {
                    // Keep style undefined — health check will mark it unavailable.
                }
            }),
    );

    rootStore.basemapStore.registerConfigs(basemapConfigs);
}
