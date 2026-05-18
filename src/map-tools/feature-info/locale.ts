import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const featureInfoTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "tool.name": "Feature Info",
        eyebrow: "Feature Info",
        instructions: "Click on the map to get information about objects",
        noClickYet: "No click yet. Click anywhere on the map.",
        noFeatures: "No features found at this location",
        loading: "Querying WMS layers...",
        "layer.label": "Layer:",
        "select.placeholder": "No features found",
        "option.label": "{layerName} ({count} {features}){loadingSuffix}",
        "option.feature": "feature",
        "option.features": "features",
        "option.loadingSuffix": " ...",
        "button.close": "Close",
        "provider.xyzNotAvailable": "XYZ raster — feature info not available",
        "provider.cogNotAvailable":
            "COG raster — feature info not yet implemented",
        "provider.wmsFailed": "GetFeatureInfo failed",
        "provider.noFeatures": "No features found in WMS response",
    },
};
