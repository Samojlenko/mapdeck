/**
 * Source adapter interface for data source integration.
 *
 * Source adapters are responsible for fetching data from external sources
 * (STAC catalogs, GeoJSON files, WMS services, etc.) and converting them
 * into tree nodes with proper role, configuration, and source references.
 */
import { type TreeNode } from "../node/tree";

export interface SourceAdapter {
    /**
     * Unique identifier for the adapter type (e.g., 'stac', 'geojson', 'wms')
     */
    readonly type: string;

    /**
     * Fetch root nodes from the data source.
     * @returns Promise resolving to array of root TreeNode objects
     */
    fetchRoot(): Promise<TreeNode[]>;

    /**
     * Fetch child nodes for a parent node.
     * @param parent - Parent node to fetch children for
     * @returns Promise resolving to array of child TreeNode objects
     */
    fetchChildren(parent: TreeNode): Promise<TreeNode[]>;

    /**
     * Optional: Initialize the adapter with configuration.
     * @param config - Adapter-specific configuration
     */
    initialize?(config: Record<string, unknown>): void | Promise<void>;

    /**
     * Optional: Clean up resources held by this adapter.
     */
    dispose?(): void;
}
