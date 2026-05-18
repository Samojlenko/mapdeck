import React from "react";
import { cn } from "@core/ui/utils/cn";
import styles from "./TextInput.module.css";

export interface TextInputProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    className?: string | undefined;
}

export const TextInput: React.FC<TextInputProps> = ({
    id,
    value,
    onChange,
    className,
}) => {
    return (
        <input
            id={id}
            type="text"
            className={cn(styles.input, className)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
};
