import { type TreeNode, isGroupNode } from "@core/framework/types";

export interface TraverseResult {
    matchedIds: Set<string>;
}

export interface TraverseOptions {
    predicate: (node: TreeNode) => boolean;
    signal?: AbortSignal | undefined;
    loadUnloaded?: boolean | undefined;
}

type TreeStore = {
    getNode: (id: string) => TreeNode | null;
    loadChildren: (id: string, signal?: AbortSignal) => Promise<void>;
};

interface TraverseContext {
    treeStore: TreeStore;
    options: TraverseOptions;
    matchedIds: Set<string>;
}

/**
 * Asynchronously traverses the tree starting from the given node IDs.
 * Recursively visits nodes, optionally loading unloaded children,
 * applies a predicate filter, and collects matched IDs.
 *
 * @param treeStore - The tree store instance (must have getNode and loadChildren)
 * @param startIds - Root node IDs to start traversal from
 * @param options - Traversal options (predicate, signal, loadUnloaded)
 * @returns A TraverseResult with matchedIds
 */
export async function traverseTreeAsync(
    treeStore: TreeStore,
    startIds: string[],
    options: TraverseOptions,
): Promise<TraverseResult> {
    const ctx: TraverseContext = {
        treeStore,
        options,
        matchedIds: new Set<string>(),
    };

    for (const id of startIds) {
        await traverseNode(ctx, id);
        if (options.signal?.aborted) break;
    }

    return { matchedIds: ctx.matchedIds };
}

async function traverseNode(
    ctx: TraverseContext,
    nodeId: string,
): Promise<void> {
    if (ctx.options.signal?.aborted) return;

    const node = ctx.treeStore.getNode(nodeId);
    if (!node) return;

    if (ctx.options.predicate(node)) {
        ctx.matchedIds.add(nodeId);
    }

    if (isGroupNode(node)) {
        await traverseGroupChildren(ctx, nodeId, node.childrenIds);
    }
}

async function traverseGroupChildren(
    ctx: TraverseContext,
    nodeId: string,
    childrenIds: readonly string[],
): Promise<void> {
    const { signal, loadUnloaded } = ctx.options;

    if (loadUnloaded && childrenIds.length === 0) {
        await ctx.treeStore.loadChildren(nodeId, signal);
        if (signal?.aborted) return;
    }

    const node = ctx.treeStore.getNode(nodeId);
    if (!node || !isGroupNode(node)) return;

    for (const childId of node.childrenIds) {
        await traverseNode(ctx, childId);
        if (signal?.aborted) return;
    }
}
