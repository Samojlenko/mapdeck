import type { BaseMapConfig } from "@core/framework/types";

export interface BasemapToolData {
    availableBasemaps: BaseMapConfig[];
    activeBasemapId: string;
}
