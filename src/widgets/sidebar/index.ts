import type { Widget } from "@core/framework/types";
import { sidebarTranslations } from "./locale";
import SidebarComponent from "./components/Widget";
import type { SidebarProps } from "./types";
import config from "./config.json";

export const SIDEBAR_ID = "sidebar-widget" as const;

const Sidebar: Widget<SidebarProps> = {
    id: SIDEBAR_ID,
    icon: "",
    localeTranslations: sidebarTranslations,
    component: SidebarComponent,
    showInSidebar: config.base?.showInSidebar ?? true,
    ...config.size,
};

export default Sidebar;
