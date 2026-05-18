import type { SettingMetadata } from "./settings";

/**
 * Widget size configuration schema (nullable fields for optional configuration)
 */
export interface WidgetSizeConfig {
    /** Default width in grid columns */
    defaultWidth?: number | null;
    /** Default height in grid rows */
    defaultHeight?: number | null;
    /** Minimum width in grid columns */
    minWidth?: number | null;
    /** Minimum height in grid rows */
    minHeight?: number | null;
    /** Maximum width in grid columns */
    maxWidth?: number | null;
    /** Maximum height in grid rows */
    maxHeight?: number | null;
}

/**
 * Widget base configuration (non-size related settings)
 */
export interface WidgetBaseConfig {
    /** Whether the widget should appear in the sidebar (default: true) */
    showInSidebar?: boolean;
}

/**
 * Complete widget configuration with all optional groups
 */
export interface WidgetConfig {
    /** Base widget configuration */
    base?: WidgetBaseConfig;
    /** Size configuration */
    size?: WidgetSizeConfig;
    /** Settings metadata for automatic registration */
    settings?: SettingMetadata[];
}

/**
 * Resolved widget size with all defaults applied (no nullable fields)
 * Uses react-grid-layout compatible property names
 */
export interface WidgetSize {
    defaultWidth: number;
    defaultHeight: number;
    minW: number;
    minH: number;
    maxW: number;
    maxH: number;
}
