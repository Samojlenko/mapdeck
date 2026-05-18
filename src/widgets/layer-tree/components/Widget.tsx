import React from "react";
import { observer } from "mobx-react-lite";
import { type LayerTreeProps } from "../types";
import { type TreeNode, isGroupNode, isLayerNode } from "@core/framework/types";
import { InlineError } from "@core/ui/components";
import styles from "./Widget.module.css";
import LayerTreeHeader from "./Header";
import CollectionNode from "./CollectionNode";
import ItemNode from "./ItemNode";
import { useRootStore } from "@core/framework/store";
import { logger } from "@core/shared/diagnostics/logger";
import { useAsyncEffect } from "@core/framework/hooks";
import { resolveNodeExtent } from "../utils";
import { LAYER_TREE_ID } from "../index";

const LayerTreeBody: () => React.ReactNode = observer(() => {
    const rootStore = useRootStore();
    const dict = rootStore.localeStore.t(LAYER_TREE_ID);
    const treeStore = rootStore.treeStore;
    const rootNodes = treeStore.visibleRootNodes;

    const toggleCollection = (nodeId: string) => {
        treeStore.toggleCollectionExpanded(nodeId);
    };

    const toggleCollectionVisible = async (
        nodeId: string,
        visible: boolean,
    ) => {
        logger.debug(`Collection ${nodeId} visibility toggled: ${visible}`);
        await treeStore.visibility.toggleCollectionVisible(nodeId, visible);
    };

    const toggleItemVisible = (nodeId: string, visible: boolean) => {
        logger.debug(`Item ${nodeId} visibility toggled: ${visible}`);
        treeStore.visibility.toggleItemVisible(nodeId, visible);
    };

    const handleZoom = (nodeId: string) => {
        logger.debug(`Zoom to ${nodeId} requested`);

        const node = treeStore.getNode(nodeId);
        if (!node) {
            logger.warn(`Node ${nodeId} not found`);
            return;
        }

        const extent = resolveNodeExtent(
            node,
            treeStore.visibility.getCombinedExtent.bind(treeStore.visibility),
        );

        if (extent) {
            rootStore.mapStore.zoomToExtent(extent);
            logger.debug(`Zooming to extent of ${nodeId}`);
        } else {
            logger.warn(`No extent available for node ${nodeId}`);
        }
    };

    const renderRootNode = (node: TreeNode) => {
        if (isGroupNode(node)) {
            return (
                <CollectionNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onToggleExpansion={toggleCollection}
                    onToggleVisibility={toggleCollectionVisible}
                    onToggleItemVisible={toggleItemVisible}
                    onZoom={handleZoom}
                />
            );
        } else if (isLayerNode(node)) {
            return (
                <ItemNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onVisibilityChange={toggleItemVisible}
                    onZoom={handleZoom}
                />
            );
        }

        logger.warn(`Unknown node type encountered: ${(node as TreeNode).id}`);
        return null;
    };

    if (treeStore.loading && treeStore.rootNodes.length === 0) {
        return (
            <div className={styles.layerTree__loadingContainer}>
                <span>{dict["loading"]}</span>
            </div>
        );
    }

    if (treeStore.error) {
        const coreDict = rootStore.localeStore.t("core");
        return (
            <InlineError
                message={`${dict["error.prefix"]} ${treeStore.error}`}
                onRetry={() => treeStore.fetchLayerTree()}
                dict={coreDict}
            />
        );
    }

    const showNoResults =
        treeStore.isSearching &&
        treeStore.searchResultIds.size === 0 &&
        !treeStore.loading;

    if (showNoResults) {
        return (
            <div className={styles.layerTree__emptyContainer}>
                <span>{dict["empty.noMatch"]}</span>
            </div>
        );
    }

    if (rootNodes.length === 0) {
        return (
            <div className={styles.layerTree__emptyContainer}>
                <span>{dict["empty.noLayers"]}</span>
            </div>
        );
    }

    return (
        <div className={styles.layerTree__treeContainer}>
            {rootNodes.map(renderRootNode)}
        </div>
    );
});

const LayerTreeComponent: (props: LayerTreeProps) => React.ReactNode = observer(
    ({ className = "" }) => {
        const rootStore = useRootStore();
        const treeStore = rootStore.treeStore;

        useAsyncEffect(
            async (signal) => {
                await rootStore.treeStore.ensureLayerTreeLoaded(signal);
            },
            [rootStore.treeStore],
        );

        return (
            <div className={`layer-tree ${styles.layerTree} ${className}`}>
                <LayerTreeHeader
                    onUpdateClick={treeStore.refreshLayerTree}
                    disabled={treeStore.loading}
                />
                <LayerTreeBody />
            </div>
        );
    },
);

export default LayerTreeComponent;
