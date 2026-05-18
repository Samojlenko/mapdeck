import type { Widget } from "@core/framework/types";
import { formatDict } from "@core/framework/i18n";
import { useRootStore } from "@core/framework/store";
import { observer } from "mobx-react-lite";
import { SIDEBAR_ID } from "..";
import styles from "./Widget.module.css";

interface WidgetButtonProps {
    widget: Widget;
    isOpen: boolean;
    onClick: (widgetId: string) => void;
}

const WidgetButton = observer<WidgetButtonProps>(
    ({ widget, isOpen, onClick }) => {
        const rootStore = useRootStore();
        const dict = rootStore.localeStore.t(SIDEBAR_ID);
        const widgetButtonClass = `${styles.sidebar__widgetButton} ${
            isOpen ? styles.sidebar__widgetButtonOpen : ""
        }`;

        const widgetDict = rootStore.localeStore.t(widget.id);
        const widgetName = widgetDict["widget.name"]!;

        const handleClick = () => onClick(widget.id);

        return (
            <button
                className={widgetButtonClass}
                onClick={handleClick}
                title={widgetName}
                aria-label={formatDict(dict["aria.selectWidget"]!, {
                    name: widgetName,
                })}
            >
                <div className={styles.sidebar__widgetIcon}>
                    {widget.icon ? (
                        <img src={widget.icon} alt="" aria-hidden="true" />
                    ) : (
                        <div className={styles.sidebar__iconPlaceholder} />
                    )}
                </div>
            </button>
        );
    },
);

export default WidgetButton;
