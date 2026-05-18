import React, { type ReactNode } from "react";
import styles from "./ToolPanel.module.css";

export interface ToolPanelProps {
    /** Title shown at the top (e.g. "Feature Info" / "3D Ruler") */
    title: ReactNode;
    /** Keyboard shortcuts / help text at the bottom */
    hint?: ReactNode;
    /** Action buttons rendered in an actions row */
    actions?: ReactNode;
    /** Tool-specific content */
    children?: ReactNode;
    className?: string;
}

/**
 * Generic panel chrome for map tools.
 *
 * Renders title → children → actions → hint
 * in a fixed visual structure.
 */
export const ToolPanel: React.FC<ToolPanelProps> = ({
    title,
    hint,
    actions,
    children,
    className,
}) => {
    const panelClass = [styles.panel, className].filter(Boolean).join(" ");

    return (
        <div className={panelClass}>
            <div className={styles.title}>{title}</div>
            {children}
            {actions && <div className={styles.actions}>{actions}</div>}
            {hint && <div className={styles.hint}>{hint}</div>}
        </div>
    );
};

export default ToolPanel;
