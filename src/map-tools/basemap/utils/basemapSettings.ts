import type { BaseMapConfig, BaseMapSettings } from "@core/framework/types";
import type { RootStore } from "@core/framework/store";
import basemapConfigData from "../config.json";

const basemapSettings = basemapConfigData as BaseMapSettings;

/**
 * Get all available basemap configs from settings
 */
export function getAvailableBasemaps(rootStore: RootStore): BaseMapConfig[] {
    const setting = rootStore.settingsStore.getOwnerSettings("basemap")[0];
    if (!setting || setting.type !== "select") {
        return basemapSettings.available_basemaps;
    }

    const options = setting.options;
    if (!options) {
        return basemapSettings.available_basemaps;
    }

    return options
        .map((opt) =>
            basemapSettings.available_basemaps.find(
                (bm) => bm.id === opt.value,
            ),
        )
        .filter((bm): bm is BaseMapConfig => bm !== undefined);
}

/**
 * Get active basemap config from settings
 */
export function getActiveBasemap(
    rootStore: RootStore,
): BaseMapConfig | undefined {
    const activeId =
        rootStore.settingsStore.getStringSetting("basemap.basemap");
    if (!activeId) {
        return undefined;
    }
    return basemapSettings.available_basemaps.find((bm) => bm.id === activeId);
}
