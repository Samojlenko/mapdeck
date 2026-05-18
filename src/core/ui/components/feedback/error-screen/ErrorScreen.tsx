import React from "react";
import styles from "./ErrorScreen.module.css";

export interface ErrorScreenProps {
    message: string;
    onRetry?: () => void;
    dict: Record<string, string>;
}

export const ErrorScreen: (props: ErrorScreenProps) => React.ReactNode = ({
    message,
    onRetry,
    dict,
}) => (
    <div className={styles.container}>
        <span className={styles.title}>{dict["error.title"]}</span>
        <span className={styles.message}>{message}</span>
        {onRetry && (
            <button
                type="button"
                className={styles.retryButton}
                onClick={onRetry}
            >
                {dict["error.retry"]}
            </button>
        )}
    </div>
);
