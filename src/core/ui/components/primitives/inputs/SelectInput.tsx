import React from "react";
import { cn } from "@core/ui/utils/cn";
import styles from "./SelectInput.module.css";

export interface SelectOption {
    label: string;
    value: string;
}

export interface SelectInputProps {
    id: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    className?: string | undefined;
}

export const SelectInput: React.FC<SelectInputProps> = ({
    id,
    value,
    options,
    onChange,
    className,
}) => {
    return (
        <select
            id={id}
            className={cn(styles.select, className)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((option) => (
                <option key={`${id}-${option.value}`} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};
