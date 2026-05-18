import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

/**
 * Base framework strings (namespace: 'core').
 * These are the minimal set of strings used by core UI components.
 */
export const coreTranslations: Record<
    string,
    Partial<Record<SupportedLanguage, TranslationDict>>
> = {
    core: {
        en: {
            // ErrorScreen / InlineError
            "error.title": "Initialization failed",
            "error.retry": "Retry",

            // ContextMenu
            "contextMenu.mapTools": "Map Tools",

            // AttributeTable
            "attributeTable.show": "Show",
            "attributeTable.hide": "Hide",
            "attributeTable.clearFilters": "Clear filters",
            "attributeTable.noData": "No data available",
            "attributeTable.loading": "Loading...",
            "attributeTable.yes": "Yes",
            "attributeTable.no": "No",
            "attributeTable.attribute": "Attribute",
            "attributeTable.value": "Value",
            "attributeTable.nullValue": "—",
            "attributeTable.retry": "Retry",
            "attributeTable.filters": "filters",
            "attributeTable.filterAttributes": "Filter attributes...",
            "attributeTable.filterValues": "Filter values...",
            "attributeTable.filterColumn": "Filter {column}...",
            "attributeTable.zoomToObject": "Zoom to object",
            "attributeTable.rowNumber": "#",

            // WidgetGrid
            "widgetGrid.dragToTop":
                "Drag to top edge to stretch horizontally (full width)",
            "widgetGrid.dragToBottom":
                "Drag to bottom edge to stretch horizontally (full width)",
            "widgetGrid.dragToLeft":
                "Drag to left edge to stretch vertically (full height)",
            "widgetGrid.dragToRight":
                "Drag to right edge to stretch vertically (full height)",
            "widgetGrid.dragToMove": 'Drag to move "{name}"',
            "widgetGrid.close": "Close",
            "widgetGrid.closeLabel": "Close {name}",
        },
    },
};
