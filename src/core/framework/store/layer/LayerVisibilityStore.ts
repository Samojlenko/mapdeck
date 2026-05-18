import { makeAutoObservable, runInAction } from "mobx";
import { type TreeNode, isGroupNode, isLayerNode } from "@core/framework/types";
import { logger } from "@core/shared/diagnostics/logger";
import { unionBbox, type Bbox } from "@core/shared/geo";
import { createCancellable } from "@core/shared/async";
import { traverseTreeAsync } from "@core/shared/async/treeTraversal";
import type { RootStore } from "../root/rootStore";

/**
 * Manages layer visibility state and extent caching.
 * Extracted from LayerTreeStore to separate concerns.
 */
export class LayerVisibilityStore {
    /** Pending visibility tasks for cancellation */
    private _visibilityTasks = new Map<
        string,
        ReturnType<typeof createCancellable>
    >();

    /** Cached combined extents — keyed by group node ID */
    private _extentCache = new Map<string, Bbox>();

    constructor(readonly rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
    }

    private get _treeStore() {
        return this.rootStore.treeStore;
    }

    private _getNode(nodeId: string): TreeNode | null {
        return this._treeStore.getNode(nodeId);
    }

    /**
     * Collect bounding boxes of all visible layer nodes under a given node.
     * Extracted from getCombinedExtent for testability and readability.
     */
    private _collectVisibleBboxes(nodeId: string): Bbox[] {
        const node = this._getNode(nodeId);
        if (!node) return [];

        if (isLayerNode(node) && node.isVisible && node.bbox) {
            return [node.bbox];
        }

        if (isGroupNode(node)) {
            return node.childrenIds.flatMap((id) =>
                this._collectVisibleBboxes(id),
            );
        }

        return [];
    }

    /**
     * Calculate combined extent of all visible child layers for a group node.
     * @returns Combined bounding box or null if no visible layers
     */
    getCombinedExtent(nodeId: string): Bbox | null {
        const node = this._getNode(nodeId);
        if (!node || !isGroupNode(node)) {
            logger.error(`Group node ${nodeId} not found`);
            return null;
        }

        const cached = this._extentCache.get(nodeId);
        if (cached) return cached;

        const bboxes = this._collectVisibleBboxes(nodeId);
        if (bboxes.length === 0) return null;

        const combined = bboxes.reduce<Bbox | null>(
            (acc, b) => unionBbox(acc, b),
            null,
        );

        if (combined) {
            this._extentCache.set(nodeId, combined);
        }

        return combined;
    }

    /**
     * Clear cached combined extent for a node and all its ancestors.
     */
    clearExtentCache(nodeId: string): void {
        let currentId: string | null = nodeId;

        while (currentId) {
            this._extentCache.delete(currentId);
            const node = this._getNode(currentId);
            currentId = node?.parentId ?? null;
        }
    }

    /**
     * Clear all cached extents (e.g. on full tree rebuild).
     */
    clearAllExtentCaches(): void {
        this._extentCache.clear();
    }

    /**
     * Toggle visibility of a group/collection node.
     * If showing, recursively expands and sets visibility on all descendants.
     * If hiding, updates existing children only.
     */
    async toggleCollectionVisible(
        nodeId: string,
        visible: boolean,
    ): Promise<void> {
        const node = this._getNode(nodeId);
        if (!node || !isGroupNode(node)) {
            logger.error(`Group ${nodeId} not found`);
            return;
        }

        this._cancelVisibilityTask(nodeId);

        node.isVisible = visible;

        if (visible) {
            const task = createCancellable();
            this._visibilityTasks.set(nodeId, task);
            try {
                await task.run((signal) =>
                    this._expandAndSetVisibility(nodeId, signal),
                );
            } finally {
                runInAction(() => {
                    this._visibilityTasks.delete(nodeId);
                });
            }
        } else {
            this.setDescendantsVisibility(nodeId, false);
        }
    }

    /**
     * Toggle visibility of a layer/item node.
     */
    toggleItemVisible(nodeId: string, visible: boolean): void {
        const node = this._getNode(nodeId);
        if (!node || !isLayerNode(node)) {
            logger.error(`Layer ${nodeId} not found`);
            return;
        }

        node.isVisible = visible;

        this.clearExtentCache(nodeId);
    }

    /**
     * Recursively expand a group and all its descendant groups, setting visibility.
     * Uses traverseTreeAsync to load unloaded children and collect all descendant IDs.
     */
    private async _expandAndSetVisibility(
        nodeId: string,
        signal?: AbortSignal,
    ): Promise<void> {
        if (signal?.aborted) return;

        const { matchedIds } = await traverseTreeAsync(
            this._treeStore,
            [nodeId],
            { predicate: () => true, signal, loadUnloaded: true },
        );

        if (signal?.aborted) return;

        runInAction(() => {
            for (const id of matchedIds) {
                const node = this._getNode(id);
                if (node) {
                    node.isVisible = true;
                }
            }
        });
    }

    /**
     * Iterative visibility setter using an explicit stack.
     * Must be called inside a runInAction when used standalone.
     */
    private _setChildrenVisibilityNested(
        parentId: string,
        visible: boolean,
    ): void {
        const stack: string[] = [parentId];
        while (stack.length > 0) {
            const currentId = stack.pop()!;
            const current = this._getNode(currentId);
            if (!current || !isGroupNode(current)) continue;

            for (const childId of current.childrenIds) {
                const child = this._getNode(childId);
                if (!child) continue;

                if (isGroupNode(child) || isLayerNode(child)) {
                    child.isVisible = visible;
                }
                if (isGroupNode(child)) {
                    stack.push(childId);
                }
            }
        }
    }

    /**
     * Synchronously set visibility on all loaded descendants of a root node.
     * Clears extent cache for the root node after updating.
     */
    setDescendantsVisibility(rootId: string, visible: boolean): void {
        this._setChildrenVisibilityNested(rootId, visible);
        this.clearExtentCache(rootId);
    }

    /**
     * Cancel a pending visibility task for a given node.
     */
    private _cancelVisibilityTask(nodeId: string): void {
        const task = this._visibilityTasks.get(nodeId);
        if (task) {
            task.cancel();
            this._visibilityTasks.delete(nodeId);
        }
    }

    /**
     * Dispose — cancel all pending visibility tasks.
     */
    dispose(): void {
        for (const task of this._visibilityTasks.values()) {
            task.cancel();
        }
        this._visibilityTasks.clear();
        this._extentCache.clear();
    }
}
