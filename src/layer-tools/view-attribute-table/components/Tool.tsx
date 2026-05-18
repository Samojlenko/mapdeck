import type { LayerTool } from "@core/framework/types";
import { ViewAttributeTableComponent } from "./Panel";
import { viewAttributeTableTranslations } from "../locale";

export const VIEW_ATTRIBUTE_TABLE_ID = "view-attribute-table";

/**
 * Attribute table tool — registered for ALL display roles.
 * The component itself checks for attribute role and renders nothing if absent.
 */
export const viewAttributeTableTools: LayerTool[] = [
    {
        id: VIEW_ATTRIBUTE_TABLE_ID,
        role: "all",
        localeTranslations: viewAttributeTableTranslations,
        component: (nodeId: string) => (
            <ViewAttributeTableComponent nodeId={nodeId} />
        ),
    },
];
