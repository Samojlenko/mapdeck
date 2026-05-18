import type { SettingMetadata, SettingOption } from "@core/framework/types";

export interface SettingsWidgetProps {
    className?: string;
}

export interface RegisterSettingsOptions {
    ownerId: string;
    ownerName: string;
    settings: SettingMetadata[];
}

export type { SettingMetadata, SettingOption };
