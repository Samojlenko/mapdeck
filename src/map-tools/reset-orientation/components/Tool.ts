import type { MapActionTool, MapToolPlacement } from "@core/framework/types";
import type { RootStore } from "@core/framework/store";
import { resetOrientationTranslations } from "../locale";

export const RESET_ORIENTATION_TOOL_ID = "reset-orientation" as const;

/**
 * Map tool that resets camera orientation (pitch to 0) and rotates to north (bearing to 0)
 * This is an action tool - it executes on click without affecting other active tools
 */
export class ResetOrientationTool implements MapActionTool {
    readonly id = RESET_ORIENTATION_TOOL_ID;
    readonly icon = "compass";
    readonly placement: MapToolPlacement = "top-right";
    readonly order = 5;
    readonly localeTranslations = resetOrientationTranslations;

    execute(rootStore: RootStore): void {
        const map = rootStore.mapStore.getMap();
        if (!map) return;

        // Reset both pitch and bearing to 0 (top-down view facing north)
        map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 500,
        });
    }
}

export default ResetOrientationTool;
