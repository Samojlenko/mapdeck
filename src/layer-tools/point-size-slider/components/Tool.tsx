import type { LayerTool } from "@core/framework/types";
import { LayerRole } from "@core/framework/types";
import { PointSizeSliderComponent } from "./Panel";
import { pointSizeSliderTranslations } from "../locale";

export const POINT_SIZE_SLIDER_ID = "point-size-slider";

export const pointSizeTool: LayerTool = {
    id: POINT_SIZE_SLIDER_ID,
    role: LayerRole.POINT_CLOUD,
    localeTranslations: pointSizeSliderTranslations,
    component: (nodeId: string) => <PointSizeSliderComponent nodeId={nodeId} />,
};
