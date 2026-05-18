import type maplibregl from "maplibre-gl";

/**
 * Generic configuration for overlay manager initialization
 */
export interface OverlayConfig {
    /** Additional implementation-specific configuration */
    [key: string]: unknown;
}

/**
 * Generic layer metadata stored in the manager
 */
export interface ManagedLayer<TLayer = unknown> {
    id: string;
    layer: TLayer;
    visible: boolean;
}

/**
 * Generic interface for overlay managers
 */
export interface OverlayManager<TLayer = unknown> {
    /** Attach overlay to maplibre map */
    attachToMap(map: maplibregl.Map): void;
    /** Detach overlay from current map */
    detachFromMap(): void;
    /** Add a layer to the overlay */
    addLayer(layerId: string, layer: TLayer): void;
    /** Remove a layer from the overlay */
    removeLayer(layerId: string): boolean;
    /** Update properties of an existing layer */
    updateLayer(layerId: string, props: Partial<TLayer>): boolean;
    /** Update layer visibility */
    setLayerVisibility(layerId: string, visible: boolean): boolean;
    /** Check if overlay is attached to a map */
    isAttached(): boolean;
    /** Get current map instance */
    getMap(): maplibregl.Map | null;
    /** Get current overlay instance (implementation-specific) */
    getOverlay(): unknown | null;
    /** Clean up all resources */
    dispose(): void;
}
