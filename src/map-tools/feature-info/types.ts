import type maplibregl from "maplibre-gl";
import type { LayerNode } from "@core/framework/types";

/**
 * Source types for feature identification
 */
export type FeatureSourceType = "overlay" | "vector" | "wms";

/**
 * A single feature extracted from a map click
 */
export interface Feature {
    /** Unique identifier: `${layerId}_${index}` */
    id: string;
    /** Map/Deck layer ID */
    layerId: string;
    /** Human-readable name from LayerTreeStore */
    layerName: string;
    /** Source type for rendering */
    sourceType: FeatureSourceType;
    /** All available attributes */
    attributes: Record<string, unknown>;
    /** For grouping: all features from same layer share this key */
    groupId: string;
}

/**
 * Parameters for feature collection
 */
export interface CollectParams {
    screenX: number;
    screenY: number;
    map: maplibregl.Map;
    /** Pre-filtered visible layer nodes from LayerTreeStore */
    visibleLayers: LayerNode[];
    /** Signal to abort the collection (e.g. on new click or unmount) */
    signal?: AbortSignal;
    /** Placeholder message for XYZ raster layers (not supported) */
    xyzNotAvailableMessage?: string;
    /** Placeholder message for COG raster layers (not yet implemented) */
    cogNotAvailableMessage?: string;
}

/**
 * Interface for feature providers
 */
export interface FeatureProvider {
    /**
     * Collect features at the given screen coordinates.
     * May be sync (Deck.gl, Maplibre) or async (WMS).
     * Receives AbortSignal for cancellation support.
     */
    collect(params: CollectParams): Feature[] | Promise<Feature[]>;
}

/**
 * A group of features from the same layer
 */
export interface FeatureGroup {
    layerId: string;
    layerName: string;
    sourceType: FeatureSourceType;
    features: Feature[];
    /** True if WMS provider is still loading */
    loading: boolean;
}

/**
 * Result of feature collection
 */
export interface CollectResult {
    groups: FeatureGroup[];
    /** True if any WMS providers are still loading */
    loading: boolean;
}

/**
 * Click position for visual marker
 */
export interface ClickPosition {
    lng: number;
    lat: number;
}
