import React from "react";
import { observer } from "mobx-react-lite";
import { Icon } from "@core/ui/components";
import { useRootStore } from "@core/framework/store";
import { LAYER_TREE_ID } from "..";
import styles from "./Widget.module.css";

interface LayerTreeHeaderProps {
    onUpdateClick?: () => void;
    disabled?: boolean;
    title?: string;
}

const LayerTreeHeader: (props: LayerTreeHeaderProps) => React.ReactNode =
    observer(({ onUpdateClick, disabled = true, title: _title }) => {
        const rootStore = useRootStore();
        const dict = rootStore.localeStore.t(LAYER_TREE_ID);
        const treeStore = rootStore.treeStore;

        const buttonTitle = disabled
            ? dict["button.update.disabledTitle"]
            : dict["button.update.title"];

        return (
            <div className={styles.layerTree__header}>
                <input
                    type="text"
                    className={styles.layerTree__searchInput}
                    placeholder={dict["search.placeholder"]}
                    value={treeStore.searchQuery}
                    onChange={(e) => treeStore.setSearchQuery(e.target.value)}
                    disabled={disabled}
                    aria-label={dict["aria.search"]}
                />
                <button
                    onClick={onUpdateClick}
                    className={styles.layerTree__updateButton}
                    disabled={disabled}
                    title={buttonTitle}
                    aria-label={buttonTitle}
                >
                    <Icon name="refresh" />
                </button>
            </div>
        );
    });

export default LayerTreeHeader;
