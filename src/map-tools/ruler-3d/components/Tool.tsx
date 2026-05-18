import { makeObservable, observable } from "mobx";
import maplibregl from "maplibre-gl";

import type { MapTool, MapToolPlacement } from "@core/framework/types";
import type { IconName } from "@core/ui/components";
import { Ruler3DComponent } from "./Panel";
import { ruler3dTranslations } from "../locale";

export class Ruler3DTool implements MapTool {
    readonly id = "ruler-3d";
    readonly icon: IconName = "ruler";
    readonly placement: MapToolPlacement = "top-right";
    readonly order = 20;
    readonly component = Ruler3DComponent;
    readonly localeTranslations = ruler3dTranslations;

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

export default Ruler3DTool;
