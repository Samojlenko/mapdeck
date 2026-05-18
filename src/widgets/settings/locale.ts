import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const settingsTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "widget.name": "Settings",
        "empty.noSettings": "No settings registered yet.",
        "validation.range": "Value must be between {min} and {max}",
        "validation.invalid": "Invalid value",
    },
};
