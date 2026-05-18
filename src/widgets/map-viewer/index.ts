import type { Widget } from "@core/framework/types";
import icon from "@core/ui/icons/map.svg";
import { mapViewerTranslations } from "./locale";
import MapViewerComponent from "./components/Widget";
import type { MapViewerProps } from "./types";
import config from "./config.json";

export const MAP_VIEWER_ID = "map-viewer" as const;

const MapViewer: Widget<MapViewerProps> = {
    id: MAP_VIEWER_ID,
    icon: icon,
    localeTranslations: mapViewerTranslations,
    component: MapViewerComponent,
    showInSidebar: config.base?.showInSidebar ?? true,
    ...config.size,
};

export default MapViewer;
