import { makeObservable, observable } from "mobx";
import maplibregl from "maplibre-gl";

import type { MapTool, MapToolPlacement } from "@core/framework/types";
import type { IconName } from "@core/ui/components";
import { VolumeMeasureComponent } from "./Panel";
import { volumeMeasureTranslations } from "../locale";

export class VolumeMeasureTool implements MapTool {
    readonly id = "volume-measure";
    readonly icon: IconName = "volume";
    readonly placement: MapToolPlacement = "top-right";
    readonly order = 40;
    readonly component = VolumeMeasureComponent;
    readonly localeTranslations = volumeMeasureTranslations;

    isActive = false;

    constructor() {
        makeObservable(this, {
            isActive: observable,
        });
    }

    activate(_map: maplibregl.Map): void {
        this.isActive = true;
    }

    deactivate(): void {
        this.isActive = false;
    }
}

export default VolumeMeasureTool;
