import React from "react";
import { cn } from "@core/ui/utils/cn";
import styles from "./NumberInput.module.css";

export interface NumberInputProps {
    id: string;
    value: number;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
    onChange: (value: number) => void;
    className?: string | undefined;
}

export const NumberInput: React.FC<NumberInputProps> = ({
    id,
    value,
    min,
    max,
    step,
    onChange,
    className,
}) => {
    return (
        <input
            id={id}
            type="number"
            className={cn(styles.input, className)}
            value={value}
            min={min}
            max={max}
            step={step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
        />
    );
};
