import type { IObservableArray } from "mobx";
import { logger } from "@core/shared/diagnostics/logger";
import {
    type TreeNode,
    LayerTreeNodeTypes,
    type LayerNode,
    type GroupNode,
    type NodeCapabilities,
    type LayerNodeCapabilities,
} from "@core/framework/types";
import type { STACCollection, STACItem, STACEntity } from "../types";
import { isSTACCollection } from "../types";
import { mapAssetsToNodeCapabilities } from "./RoleMapper";
import type { LayerConfigRegistry } from "@core/domain/adapters";
import type { RoleResolverRegistry } from "../roles/RoleResolverRegistry";
import { Bbox, flattenTo2D } from "@core/shared/geo";
import type { STACCache } from "../core/STACCache";

export class STACEntityMapper {
    constructor(
        private cache: STACCache,
        private layerConfigRegistry: LayerConfigRegistry,
        private roleRegistry: RoleResolverRegistry,
    ) {}

    mapCollectionToGroupNode(
        collection: STACCollection,
        childrenIds: IObservableArray<string>,
    ): TreeNode {
        const flattenedBbox = flattenTo2D(
            new Bbox(collection.extent.spatial.bbox[0]!),
        );

        const capabilities: NodeCapabilities = collection.assets
            ? mapAssetsToNodeCapabilities(
                  collection.assets,
                  this.roleRegistry,
                  this.layerConfigRegistry,
              )
            : { downloads: [] };

        const childLinkCount = collection.links.filter(
            (link) => link.rel === "child" || link.rel === "item",
        ).length;

        return {
            id: collection.id,
            type: LayerTreeNodeTypes.Group,
            title: collection.title || collection.id,
            description: collection.description || "",
            icon: "",
            metadata: {
                stacEntityRef: `Collection:${collection.id}`,
            },
            parentId: null,
            childrenIds,
            childrenCount: childLinkCount,
            bbox: flattenedBbox,
            capabilities,
            isExtended: false,
            isVisible: false,
        } as GroupNode;
    }

    mapItemToLayerNode(item: STACItem): TreeNode | null {
        const capabilities = mapAssetsToNodeCapabilities(
            item.assets,
            this.roleRegistry,
            this.layerConfigRegistry,
            item.properties,
            item.bbox,
        );

        const hasBbox = item.bbox && item.bbox.length >= 4;

        if (
            capabilities.downloads.length === 0 &&
            !capabilities.mapLayer &&
            !capabilities.dataTable
        ) {
            return this.createPlaceholderOrSkip(item, hasBbox, "no assets");
        }

        const layerCapabilities = this.resolveCapabilityConflicts(capabilities);
        if (!layerCapabilities) {
            return this.createPlaceholderOrSkip(item, hasBbox, "no map layer");
        }

        const flattenedBbox = hasBbox ? flattenTo2D(new Bbox(item.bbox)) : null;

        const layerNode: LayerNode = {
            id: item.id,
            type: LayerTreeNodeTypes.Layer,
            title: item.properties.title || item.id,
            description: item.properties.description || "",
            icon: "",
            metadata: {
                stacEntityRef: `Feature:${item.id}`,
            },
            parentId: null,
            bbox: flattenedBbox,
            capabilities: layerCapabilities,
            isVisible: false,
        };

        return layerNode;
    }

    getSTACEntityFromNode(node: TreeNode): STACEntity | null {
        const ref = node.metadata?.stacEntityRef as string | undefined;
        if (!ref) return null;

        const colonIndex = ref.indexOf(":");
        if (colonIndex === -1) return null;

        const type = ref.slice(0, colonIndex);
        const id = ref.slice(colonIndex + 1);
        return this.cache.get<STACEntity>(type, id) ?? null;
    }

    getSTACCollectionFromNode(node: TreeNode): STACCollection | null {
        const entity = this.getSTACEntityFromNode(node);
        if (entity && isSTACCollection(entity)) {
            return entity;
        }
        return null;
    }

    /**
     * Returns a layer's rendering and table capabilities, or null when it has
     * no map layer capability and must be represented as a placeholder.
     */
    private resolveCapabilityConflicts(
        capabilities: NodeCapabilities,
    ): LayerNodeCapabilities | null {
        if (!capabilities.mapLayer) return null;

        const result: LayerNodeCapabilities = {
            mapLayer: capabilities.mapLayer,
            downloads: capabilities.downloads,
        };
        if (capabilities.dataTable) result.dataTable = capabilities.dataTable;
        return result;
    }

    /** Creates a placeholder layer node when an item has an extent but no map layer. */
    private createPlaceholderOrSkip(
        item: STACItem,
        hasBbox: boolean,
        reason: string,
    ): TreeNode | null {
        if (!hasBbox) {
            logger.debug(`Item ${item.id} has no bbox and ${reason}, skipping`);
            return null;
        }
        const flattenedBbox =
            item.bbox && item.bbox.length >= 4
                ? flattenTo2D(new Bbox(item.bbox))
                : null;

        const layerNode: LayerNode = {
            id: item.id,
            type: LayerTreeNodeTypes.Layer,
            title: item.properties.title || item.id,
            description: item.properties.description || "",
            icon: "",
            metadata: {
                stacEntityRef: `Feature:${item.id}`,
            },
            parentId: null,
            bbox: flattenedBbox,
            capabilities: { downloads: [] },
            isVisible: false,
        };

        return layerNode;
    }
}
