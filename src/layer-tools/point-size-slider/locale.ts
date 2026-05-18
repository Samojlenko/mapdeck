import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const pointSizeSliderTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "tool.name": "Point Size",
        "label.pointSize": "Point size: {value} px",
        "aria.pointSize": "Point size",
    },
};
