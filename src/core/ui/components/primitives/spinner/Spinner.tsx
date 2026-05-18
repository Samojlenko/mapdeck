import React from "react";
import { cn } from "@core/ui/utils/cn";
import styles from "./Spinner.module.css";

interface SpinnerProps {
    className?: string | undefined;
}

export const Spinner: React.FC<SpinnerProps> = ({ className }) => {
    return <div className={cn(styles.spinner, className)} />;
};
