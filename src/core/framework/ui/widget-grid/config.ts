import type { WidgetSize } from "@core/framework/types";

/**
 * Grid layout configuration in grid units
 */
export const WIDGET_GRID_CONFIG = {
    COLUMNS: 80,
    ROWS: 45,
    DEFAULT_WIDTH: 20,
    DEFAULT_HEIGHT: 15,
    DEFAULT_MIN_WIDTH: 5,
    DEFAULT_MIN_HEIGHT: 5,
    DEFAULT_MAX_WIDTH: 40,
    DEFAULT_MAX_HEIGHT: 30,
} as const;

/**
 * Default widget size with all fallbacks applied
 */
export const WIDGET_GRID_DEFAULT_SIZE: WidgetSize = {
    defaultWidth: WIDGET_GRID_CONFIG.DEFAULT_WIDTH,
    defaultHeight: WIDGET_GRID_CONFIG.DEFAULT_HEIGHT,
    minW: WIDGET_GRID_CONFIG.DEFAULT_MIN_WIDTH,
    minH: WIDGET_GRID_CONFIG.DEFAULT_MIN_HEIGHT,
    maxW: WIDGET_GRID_CONFIG.DEFAULT_MAX_WIDTH,
    maxH: WIDGET_GRID_CONFIG.DEFAULT_MAX_HEIGHT,
};
