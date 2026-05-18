/**
 * Factory for creating default layer configurations by role.
 * Encapsulates sensible defaults for each LayerRole variant.
 */
import { type LayerConfig, LayerRole, ColorScheme } from "@core/framework/types";

export function createDefaultConfig(role: LayerRole): LayerConfig {
    switch (role) {
        case LayerRole.RASTER:
            return {
                role: LayerRole.RASTER,
                type: "xyz",
                url: "",
                opacity: 1.0,
                visible: true,
                paint: {
                    "raster-opacity": 1.0,
                    "raster-brightness-min": 0,
                    "raster-brightness-max": 1,
                    "raster-contrast": 0,
                    "raster-saturation": 0,
                    "raster-hue-rotate": 0,
                    "raster-resampling": "linear",
                },
            };
        case LayerRole.VECTOR:
            return {
                role: LayerRole.VECTOR,
                layerType: "fill",
                opacity: 1.0,
                visible: true,
                paint: {
                    "fill-color": "#3f51b5",
                    "fill-opacity": 0.7,
                },
            };
        case LayerRole.POINT_CLOUD:
            return {
                role: LayerRole.POINT_CLOUD,
                opacity: 1.0,
                visible: true,
                pointSize: 1,
                colorScheme: ColorScheme.RGB,
                intensityMin: 0,
                intensityMax: 1,
                filterByClassification: false,
            };
        case LayerRole.VECTOR3D:
            return {
                role: LayerRole.VECTOR3D,
                url: "",
                opacity: 1.0,
                visible: true,
                lineWidth: 2,
                lineColor: "#3f51b5",
            };
    }
}
