import type { LayerAdapter } from "./adapter";
import type { LayerConfig } from "./config";

/**
 * A render unit represents either a single layer or a group of layers
 * that are rendered as one unit on the map.
 *
 * - Single layer: nodeIds = [nodeId], id = nodeId
 * - WMS group: nodeIds = [nodeId1, nodeId2, ...], id = groupId
 */
export interface RenderUnit {
    id: string;
    nodeIds: string[];
    adapter: LayerAdapter;
    config: LayerConfig;
    sourceUrl: string;
}

/**
 * Snapshot of a layer node for building render units.
 * Produced by LayerTreeStore.layerSnapshot.
 */
export interface SnapshotItem {
    id: string;
    visible: boolean;
    config: LayerConfig | null;
    sourceUrl: string | null;
}
