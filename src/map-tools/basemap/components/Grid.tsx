import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { MapToolComponentProps } from "@core/framework/types";
import {
    getAvailableBasemaps,
    getActiveBasemap,
} from "../utils/basemapSettings";

import styles from "./Grid.module.css";

/**
 * Get preview URL from tile URL by replacing {z}/{x}/{y} with 0/0/0
 */
function getPreviewUrl(tileUrl: string): string {
    return tileUrl
        .replace(/{z}/g, "0")
        .replace(/{x}/g, "0")
        .replace(/{y}/g, "0");
}

export const BasemapComponent: (
    props: MapToolComponentProps,
) => React.ReactNode = observer(({ rootStore }) => {
    const handleBasemapChange = useCallback(
        (basemapId: string) => {
            rootStore.settingsStore.setSetting("basemap.basemap", basemapId);
        },
        [rootStore],
    );

    const availableBasemaps = getAvailableBasemaps(rootStore);
    const activeBasemap = getActiveBasemap(rootStore);

    // Precompute preview URLs
    const basemapsWithPreviews = useMemo(() => {
        return availableBasemaps.map((basemap) => ({
            ...basemap,
            previewUrl: getPreviewUrl(basemap.url),
        }));
    }, [availableBasemaps]);

    return (
        <div className={styles.basemap_component}>
            {basemapsWithPreviews.map((basemap) => (
                <button
                    key={basemap.id}
                    className={`${styles.basemap_card} ${
                        activeBasemap?.id === basemap.id
                            ? styles.basemap_card_active
                            : ""
                    }`}
                    onClick={() => handleBasemapChange(basemap.id)}
                    title={basemap.name}
                >
                    <div
                        className={styles.basemap_card_preview}
                        style={{
                            backgroundImage: `url(${basemap.previewUrl})`,
                            backgroundSize: "cover",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                        }}
                    />
                    <span className={styles.basemap_card_label}>
                        {basemap.name}
                    </span>
                </button>
            ))}
        </div>
    );
});
