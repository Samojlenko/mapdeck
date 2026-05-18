import React from "react";
import { logger } from "@core/shared/diagnostics/logger";
import { cn } from "@core/ui/utils/cn";
import iconRegistry from "../../../icons/registry";
import type { IconName } from "../../../icons/registry";
import styles from "./Icon.module.css";

export type { IconName };

export interface IconProps {
    /** Name of the icon to display */
    name: IconName;
    /** CSS class name for additional styling */
    className?: string;
    /** Title / accessibility label for the icon */
    title?: string;
    /** Click handler */
    onClick?: () => void;
}

/**
 * Icon component for consistent SVG rendering throughout the application.
 * Icon size is determined entirely by the parent container's CSS.
 */
export const Icon: (props: IconProps) => React.ReactNode = ({
    name,
    className,
    title,
    onClick,
}) => {
    const src = iconRegistry[name];

    if (!src) {
        logger.warn(`Icon "${name}" not found in registry`);
        return null;
    }

    return (
        <img
            src={src}
            alt={title || ""}
            title={title}
            className={cn(styles.icon, className)}
            onClick={onClick}
            aria-hidden={!title || undefined}
        />
    );
};

export default Icon;
