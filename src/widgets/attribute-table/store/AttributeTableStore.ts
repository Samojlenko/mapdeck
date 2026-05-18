import { makeAutoObservable, runInAction } from "mobx";
import type { RootStore } from "@core/framework/store";
import { isLayerNode, type AttributeRole } from "@core/framework/types";
import type { Bbox } from "@core/shared/geo";
import {
    buildAttributeLayers,
    extractColumns,
    getFeatureId,
    type AttributeLayerInfo,
} from "../utils/index";

export const PAGE_SIZE = 50;

export class AttributeTableStore {
    selectedLayerId: string | null = null;
    sortColumn: string | null = null;
    sortDirection: "asc" | "desc" | null = null;
    selectedRowIds: Set<string> = new Set();
    error: string | null = null;

    private readonly maxFeaturesPerRequest: number;
    private fetchingNextPage = false;

    constructor(
        readonly rootStore: RootStore,
        options: { maxFeaturesPerRequest?: number } = {},
    ) {
        this.maxFeaturesPerRequest = options.maxFeaturesPerRequest ?? 1000;
        makeAutoObservable(this, {
            rootStore: false,
        });
    }

    get attributeLayers(): AttributeLayerInfo[] {
        return buildAttributeLayers(this.rootStore.treeStore.layerNodes, (id) =>
            this.rootStore.treeStore.getNode(id),
        );
    }

    /** Attribute role metadata for the selected layer (used by external tools, e.g. data export). */
    get attributeRole(): AttributeRole | null {
        if (!this.selectedLayerId) return null;
        const node = this.rootStore.treeStore.getNode(this.selectedLayerId);
        if (!node || !isLayerNode(node)) return null;
        return node.roles.attribute ?? null;
    }

    private get _sortParams() {
        return this.sortColumn && this.sortDirection
            ? { sortBy: this.sortColumn, sortDirection: this.sortDirection }
            : undefined;
    }

    get cachedData() {
        if (!this.selectedLayerId) return null;
        return this.rootStore.attributeDataStore.getCache(
            this.selectedLayerId,
            this._sortParams,
        );
    }

    get loading(): boolean {
        if (!this.selectedLayerId) return false;
        return this.rootStore.attributeDataStore.isLoading(
            this.selectedLayerId,
            this._sortParams,
        );
    }

    get isBusy(): boolean {
        return this.loading || this.fetchingNextPage;
    }

    get totalFeatures(): number {
        return this.cachedData?.totalFeatures || 0;
    }

    get loadedFeatures(): Record<string, unknown>[] {
        return this.cachedData?.features ?? [];
    }

    get columns(): string[] {
        return extractColumns(this.loadedFeatures);
    }

    get hasGeometry(): boolean {
        return this.loadedFeatures.some((f) => f._bbox != null);
    }

    get geometryColumn():
        | { key: "_bbox"; onZoom: (bbox: Bbox) => void }
        | undefined {
        if (!this.hasGeometry) return undefined;
        return {
            key: "_bbox" as const,
            onZoom: (bbox: Bbox) => this.rootStore.mapStore.zoomToExtent(bbox),
        };
    }

    get hasMoreFeatures(): boolean {
        if (!this.selectedLayerId) return false;
        const cached = this.cachedData;
        if (!cached) return false;
        return cached.features.length < cached.totalFeatures;
    }

    selectLayer = async (layerId: string | null): Promise<void> => {
        runInAction(() => {
            this.selectedLayerId = layerId;
            this.sortColumn = null;
            this.sortDirection = null;
            this.selectedRowIds.clear();
            this.error = null;
        });

        if (layerId) {
            // Clear cache if previous fetch had an error, so we retry immediately
            const cached = this.rootStore.attributeDataStore.getCache(layerId);
            if (cached?.error) {
                this.rootStore.attributeDataStore.clearCache(layerId);
            }

            await this.rootStore.attributeDataStore.fetch(layerId, {
                startIndex: 0,
                maxFeatures: PAGE_SIZE,
            });
        }
    };

    loadNextPage = async (totalNeeded = PAGE_SIZE): Promise<void> => {
        if (
            !this.selectedLayerId ||
            !this.hasMoreFeatures ||
            this.fetchingNextPage
        )
            return;
        runInAction(() => {
            this.fetchingNextPage = true;
        });
        try {
            await this._fetchNextBatch(totalNeeded);
        } finally {
            runInAction(() => {
                this.fetchingNextPage = false;
            });
        }
    };

    private _fetchNextBatch = async (needed: number): Promise<void> => {
        const cached = this.cachedData;
        if (!cached || !this.selectedLayerId) return;
        const batchSize = Math.min(
            Math.max(PAGE_SIZE, needed),
            this.maxFeaturesPerRequest,
        );
        await this.rootStore.attributeDataStore.fetch(this.selectedLayerId, {
            startIndex: cached.features.length,
            maxFeatures: batchSize,
            ...this._sortParams,
        });
    };

    setSort = async (
        column: string | null,
        direction: "asc" | "desc" | null,
    ): Promise<void> => {
        runInAction(() => {
            this.sortColumn = column;
            this.sortDirection = direction;
            this.selectedRowIds.clear();
        });

        if (!this.selectedLayerId) return;

        this.rootStore.attributeDataStore.clearCache(
            this.selectedLayerId,
            this._sortParams,
        );

        await this.rootStore.attributeDataStore.fetch(this.selectedLayerId, {
            startIndex: 0,
            maxFeatures: PAGE_SIZE,
            ...this._sortParams,
        });
    };

    toggleRowSelection = (featureId: string): void => {
        runInAction(() => {
            if (this.selectedRowIds.has(featureId)) {
                this.selectedRowIds.delete(featureId);
            } else {
                this.selectedRowIds.add(featureId);
            }
        });
    };

    selectAllRows = (): void => {
        runInAction(() => {
            this.selectedRowIds.clear();
            this.loadedFeatures.forEach((feature, index) => {
                this.selectedRowIds.add(getFeatureId(feature, index));
            });
        });
    };

    clearSelection = (): void => {
        runInAction(() => {
            this.selectedRowIds.clear();
        });
    };

    refreshData = async (): Promise<void> => {
        if (!this.selectedLayerId) return;

        this.rootStore.attributeDataStore.invalidateCache(
            this.selectedLayerId,
            this._sortParams,
        );

        await this.rootStore.attributeDataStore.fetch(this.selectedLayerId, {
            startIndex: 0,
            maxFeatures: PAGE_SIZE,
            ...this._sortParams,
        });
    };

    clearError = (): void => {
        runInAction(() => {
            this.error = null;
        });
    };
}
