import type { SupportedLanguage, TranslationDict } from "@core/framework/types";

export const volumeMeasureTranslations: Partial<
    Record<SupportedLanguage, TranslationDict>
> = {
    en: {
        "tool.name": "Measure Volume",
        eyebrow: "Volume Measure",
        "summary.volume": "Volume:",
        "summary.surfaceArea": "Surface area:",
        "summary.baseZ": "Base Z:",
        "summary.surfaceZ": "Surface Z:",
        "summary.cloudPoints": "Cloud points:",
        "summary.gridCells": "Grid cells:",
        "summary.cellSize": "Cell size:",
        "button.resetAll": "Reset All",
        "button.closeTool": "Close Tool",
        "hint.normal":
            "Click to draw boundary. Middle-click or Enter to complete",
        "hint.complete": "Boundary complete. ESC to reset",
    },
};
