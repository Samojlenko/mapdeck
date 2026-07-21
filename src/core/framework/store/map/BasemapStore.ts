import { makeAutoObservable, reaction, runInAction, type IReactionDisposer } from "mobx";
import type { RootStore } from "@core/framework/store";
import type { BaseMapConfig } from "@core/framework/types";
import { checkBasemapHealth } from "@map-tools/basemap/utils/checkBasemapHealth";
import { logger } from "@core/shared/diagnostics/logger";

/** Health status of a basemap source. */
export type BasemapStatus = "loading" | "success" | "error";

interface BasemapHealthEntry {
    status: BasemapStatus;
    timestamp: number;
}

const BASEMAP_SETTING_ID = "basemap.basemap";
const BASEMAP_ID_PREFIX = "basemap_";
const HEALTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class BasemapStore {
    private _configs: BaseMapConfig[] = [];
    private _healthCache = new Map<string, BasemapHealthEntry>();
    private _ownedIds: Set<string> = new Set();
    private _syncDisposer: IReactionDisposer | null = null;
    private _initInProgress = false;

    constructor(readonly rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
    }

    /**
     * Register basemap configs. Additive — new configs are appended
     * (duplicates by id are skipped). Re-syncs the setting options
     * so modules can register configs after init.
     */
    registerConfigs(configs: BaseMapConfig[]): void {
        for (const config of configs) {
            if (!this._configs.some((c) => c.id === config.id)) {
                this._configs.push(config);
            }
        }
        this._syncSettingOptions();
    }

    /** All registered basemap configs (no filtering). */
    get availableBasemaps(): BaseMapConfig[] {
        return this._configs;
    }

    /** Currently active basemap config, resolved from the setting. */
    get activeBasemap(): BaseMapConfig | undefined {
        const id =
            this.rootStore.settingsStore.getStringSetting(BASEMAP_SETTING_ID);
        if (!id) return undefined;
        return this._configs.find((bm) => bm.id === id);
    }

    /** Switch the active basemap setting. */
    setActiveBasemap(basemapId: string): void {
        this.rootStore.settingsStore.setSetting(BASEMAP_SETTING_ID, basemapId);
    }

    /**
     * Apply a basemap config to the maplibre map.
     * Removes previous basemap sources/layers, then adds the new ones.
     * On failure, logs the error and leaves the previous basemap intact.
     */
    applyBasemap(basemap: BaseMapConfig): void {
        if (!basemap.style) {
            logger.warn(
                `BasemapStore.applyBasemap: "${basemap.id}" has no style, skipping`,
            );
            return;
        }

        try {
            this.rootStore.mapStore.removeOwnedLayers(this._ownedIds);
            const newOwnedIds = new Set<string>();
            this.rootStore.mapStore.applyStyleFragment(
                basemap.style,
                BASEMAP_ID_PREFIX,
                newOwnedIds,
            );
            this._ownedIds = newOwnedIds;
        } catch (error) {
            logger.error(
                `BasemapStore.applyBasemap: failed to apply "${basemap.id}"`,
                error,
            );
        }
    }

    /**
     * Check whether a basemap is reachable, with TTL-based caching.
     * @param basemapId - Config id to check
     * @param timeoutMs - Fetch timeout (default 3000ms)
     * @param forceRefresh - Bypass the cache
     */
    async checkHealth(
        basemapId: string,
        timeoutMs: number = 3000,
        forceRefresh: boolean = false,
    ): Promise<BasemapStatus> {
        if (!forceRefresh) {
            const cached = this._healthCache.get(basemapId);
            if (cached && Date.now() - cached.timestamp < HEALTH_CACHE_TTL) {
                return cached.status;
            }
        }

        const basemap = this._configs.find((bm) => bm.id === basemapId);
        if (!basemap) return "error";

        const isHealthy = await checkBasemapHealth(basemap, timeoutMs);
        const status: BasemapStatus = isHealthy ? "success" : "error";

        this._healthCache.set(basemapId, { status, timestamp: Date.now() });
        return status;
    }

    /**
     * Find a healthy basemap on map load, preferring the current active one.
     * Falls back to the first healthy basemap in the available list.
     * Sets the init-in-progress guard to prevent the sync reaction from firing.
     */
    async findAndApplyInitialBasemap(): Promise<void> {
        this._initInProgress = true;

        try {
            const available = this.availableBasemaps;
            if (available.length === 0) return;

            const active = this.activeBasemap;
            const candidates = active
                ? [active, ...available.filter((bm) => bm.id !== active.id)]
                : available;

            let validBasemap: BaseMapConfig | undefined;
            for (const basemap of candidates) {
                const healthy = await checkBasemapHealth(basemap);
                if (healthy) {
                    validBasemap = basemap;
                    break;
                }
            }

            validBasemap ??= active ?? available[0];

            if (validBasemap) {
                if (validBasemap.id !== active?.id) {
                    this.setActiveBasemap(validBasemap.id);
                }
                this.applyBasemap(validBasemap);
            }
        } finally {
            runInAction(() => {
                this._initInProgress = false;
            });
        }
    }

    /** Start reactive sync: when the basemap setting changes, apply the new basemap. */
    startSync(): void {
        this.stopSync();

        this._syncDisposer = reaction(
            () =>
                this.rootStore.settingsStore.getStringSetting(
                    BASEMAP_SETTING_ID,
                ),
            () => {
                if (this._initInProgress) return;
                const basemap = this.activeBasemap;
                if (basemap) this.applyBasemap(basemap);
            },
        );
    }

    /** Stop the reactive sync reaction. */
    stopSync(): void {
        this._syncDisposer?.();
        this._syncDisposer = null;
    }

    /** Clean up reaction, clear cache, and clear owned layer tracking. */
    dispose(): void {
        this.stopSync();
        this._healthCache.clear();
        this._ownedIds.clear();
        this._configs = [];
    }

    /**
     * Remove a registered basemap config by id.
     * Falls back to another basemap if the removed one was active.
     * Re-syncs the setting options so the dropdown stays up to date.
     */
    removeConfig(basemapId: string): void {
        const index = this._configs.findIndex((c) => c.id === basemapId);
        if (index === -1) return;

        this._configs.splice(index, 1);
        this._healthCache.delete(basemapId);

        // If the removed basemap was active, switch to first available
        if (this.activeBasemap?.id === basemapId) {
            const fallback = this._configs[0];
            if (fallback) {
                this.setActiveBasemap(fallback.id);
                this.applyBasemap(fallback);
            }
        }

        this._syncSettingOptions();
    }

    /**
     * Rebuild the basemap select setting options from registered configs.
     * No-op if the setting hasn't been registered yet (e.g. during initial load
     * before BasemapTool initializes).
     */
    private _syncSettingOptions(): void {
        const existing =
            this.rootStore.settingsStore.getOwnerSettings("basemap")[0];
        if (!existing) return;

        const options = this._configs.map((bm) => ({
            label: bm.name,
            value: bm.id,
        }));

        this.rootStore.settingsStore.registerSetting(
            existing.ownerId,
            existing.ownerName,
            {
                id: BASEMAP_SETTING_ID,
                label: "Basemap",
                type: "select",
                defaultValue: options[0]?.value ?? "",
                options,
            },
        );
    }
}
