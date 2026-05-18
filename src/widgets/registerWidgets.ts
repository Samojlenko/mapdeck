import type { RootStore } from "@core/framework/store";
import AttributeTableWidget from "@widgets/attribute-table";
import LayerTree from "@widgets/layer-tree";
import MapViewer from "@widgets/map-viewer";
import SettingsWidget from "@widgets/settings";
import Sidebar from "@widgets/sidebar";

const BUILT_IN_WIDGETS = [
    MapViewer,
    SettingsWidget,
    LayerTree,
    Sidebar,
    AttributeTableWidget,
];

export async function registerBuiltInWidgets(
    rootStore: RootStore,
): Promise<void> {
    for (const widget of BUILT_IN_WIDGETS) {
        if (widget.localeTranslations) {
            rootStore.localeStore.registerTranslations(
                widget.id,
                widget.localeTranslations,
            );
        }
    }

    await rootStore.catalogStore.registerWidget(MapViewer);
    await rootStore.catalogStore.registerWidget(SettingsWidget);
    await rootStore.catalogStore.registerWidget(LayerTree);
    await rootStore.catalogStore.registerWidget(Sidebar);
    await rootStore.catalogStore.registerWidget(AttributeTableWidget);
}
