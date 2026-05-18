import type { RegisteredSetting } from "@core/framework/types";

export function validateSettingType<T>(
    setting: RegisteredSetting,
    value: T,
): boolean {
    const typeMap: Record<string, string> = {
        string: "string",
        number: "number",
        boolean: "boolean",
        select: "string",
    };

    const expectedType = typeMap[setting.type];
    if (expectedType && typeof value !== expectedType) {
        return false;
    }

    if (setting.type === "select" && typeof value === "string") {
        return validateSelectValue(setting, value);
    }

    return true;
}

function validateSelectValue(
    setting: RegisteredSetting,
    value: string,
): boolean {
    if (
        !("options" in setting) ||
        !Array.isArray(setting.options) ||
        setting.options.length === 0
    ) {
        return true;
    }

    const allowedValues = setting.options.map((o) => o.value);
    if (allowedValues.includes(value)) {
        return true;
    }

    return false;
}
