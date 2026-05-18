/**
 * Core widget interface that all widgets must implement
 * This defines the metadata and contract for widgets in the Mapdeck system
 */

import type React from "react";
import type { RootStore } from "@core/framework/store";
import type { SettingMetadata } from "./settings";
import type { SupportedLanguage, TranslationDict } from "./locale";

export type WidgetComponent<TProps = Record<string, unknown>> = (
    props: TProps,
) => React.ReactNode | Promise<React.ReactNode>;

export interface WidgetContext {
    rootStore: RootStore;
}

export interface Widget<TProps = Record<string, unknown>> {
    // === Required Properties ===
    readonly id: string;
    readonly icon: string;
    readonly component: WidgetComponent<TProps>;

    // === Optional Size Constraints ===
    /** Maximum width in grid columns (falls back to core default: 40) */
    readonly maxWidth?: number | null;
    /** Maximum height in grid rows (falls back to core default: 30) */
    readonly maxHeight?: number | null;
    /** Minimum width in grid columns (falls back to core default: 5) */
    readonly minWidth?: number | null;
    /** Minimum height in grid rows (falls back to core default: 5) */
    readonly minHeight?: number | null;

    /** Default width in grid columns (falls back to core default: 20) */
    readonly defaultWidth?: number | null;
    /** Default height in grid rows (falls back to core default: 15) */
    readonly defaultHeight?: number | null;

    /** Lock aspect ratio during resize */
    readonly lockAspectRatio?: boolean;
    /** Aspect ratio value (width / height), used if lockAspectRatio is true */
    readonly aspectRatio?: number;

    /** Whether the widget should appear in the sidebar (default: true) */
    readonly showInSidebar?: boolean;

    /** Optional locale translations keyed by language */
    readonly localeTranslations?: Partial<
        Record<SupportedLanguage, TranslationDict>
    >;

    /** Settings metadata for automatic registration */
    readonly settings?: SettingMetadata[];

    // === Optional Lifecycle Methods ===
    initialize?(context: WidgetContext): void | Promise<void>;
    destroy?(): void | Promise<void>;
}
