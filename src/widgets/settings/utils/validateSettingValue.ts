import type { RegisteredSetting } from "@core/framework/types";

export type ValidationResult =
    | { valid: true }
    | { valid: false; error: "range" | "invalid" };

export function validateSettingValue(
    setting: RegisteredSetting,
    value: unknown,
): ValidationResult {
    if (setting.type !== "number") {
        return { valid: true };
    }

    const numValue = Number(value);

    if (setting.min !== undefined && numValue < setting.min) {
        return { valid: false, error: "range" };
    }

    if (setting.max !== undefined && numValue > setting.max) {
        return { valid: false, error: "range" };
    }

    return { valid: true };
}
