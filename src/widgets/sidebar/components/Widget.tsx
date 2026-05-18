import { observer } from "mobx-react-lite";

import { useRootStore } from "@core/framework/store";

import WidgetButton from "./WidgetButton";
import { filterSidebarWidgets } from "../utils/filterSidebarWidgets";
import type { SidebarProps } from "../types";
import styles from "./Widget.module.css";

const SidebarComponent = observer(
    ({ excludedWidgetIds = [] }: SidebarProps) => {
        const rootStore = useRootStore();
        const { overlayStore } = rootStore;

        const widgets = filterSidebarWidgets(
            rootStore.catalogStore.allWidgets,
            excludedWidgetIds,
        );

        const handleWidgetClick = (widgetId: string) => {
            if (overlayStore.isWidgetOpen(widgetId)) {
                overlayStore.closeWidget(widgetId);
            } else {
                overlayStore.openWidget(widgetId);
            }
        };

        return (
            <div className={`${styles.sidebar} ${styles.sidebarCollapsed}`}>
                <div className={styles.sidebar__widgetsList}>
                    {widgets.map((widget) => (
                        <WidgetButton
                            key={widget.id}
                            widget={widget}
                            isOpen={overlayStore.openWidgetIds.includes(
                                widget.id,
                            )}
                            onClick={handleWidgetClick}
                        />
                    ))}
                </div>
            </div>
        );
    },
);

export default SidebarComponent;
