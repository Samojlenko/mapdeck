import type { LayoutItem } from "react-grid-layout";
import { collides } from "react-grid-layout/core";
import type { Widget, WidgetSize } from "@core/framework/types";
import {
    WIDGET_GRID_CONFIG,
    WIDGET_GRID_DEFAULT_SIZE,
} from "@core/framework/ui/widget-grid/config";

/** Grid configuration for react-grid-layout */
export const GRID_CONFIG = {
    cols: WIDGET_GRID_CONFIG.COLUMNS,
    rows: WIDGET_GRID_CONFIG.ROWS,
    defaultWidth: WIDGET_GRID_CONFIG.DEFAULT_WIDTH,
    defaultHeight: WIDGET_GRID_CONFIG.DEFAULT_HEIGHT,
    rowHeight: 30,
    margin: [10, 10] as const,
    containerPadding: [0, 0] as const,
};

/**
 * Get widget size from its definition (with defaults as fallback)
 */
export function getWidgetSize(widgetDef: Widget | undefined): WidgetSize {
    const size: WidgetSize = { ...WIDGET_GRID_DEFAULT_SIZE };

    if (widgetDef) {
        size.defaultWidth = widgetDef.defaultWidth ?? size.defaultWidth;
        size.defaultHeight = widgetDef.defaultHeight ?? size.defaultHeight;
        size.minW = widgetDef.minWidth ?? size.minW;
        size.minH = widgetDef.minHeight ?? size.minH;
        size.maxW = widgetDef.maxWidth ?? size.maxW;
        size.maxH = widgetDef.maxHeight ?? size.maxH;
    }

    return size;
}

/**
 * Find a free position on the grid that doesn't collide with existing items.
 */
export function findFreePosition(
    size: WidgetSize,
    widgetId: string,
    existingLayouts: LayoutItem[],
): LayoutItem | null {
    const maxCols = WIDGET_GRID_CONFIG.COLUMNS;
    const maxRows = WIDGET_GRID_CONFIG.ROWS;

    const testItem: LayoutItem = {
        i: widgetId,
        x: 0,
        y: 0,
        w: size.defaultWidth,
        h: size.defaultHeight,
        minW: size.minW,
        minH: size.minH,
        maxW: size.maxW,
        maxH: size.maxH,
    };

    for (let y = 0; y <= maxRows - size.defaultHeight; y++) {
        for (let x = 0; x <= maxCols - size.defaultWidth; x++) {
            testItem.x = x;
            testItem.y = y;

            const hasCollision = existingLayouts.some((item) =>
                collides(testItem, item),
            );

            if (!hasCollision) {
                return { ...testItem };
            }
        }
    }

    return null;
}

/**
 * Create a default layout for a widget, trying to find a free position first.
 */
export function createDefaultLayout(
    widgetId: string,
    existingLayouts: LayoutItem[],
    getWidget: (id: string) => Widget | undefined,
): LayoutItem {
    const widgetDef = getWidget(widgetId);
    const size = getWidgetSize(widgetDef);

    const clampedWidth = Math.max(
        size.minW,
        Math.min(size.defaultWidth, size.maxW),
    );
    const clampedHeight = Math.max(
        size.minH,
        Math.min(size.defaultHeight, size.maxH),
    );

    const freePosition = findFreePosition(size, widgetId, existingLayouts);

    return (
        freePosition ?? {
            i: widgetId,
            x: 0,
            y: 0,
            w: clampedWidth,
            h: clampedHeight,
            minW: size.minW,
            minH: size.minH,
            maxW: size.maxW,
            maxH: size.maxH,
        }
    );
}
