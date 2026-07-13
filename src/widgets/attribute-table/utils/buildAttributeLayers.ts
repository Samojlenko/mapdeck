import { type TreeNode, isGroupNode } from "@core/framework/types";
import type { AttributeLayerInfo } from "./index";

export function buildAttributeLayers(
    layerNodes: readonly TreeNode[],
    getNode: (id: string) => TreeNode | null,
): AttributeLayerInfo[] {
    const result: AttributeLayerInfo[] = [];
    for (const node of layerNodes) {
        if (!node.capabilities.dataTable) continue;
        let groupTitle: string | null = null;
        if (node.parentId) {
            const parent = getNode(node.parentId);
            if (parent && isGroupNode(parent)) {
                groupTitle = parent.title;
            }
        }
        result.push({ id: node.id, title: node.title, groupTitle });
    }
    return result;
}
