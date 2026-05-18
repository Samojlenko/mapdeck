# Localization

## Principles

- **All user-facing strings** go through `t()` from `useLocale()`
- **No hardcoded UI text** — zero exceptions for labels, tooltips, placeholders, errors, notifications
- **Locale is reactive** — `currentLang` is MobX observable, `observer()` components re-render automatically
- **No third-party i18n library** — custom lightweight system built on MobX + TypeScript

## Translation dictionaries

- Stored as TypeScript files in `src/core/framework/i18n/dictionaries/{locale}.ts`
- Each file exports a `Record<string, Partial<Record<SupportedLanguage, TranslationDict>>>` keyed by namespace
- Currently only `en.ts` exists; `SupportedLanguage` is `"en"` only

## Locale file per extension

Each extension (widget, tool, map tool, module) stores its translations in a `locale.ts` file inside its own directory.

The `locale.ts` file exports a dictionary fragment for a dedicated namespace matching the extension id:

```ts
// src/widgets/attribute-table/locale.ts
import type { SupportedLanguage, TranslationDict } from "@core/types";

export const attributeTableTranslations: Record<
    string,
    Partial<Record<SupportedLanguage, TranslationDict>>
> = {
    "attribute-table": {
        en: {
            "show": "Show",
            "hide": "Hide",
            "noData": "No data available",
        },
    },
};
```

## Adding a new locale

1. Add the language code to `SupportedLanguage` in `src/core/framework/types/framework/locale.ts`
2. Create `src/core/framework/i18n/dictionaries/{locale}.ts` with translations for all namespaces

## Rules

| What | Rule |
|---|---|
| Dynamic strings | Never build sentences via concatenation — use template literals |
| Numbers & dates | Use `Intl` formatters, not manual formatting |
| Fallback | Missing key → fall back to `en` → fall back to empty string |
| Namespace | Use the extension id as namespace (e.g. `"attribute-table"`, `"basemap"`) |

## Related

- [state-management.md](../domain/state-management.md) — `LocaleStore` lives directly on RootStore
