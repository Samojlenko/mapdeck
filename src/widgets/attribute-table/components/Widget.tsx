import { observer } from "mobx-react-lite";
import { useRootStore } from "@core/framework/store";
import { InlineError } from "@core/ui/components";
import { DataTable } from "@core/ui/composites/data-table";
import { AttributeTableStore, PAGE_SIZE } from "../store/AttributeTableStore";
import type { AttributeLayerInfo } from "../utils/index";
import type { AttributeTableWidgetProps } from "../types";
import { GroupedOptions } from "./GroupedOptions";
import styles from "./Widget.module.css";
import { ATTRIBUTE_TABLE_WIDGET_ID } from "../index";

function getSelectedLayerTitle(
    selectedLayerId: string | null,
    layers: AttributeLayerInfo[],
): string | undefined {
    if (!selectedLayerId) return undefined;
    return layers.find((l) => l.id === selectedLayerId)?.title;
}

/**
 * Attribute Table Widget.
 * Displays a dropdown to select WFS layers and shows their feature data
 * with lazy loading, sorting, and filtering support.
 */
const AttributeTableWidget = observer<AttributeTableWidgetProps>(
    ({ className = "" }) => {
        const rootStore = useRootStore();
        const dict = rootStore.localeStore.t(ATTRIBUTE_TABLE_WIDGET_ID);
        const coreDict = rootStore.localeStore.t("core");

        // Get or create persisted store from WidgetOverlayStore registry.
        // This store survives widget close/open cycles.
        const store = rootStore.overlayStore.getWidgetStore(
            ATTRIBUTE_TABLE_WIDGET_ID,
            () =>
                new AttributeTableStore(rootStore, {
                    maxFeaturesPerRequest: 1000,
                }),
        );

        const attributeLayers = store.attributeLayers;
        const hasLayers = attributeLayers.length > 0;
        const selectedLayerTitle = getSelectedLayerTitle(
            store.selectedLayerId,
            attributeLayers,
        );

        return (
            <div className={`${styles.widget} ${className}`}>
                <div className={styles.layerSelector}>
                    <label className={styles.layerSelectorLabel}>
                        {dict["layerSelector.label"]}
                    </label>
                    {!hasLayers ? (
                        <div className={styles.emptyState}>
                            {dict["empty.noLayers"]}
                        </div>
                    ) : (
                        <select
                            className={styles.layerSelect}
                            value={store.selectedLayerId ?? ""}
                            onChange={(e) =>
                                store.selectLayer(e.target.value || null)
                            }
                            aria-label={dict["aria.layerSelect"]}
                        >
                            <option value="">
                                {dict["layerSelector.placeholder"]}
                            </option>
                            <GroupedOptions layers={attributeLayers} />
                        </select>
                    )}
                </div>

                {store.error && (
                    <InlineError
                        message={store.error}
                        onRetry={store.refreshData}
                        dict={coreDict}
                    />
                )}

                {store.selectedLayerId && (
                    <div className={styles.tableArea}>
                        <DataTable
                            rows={store.loadedFeatures}
                            {...(store.columns.length > 0 && {
                                columns: store.columns,
                            })}
                            {...(selectedLayerTitle && {
                                header: selectedLayerTitle,
                            })}
                            totalRows={store.totalFeatures}
                            loading={store.isBusy}
                            fetchMore={store.loadNextPage}
                            pageSize={PAGE_SIZE}
                            sortColumn={store.sortColumn}
                            sortDirection={store.sortDirection}
                            onSort={store.setSort}
                            onRefresh={store.refreshData}
                            {...(store.geometryColumn && {
                                geometryColumn: store.geometryColumn,
                            })}
                            dict={coreDict}
                        />
                    </div>
                )}
            </div>
        );
    },
);

export default AttributeTableWidget;
