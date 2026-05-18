import { observer } from "mobx-react-lite";
import React from "react";
import { useRootStore } from "@core/framework/store";
import WidgetGrid, { WidgetGridWrapper } from "@core/framework/ui/widget-grid";
import Sidebar, { SIDEBAR_ID } from "@widgets/sidebar";
import styles from "./MapWorkspace.module.css";

const MapWorkspace: () => React.ReactNode = observer(() => {
    const rootStore = useRootStore();

    // Get Sidebar widget from registry, fallback to direct import for backward compatibility
    const sidebarWidget =
        rootStore.catalogStore.getWidgetById(SIDEBAR_ID) ?? Sidebar;
    const SidebarComponent = sidebarWidget.component;

    const getMapWidgetComponent = () => {
        const mapWidget = rootStore.catalogStore.getWidgetById("map-viewer");
        return mapWidget?.component;
    };

    const renderMap = () => {
        const MapComponent = getMapWidgetComponent();
        if (!MapComponent) return null;

        return (
            <div className={styles.mapArea}>
                <MapComponent className="main-map" />
                <WidgetGridWrapper>
                    <WidgetGrid />
                </WidgetGridWrapper>
            </div>
        );
    };

    return (
        <div className={styles.mapWorkspace}>
            <SidebarComponent />

            <div className={styles.mainContent}>{renderMap()}</div>
        </div>
    );
});

export default MapWorkspace;
