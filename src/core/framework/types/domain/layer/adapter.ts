/**
 * Layer adapter interface for role-based rendering.
 * Replaces ILayerProvider in the new architecture.
 *
 * Each adapter is responsible for managing layers of a specific role
 * on the map, including creation, removal, and visibility control.
 */
import type { LayerRole } from "./role";
import type { LayerConfig } from "./config";
import type { RenderUnit } from "./renderUnit";
import type maplibregl from "maplibre-gl";

export interface LayerAdapter {
    /**
     * The layer role this adapter supports.
     * Used by factories to route layer operations to the appropriate adapter.
     */
    readonly supportedRole: LayerRole;

    /**
     * Add a layer to the map.
     * @param layerId - Unique identifier for the layer
     * @param config - Layer configuration for rendering
     * @param sourceRef - Reference to source data (URL)
     * @param map - Map instance to add the layer to
     */
    addToMap(
        layerId: string,
        config: LayerConfig,
        sourceRef: string,
        map: maplibregl.Map,
    ): void;

    /**
     * Remove a layer from the map.
     * @param layerId - Unique identifier for the layer
     * @param map - Map instance to remove the layer from
     */
    removeFromMap(layerId: string, map: maplibregl.Map): void;

    /**
     * Update layer visibility.
     * @param layerId - Unique identifier for the layer
     * @param visible - Whether the layer should be visible
     * @param map - Map instance containing the layer
     */
    updateVisibility(
        layerId: string,
        visible: boolean,
        map: maplibregl.Map,
    ): void;

    /**
     * Apply a new render unit configuration to the map.
     *
     * Called by LayerManager when a layer's config or source changes.
     * Each adapter decides how to handle the update:
     * - May update visual properties in-place (e.g. point cloud color scheme).
     * - Otherwise falls back to removeFromMap + addToMap.
     *
     * @param renderUnit - The render unit with new config and source reference
     * @param map - Map instance containing the layer
     */
    updateConfig(renderUnit: RenderUnit, map: maplibregl.Map): void;
}
