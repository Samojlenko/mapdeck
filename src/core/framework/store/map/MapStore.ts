import maplibregl from "maplibre-gl";
import { makeAutoObservable } from "mobx";
import { DeckOverlayManager } from "@core/domain/overlay";
import { LayerManager } from "@core/domain/managers/LayerManager";
import { logger } from "@core/shared/diagnostics/logger";
import { validateBbox, flattenTo2D, type Bbox } from "@core/shared/geo";
import { type RootStore } from "@core/framework/store";
import type { MapContext } from "@core/framework/types";

export class MapStore {
    private map: maplibregl.Map | null = null;
    readonly overlayManager: DeckOverlayManager;
    private layerManager: LayerManager | null = null;

    constructor(readonly rootStore: RootStore) {
        this.overlayManager = new DeckOverlayManager();
        makeAutoObservable(this, { rootStore: false });
    }

    /** Atomically returns map + overlayManager when the map is initialized */
    get context(): MapContext | null {
        return this.map
            ? { map: this.map, overlayManager: this.overlayManager }
            : null;
    }

    /** Get the current map instance */
    getMap(): maplibregl.Map | null {
        return this.map;
    }

    /**
     * Initialize a new maplibre-gl Map and attach it to the store.
     * Sets up deck.gl overlay, LayerManager, and notifies MapToolStore.
     * Call dispose() on unmount to clean up.
     */
    initializeMap(container: HTMLDivElement): void {
        const map = new maplibregl.Map({
            container,
            style: {
                version: 8,
                sources: {},
                layers: [],
            },
            center: [0, 0],
            zoom: 1,
        });

        this.setMap(map);
    }

    /**
     * Set the current map instance
     * @param map - Maplibre GL map instance
     */
    setMap(map: maplibregl.Map): void {
        if (this.map === map) {
            return;
        }

        if (this.layerManager) {
            this.layerManager.dispose();
            this.layerManager = null;
        }

        this.map = map;

        this.overlayManager.attachToMap(map);

        this.layerManager = new LayerManager(this.rootStore, {
            map,
            overlayManager: this.overlayManager,
        });
        this.layerManager.initialize();

        this.rootStore.mapToolStore.onMapChanged(map);
    }

    /**
     * Zoom the map to the specified bounding box.
     * Caller must ensure bbox is defined and meaningful.
     * @param bbox - Bounding box as [west, south, east, north] or [west, south, minZ, east, north, maxZ]
     */
    zoomToExtent(bbox: Bbox): void {
        if (!this.map) {
            logger.warn("Cannot zoom: map not available");
            return;
        }

        const validation = validateBbox(bbox);
        if (!validation.isValid) {
            logger.warn(`Cannot zoom: ${validation.error}`);
            return;
        }

        try {
            const bbox2D = flattenTo2D(bbox);
            this.map.fitBounds(bbox2D.bounds, {
                padding: { top: 20, bottom: 20, left: 20, right: 20 },
                maxZoom: 18,
                duration: 500,
            });
        } catch (error) {
            logger.error("Failed to zoom to extent:", error);
        }
    }

    /**
     * Apply a style fragment to the map, prefixing all source and layer IDs.
     * Source references in layers are remapped to use the same prefix.
     * Tracks owned IDs in the caller-provided Set.
     */
    applyStyleFragment(
        style: Partial<maplibregl.StyleSpecification>,
        prefix: string,
        ownedIds: Set<string>,
    ): void {
        if (!this.map) return;

        const { sources, layers, sprite, glyphs } = style;

        if (sources) {
            this._addStyleSources(sources, prefix, ownedIds);
        }

        if (layers) {
            this._addStyleLayers(layers, prefix, ownedIds);
        }

        if (sprite) {
            this._setStyleSprite(sprite);
        }

        if (glyphs) {
            this.map.setGlyphs(glyphs as string);
        }
    }

    private _addStyleSources(
        sources: Record<string, maplibregl.SourceSpecification>,
        prefix: string,
        ownedIds: Set<string>,
    ): void {
        for (const [srcId, srcSpec] of Object.entries(sources)) {
            const prefixedId = prefix + srcId;
            this.map!.addSource(prefixedId, srcSpec);
            ownedIds.add(prefixedId);
        }
    }

    private _addStyleLayers(
        layers: maplibregl.LayerSpecification[],
        prefix: string,
        ownedIds: Set<string>,
    ): void {
        const beforeId = this._findBeforeId(prefix);

        for (const layerSpec of layers) {
            const prefixedId = prefix + layerSpec.id;
            const spec = { ...layerSpec } as Record<string, unknown>;
            spec.id = prefixedId;

            if ("source" in spec && typeof spec.source === "string") {
                spec.source = prefix + (spec.source as string);
            }

            this.map!.addLayer(spec as maplibregl.LayerSpecification, beforeId);
            ownedIds.add(prefixedId);
        }
    }

    private _setStyleSprite(sprite: string | Array<{ url: string }>): void {
        const spriteUrl = typeof sprite === "string" ? sprite : sprite[0]?.url;
        if (spriteUrl) {
            const absoluteUrl = new URL(spriteUrl, window.location.origin).href;
            this.map!.setSprite(absoluteUrl);
        }
    }

    /**
     * Remove layers then sources for the given set of owned IDs.
     * Safe to call with IDs that don't exist on the map.
     */
    removeOwnedLayers(ownedIds: Set<string>): void {
        if (!this.map) return;

        for (const id of ownedIds) {
            if (this.map.getLayer(id)) {
                try {
                    this.map.removeLayer(id);
                } catch {
                    // Layer may have been removed externally
                }
            }
        }

        for (const id of ownedIds) {
            if (this.map.getSource(id)) {
                try {
                    this.map.removeSource(id);
                } catch {
                    // Source may have been removed externally
                }
            }
        }
    }

    /** Find the insertion point: first non-prefixed layer in the stack. */
    private _findBeforeId(prefix: string): string | undefined {
        const style = this.map!.getStyle();
        const ids = style.layers?.map((l) => l.id) ?? [];
        for (const id of ids) {
            if (!id.startsWith(prefix)) return id;
        }
        return undefined;
    }

    dispose(): void {
        this.overlayManager.detachFromMap();

        if (this.layerManager) {
            this.layerManager.dispose();
            this.layerManager = null;
        }

        this.map?.remove();
        this.map = null;
    }
}
