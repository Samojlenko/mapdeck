import React from "react";
import { observer } from "mobx-react-lite";
import { useRootStore } from "@core/framework/store";
import { SettingsGroupComponent } from "./SettingsGroup";
import type { SettingsWidgetProps } from "../types";
import { SETTINGS_ID } from "../index";
import styles from "./Widget.module.css";

const SettingsWidgetComponent: (props: SettingsWidgetProps) => React.ReactNode =
    observer(({ className = "" }) => {
        const rootStore = useRootStore();
        const dict = rootStore.localeStore.t(SETTINGS_ID);
        const groups = rootStore.settingsStore.allSettingsGrouped;

        if (groups.length === 0) {
            return (
                <div className={`${styles.settings} ${className}`}>
                    <p>{dict["empty.noSettings"]}</p>
                </div>
            );
        }

        return (
            <div
                className={`${styles.settings} ${className}`}
                data-testid="settings-container"
            >
                {groups.map((group) => (
                    <SettingsGroupComponent
                        key={group.ownerId}
                        group={group}
                        onChange={rootStore.settingsStore.setSetting}
                    />
                ))}
            </div>
        );
    });

export default SettingsWidgetComponent;
