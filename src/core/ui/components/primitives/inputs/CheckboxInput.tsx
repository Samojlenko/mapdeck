import React from "react";
import { cn } from "@core/ui/utils/cn";
import styles from "./CheckboxInput.module.css";

export interface CheckboxInputProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string | undefined;
}

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
    id,
    checked,
    onChange,
    className,
}) => {
    return (
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={cn(styles.input, className)}
        />
    );
};
