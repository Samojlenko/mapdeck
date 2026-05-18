import React from "react";
import { observer } from "mobx-react-lite";
import { useRootStore } from "@core/framework/store";
import { Icon } from "@core/ui/components";
import { isLayerNode } from "@core/framework/types";
import { logger } from "@core/shared/diagnostics/logger";
import { ATTRIBUTE_TABLE_WIDGET_ID } from "@widgets/attribute-table";
import { AttributeTableStore } from "@widgets/attribute-table/store/AttributeTableStore";
import { VIEW_ATTRIBUTE_TABLE_ID } from "./Tool";
import styles from "./Panel.module.css";

export interface ViewAttributeTableButtonProps {
    nodeId: string;
}

export const ViewAttributeTableComponent: (
    props: ViewAttributeTableButtonProps,
) => React.ReactNode = observer(({ nodeId }) => {
    const rootStore = useRootStore();
    const dict = rootStore.localeStore.t(VIEW_ATTRIBUTE_TABLE_ID);
    const node = rootStore.treeStore.getNode(nodeId);

    if (!node || !isLayerNode(node)) {
        logger.warn(`ViewAttributeTableButton: node ${nodeId} is not a layer`);
        return null;
    }

    // Only render if this node has an attribute (WFS) role
    const attrRole = node.roles.attribute;
    if (!attrRole) {
        return null;
    }

    const handleClick = () => {
        const store = rootStore.overlayStore.getWidgetStore(
            ATTRIBUTE_TABLE_WIDGET_ID,
            () => new AttributeTableStore(rootStore),
        );
        store.selectLayer(nodeId);

        rootStore.overlayStore.openWidget(ATTRIBUTE_TABLE_WIDGET_ID);

        logger.debug(`Opened attribute table widget from layer ${nodeId}`);
    };

    return (
        <button
            type="button"
            className={styles.button}
            onClick={handleClick}
            aria-label={dict["aria.button"]}
        >
            <Icon name="attribute-table" className={styles.icon ?? ""} />
            <span className={styles.label}>{dict["label.button"]}</span>
        </button>
    );
});

export default ViewAttributeTableComponent;
