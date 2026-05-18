/** Supported language codes */
export type SupportedLanguage = "en";

/** Default language used as fallback */
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/** Flat string map per namespace — no rigid schema */
export type TranslationDict = Record<string, string>;

/** Locale key for the display name of a tool */
export const LOCALE_KEY_TOOL_NAME = "tool.name" as const;
