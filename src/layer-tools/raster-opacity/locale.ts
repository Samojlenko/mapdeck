import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const rasterOpacityTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "tool.name": "Raster Opacity",
        "label.opacity": "Opacity: {percent}%",
        "aria.opacity": "Layer opacity",
    },
};
