import { useEffect, useRef, type RefObject } from "react";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import type { RootStore } from "@core/framework/store";

const pmtilesProtocol = new Protocol();
maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);

/** Create/dispose the maplibre map and start basemap sync. Runs once. */
export function useMapLifecycle(
    containerRef: RefObject<HTMLDivElement | null>,
    rootStore: RootStore,
): RefObject<maplibregl.Map | null> {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const initRef = useRef(false);

    useEffect(() => {
        if (initRef.current || !containerRef.current) return;
        initRef.current = true;

        rootStore.mapStore.initializeMap(containerRef.current);
        const map = rootStore.mapStore.getMap()!;
        mapRef.current = map;

        map.once("load", () => {
            rootStore.basemapStore.findAndApplyInitialBasemap();
            rootStore.basemapStore.startSync();
        });

        return () => {
            initRef.current = false;
            rootStore.basemapStore.stopSync();
            rootStore.mapStore.dispose();
            mapRef.current = null;
        };
    }, [rootStore]);

    return mapRef;
}
