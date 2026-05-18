import type { Widget, WidgetConfig } from "@core/framework/types";
import icon from "@core/ui/icons/layers.svg";
import { layerTreeTranslations } from "./locale";
import LayerTreeComponent from "./components/Widget";
import type { LayerTreeProps } from "./types";
import config from "./config.json";

export const LAYER_TREE_ID = "layer-tree" as const;

const LayerTree: Widget<LayerTreeProps> = {
    id: LAYER_TREE_ID,
    icon: icon,
    localeTranslations: layerTreeTranslations,
    component: LayerTreeComponent,
    showInSidebar: (config as WidgetConfig).base?.showInSidebar ?? true,
    ...(config as WidgetConfig).size,
    settings: (config as WidgetConfig).settings ?? [],
};

export default LayerTree;
