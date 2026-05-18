import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const layerTreeTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "widget.name": "Layer Tree",
        loading: "Loading layers...",
        "error.prefix": "Error:",
        "empty.noMatch": "No matching layers",
        "empty.noLayers": "No layers available",
        "search.placeholder": "Search layers...",
        "aria.search": "Search layers",
        "button.update.disabledTitle": "Update functionality coming soon",
        "button.update.title": "Update layers",
        "aria.collapse": "Collapse",
        "aria.expand": "Expand",
        "aria.hideLayer": "Hide layer",
        "aria.showLayer": "Show layer",
        "aria.reportDocument": "Report document",
        "aria.layerType": "Layer type",
        "aria.zoomToExtent": "Zoom to extent",
        "aria.moreOptions": "More options",
        "aria.reports": "Reports",
        "label.reports": "Reports:",
        "aria.openReport": "Open {label} in new tab",
        "aria.downloadReport": "Download {label}",
    },
};
