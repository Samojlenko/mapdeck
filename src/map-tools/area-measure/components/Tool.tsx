import { makeObservable, observable } from "mobx";
import maplibregl from "maplibre-gl";

import type { MapTool, MapToolPlacement } from "@core/framework/types";
import type { IconName } from "@core/ui/components";
import { AreaMeasureComponent } from "./Panel";
import { areaMeasureTranslations } from "../locale";

export class AreaMeasureTool implements MapTool {
    readonly id = "area-measure";
    readonly icon: IconName = "area";
    readonly placement: MapToolPlacement = "top-right";
    readonly order = 30;
    readonly component = AreaMeasureComponent;
    readonly localeTranslations = areaMeasureTranslations;

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

export default AreaMeasureTool;
