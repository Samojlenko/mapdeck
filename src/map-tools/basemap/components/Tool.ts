import { makeObservable, observable, type IReactionDisposer } from "mobx";
import maplibregl from "maplibre-gl";

import type {
    MapTool,
    MapToolPlacement,
    SettingMetadata,
    BaseMapConfig,
} from "@core/framework/types";
import { BasemapComponent } from "./Grid";
import basemapConfigData from "../config.json";
import { basemapTranslations } from "../locale";

const basemapConfigs = basemapConfigData as BaseMapConfig[];

export const BASEMAP_TOOL_ID = "basemap" as const;

export class BasemapTool implements MapTool {
    readonly id = BASEMAP_TOOL_ID;
    readonly icon = "map";
    readonly placement: MapToolPlacement = "top-right";
    readonly order = 10;
    readonly component = BasemapComponent;
    readonly settings: SettingMetadata[];
    readonly localeTranslations = basemapTranslations;

    isActive = false;
    private _disposers: IReactionDisposer[] = [];

    constructor() {
        makeObservable(this, {
            isActive: observable,
        });

        const basemaps = basemapConfigs.map((bm) => ({
            label: bm.name,
            value: bm.id,
        }));

        this.settings = [
            {
                id: `${BASEMAP_TOOL_ID}.basemap`,
                label: "Basemap",
                type: "select",
                defaultValue: basemaps[0]?.value ?? basemapConfigs[0]?.id ?? "",
                options: basemaps,
            },
        ];
    }

    activate(_map: maplibregl.Map): void {
        this.isActive = true;
    }

    deactivate(): void {
        this.isActive = false;
        this._disposers.forEach((disposer) => disposer());
        this._disposers = [];
    }

    addDisposer(disposer: IReactionDisposer): void {
        this._disposers.push(disposer);
    }
}

export default BasemapTool;
