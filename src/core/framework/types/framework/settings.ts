/**
 * Settings type definitions for the Mapdeck settings system
 */

export type SettingType = "string" | "number" | "select" | "boolean";

export interface SettingOption {
    label: string;
    value: string;
}

// Base interface for all setting types
interface BaseSettingMetadata {
    id: string;
    label: string;
}

// Discriminated union members
export interface StringSettingMetadata extends BaseSettingMetadata {
    type: "string";
    defaultValue: string;
}

export interface NumberSettingMetadata extends BaseSettingMetadata {
    type: "number";
    defaultValue: number;
    min?: number;
    max?: number;
    step?: number;
}

export interface SelectSettingMetadata extends BaseSettingMetadata {
    type: "select";
    defaultValue: string;
    options: SettingOption[];
}

export interface BooleanSettingMetadata extends BaseSettingMetadata {
    type: "boolean";
    defaultValue: boolean;
}

// Discriminated union type
export type SettingMetadata =
    | StringSettingMetadata
    | NumberSettingMetadata
    | SelectSettingMetadata
    | BooleanSettingMetadata;

// Registered setting with owner info and current value
export type RegisteredSetting = (
    | StringSettingMetadata
    | NumberSettingMetadata
    | SelectSettingMetadata
    | BooleanSettingMetadata
) & {
    ownerId: string; // ID of the widget/tool that owns this setting
    ownerName: string; // Display name of the owner
    value: unknown; // Current value (type depends on setting type)
};

export interface SettingsGroup {
    ownerId: string;
    ownerName: string;
    settings: RegisteredSetting[];
}
