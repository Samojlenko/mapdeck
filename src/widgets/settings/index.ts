import type { Widget } from "@core/framework/types";
import icon from "@core/ui/icons/settings.svg";
import { settingsTranslations } from "./locale";
import SettingsWidgetComponent from "./components/Widget";
import type { SettingsWidgetProps } from "./types";
import config from "./config.json";

export const SETTINGS_ID = "settings-widget" as const;

const SettingsWidget: Widget<SettingsWidgetProps> = {
    id: SETTINGS_ID,
    icon: icon,
    localeTranslations: settingsTranslations,
    component: SettingsWidgetComponent,
    showInSidebar: config.base?.showInSidebar ?? true,
    ...config.size,
};

export default SettingsWidget;
