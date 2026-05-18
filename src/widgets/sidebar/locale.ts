import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const sidebarTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "widget.name": "Widgets",
        "aria.selectWidget": "Select {name} widget",
    },
};
