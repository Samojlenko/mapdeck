import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { observer } from "mobx-react-lite";
import { autorun } from "mobx";
import { useRootStore } from "@core/framework/store";
import { MapToolsOverlay } from "@core/framework/ui/map-tools-overlay";
import { ContextMenu, useContextMenu } from "@core/ui/components";
import {
    isMapTool,
    isMapActionTool,
    LOCALE_KEY_TOOL_NAME,
    type AnyMapTool,
} from "@core/framework/types";
import { updateBasemap } from "../utils/basemapLayerManager";
import { getActiveBasemap } from "@map-tools/basemap/utils/basemapSettings";
import { isStaticClick } from "../utils/isStaticClick";
import type { MapViewerProps } from "../types";
import styles from "./Widget.module.css";

const DRAG_THRESHOLD = 5;

const MapViewerComponent = observer(({ className = "" }: MapViewerProps) => {
    const rootStore = useRootStore();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const rightClickStartRef = useRef<{ x: number; y: number } | null>(null);
    const contextMenu = useContextMenu();

    useEffect(() => {
        if (!mapContainerRef.current) return;

        rootStore.mapStore.initializeMap(mapContainerRef.current);
        const map = rootStore.mapStore.getMap()!;
        mapRef.current = map;

        const basemapDisposer = autorun(() => {
            const activeBasemap = getActiveBasemap(rootStore);
            if (map.loaded()) {
                updateBasemap(map, activeBasemap);
            } else {
                map.once("load", () => updateBasemap(map, activeBasemap));
            }
        });

        const handleMouseDown = (
            event: maplibregl.MapMouseEvent & { originalEvent: MouseEvent },
        ) => {
            if (event.originalEvent.button === 2) {
                rightClickStartRef.current = {
                    x: event.point.x,
                    y: event.point.y,
                };
            }
        };

        const handleContextMenu = (
            event: maplibregl.MapMouseEvent & { originalEvent: MouseEvent },
        ) => {
            event.preventDefault();
            const start = rightClickStartRef.current;
            if (!start) return;

            if (
                isStaticClick(
                    start,
                    { x: event.point.x, y: event.point.y },
                    DRAG_THRESHOLD,
                )
            ) {
                contextMenu.open({
                    x: event.originalEvent.clientX,
                    y: event.originalEvent.clientY,
                });
            }
            rightClickStartRef.current = null;
        };

        map.on("mousedown", handleMouseDown);
        map.on("contextmenu", handleContextMenu);

        return () => {
            map.off("mousedown", handleMouseDown);
            map.off("contextmenu", handleContextMenu);
            basemapDisposer();
            rootStore.mapStore.dispose();
            mapRef.current = null;
        };
        // rootStore and contextMenu are stable references — run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToolClick = (tool: AnyMapTool) => {
        if (isMapTool(tool)) {
            rootStore.mapToolStore.toggleTool(tool.id);
        } else if (isMapActionTool(tool)) {
            rootStore.mapToolStore.executeTool(tool.id);
        }
        contextMenu.close();
    };

    const tools = rootStore.mapToolStore.toolsList;
    const activeToolId = rootStore.mapToolStore.activeToolId;
    const dict = rootStore.localeStore.t("core");

    const containerClassName = [styles.mapViewer, className]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={containerClassName}>
            <div ref={mapContainerRef} className={styles.mapContainer} />
            <MapToolsOverlay />
            <ContextMenu
                isOpen={contextMenu.isOpen}
                position={contextMenu.position}
                onClose={contextMenu.close}
                tools={tools}
                activeToolId={activeToolId}
                onToolClick={handleToolClick}
                dict={dict}
                resolveToolName={(id) =>
                    rootStore.localeStore.t(id)[LOCALE_KEY_TOOL_NAME] ?? id
                }
            />
        </div>
    );
});

export default MapViewerComponent;
