import React, { useEffect, useState, type ReactNode } from "react";
import { observer } from "mobx-react-lite";
import type {
    BaseMapConfig,
    MapToolComponentProps,
} from "@core/framework/types";
import { checkBasemapHealth } from "../utils/checkBasemapHealth";
import { BASEMAP_TOOL_ID } from "./Tool";

import styles from "./Grid.module.css";

type BasemapStatus = "loading" | "success" | "error";

interface CardProps {
    basemap: BaseMapConfig;
    status: BasemapStatus;
    isActive: boolean;
    dict: Record<string, string>;
    onSelect: (id: string) => void;
}

const BasemapCard: (props: CardProps) => ReactNode = observer(
    ({ basemap, status, isActive, dict, onSelect }) => {
        const isDisabled = status === "error";
        const previewSrc = basemap.previewImage ?? null;
        const showPlaceholder = !previewSrc;
        const hasPreview = previewSrc && status !== "error";

        const cardClass = [
            styles.basemap_card,
            isActive ? styles.basemap_card_active : "",
            isDisabled ? styles.basemap_card_disabled : "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <button
                className={cardClass}
                onClick={() => onSelect(basemap.id)}
                title={isDisabled ? dict["status.unavailable"] : basemap.name}
                disabled={isDisabled}
            >
                <div
                    className={styles.basemap_card_preview}
                    style={
                        hasPreview
                            ? {
                                  backgroundImage: `url(${previewSrc})`,
                                  backgroundSize: "cover",
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "center",
                              }
                            : {}
                    }
                >
                    {showPlaceholder && status !== "error" && (
                        <span className={styles.placeholder}>
                            {basemap.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                    {isDisabled && (
                        <span className={styles.error_text}>
                            {dict["status.unavailable"]}
                        </span>
                    )}
                </div>
                <span className={styles.basemap_card_label}>
                    {basemap.name}
                </span>
            </button>
        );
    },
);

export const BasemapComponent: (
    props: MapToolComponentProps,
) => React.ReactNode = observer(({ rootStore }) => {
    const dict = rootStore.localeStore.t(BASEMAP_TOOL_ID);
    const [statusMap, setStatusMap] = useState<Map<string, BasemapStatus>>(
        new Map(),
    );

    useEffect(() => {
        let alive = true;
        const basemaps = rootStore.basemapStore.availableBasemaps;
        for (const basemap of basemaps) {
            setStatusMap((prev) => {
                if (prev.has(basemap.id)) return prev;
                const next = new Map(prev);
                next.set(basemap.id, "loading");
                return next;
            });

            checkBasemapHealth(basemap, 3000).then((isAvailable) => {
                if (!alive) return;
                setStatusMap((prev) => {
                    const next = new Map(prev);
                    next.set(basemap.id, isAvailable ? "success" : "error");
                    return next;
                });
            });
        }
        return () => {
            alive = false;
        };
    }, [rootStore]);

    const activeBasemapId = rootStore.basemapStore.activeBasemap?.id;

    return (
        <div className={styles.basemap_component}>
            {rootStore.basemapStore.availableBasemaps.map((basemap) => (
                <BasemapCard
                    key={basemap.id}
                    basemap={basemap}
                    status={statusMap.get(basemap.id) ?? "loading"}
                    isActive={activeBasemapId === basemap.id}
                    dict={dict}
                    onSelect={(id) =>
                        rootStore.basemapStore.setActiveBasemap(id)
                    }
                />
            ))}
        </div>
    );
});
