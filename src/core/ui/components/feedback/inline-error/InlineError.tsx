import React from "react";
import { Icon } from "../../primitives/icon/Icon";
import styles from "./InlineError.module.css";

export interface InlineErrorProps {
    message: string;
    onRetry?: () => void;
    dict: Record<string, string>;
}

export const InlineError: (props: InlineErrorProps) => React.ReactNode = ({
    message,
    onRetry,
    dict,
}) => (
    <div className={styles.container} role="alert">
        <span className={styles.message}>{message}</span>
        {onRetry && (
            <button
                type="button"
                className={styles.retryButton}
                onClick={onRetry}
                title={dict["error.retry"]}
                aria-label={dict["error.retry"]}
            >
                <Icon name="refresh" />
            </button>
        )}
    </div>
);
