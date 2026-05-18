import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const pointColorSchemeTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "tool.name": "Point Color Scheme",
        "label.colorBy": "Color by:",
        "scheme.rgb": "RGB/natural colors",
        "scheme.classification": "By classification",
        "scheme.elevation": "By elevation",
        "scheme.intensity": "By intensity",
        "aria.colorScheme": "Color scheme",
    },
};
