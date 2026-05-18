import type { Widget, WidgetConfig } from "@core/framework/types";
import icon from "@core/ui/icons/attribute-table.svg";
import { attributeTableTranslations } from "./locale";
import AttributeTableWidget from "./components/Widget";
import type { AttributeTableWidgetProps } from "./types";
import config from "./config.json";

export const ATTRIBUTE_TABLE_WIDGET_ID = "attribute-table-widget" as const;

const typedConfig = config as WidgetConfig;

const AttributeTableWidgetDef: Widget<AttributeTableWidgetProps> = {
    id: ATTRIBUTE_TABLE_WIDGET_ID,
    icon,
    localeTranslations: attributeTableTranslations,
    component: AttributeTableWidget,
    showInSidebar: typedConfig.base?.showInSidebar ?? true,
    ...typedConfig.size,
};

export default AttributeTableWidgetDef;
export type { AttributeTableWidgetProps } from "./types";
