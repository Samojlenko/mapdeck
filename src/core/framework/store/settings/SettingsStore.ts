import { makeAutoObservable } from "mobx";
import type { RootStore } from "@core/framework/store";
import type {
    RegisteredSetting,
    SettingMetadata,
    SettingsGroup,
} from "@core/framework/types";
import { logger } from "@core/shared/diagnostics/logger";
import { groupSettingsByOwner } from "@core/shared/settings/groupSettingsByOwner";
import { validateSettingType } from "@core/shared/settings/validateSettingType";

export class SettingsStore {
    private _settings = new Map<string, RegisteredSetting>();

    constructor(readonly rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
    }

    /**
     * Register a new setting
     */
    registerSetting(
        ownerId: string,
        ownerName: string,
        metadata: SettingMetadata,
    ): void {
        const setting: RegisteredSetting = {
            ...metadata,
            ownerId,
            ownerName,
            value: metadata.defaultValue,
        };

        if (this._settings.has(metadata.id)) {
            logger.warn(
                `Setting "${metadata.id}" is already registered. Overwriting.`,
            );
        }

        this._settings.set(metadata.id, setting);
    }

    /**
     * Get a string or select setting value
     */
    getStringSetting(settingId: string): string | undefined {
        const setting = this._settings.get(settingId);
        if (setting?.type === "string" || setting?.type === "select") {
            return setting.value as string;
        }
        return undefined;
    }

    /**
     * Get a number setting value
     */
    getNumberSetting(settingId: string): number | undefined {
        const setting = this._settings.get(settingId);
        if (setting?.type === "number") {
            return setting.value as number;
        }
        return undefined;
    }

    /**
     * Get a boolean setting value
     */
    getBooleanSetting(settingId: string): boolean | undefined {
        const setting = this._settings.get(settingId);
        if (setting?.type === "boolean") {
            return setting.value as boolean;
        }
        return undefined;
    }

    /**
     * Set a setting value by ID
     */
    setSetting = <T = unknown>(settingId: string, value: T): boolean => {
        const setting = this._settings.get(settingId);
        if (!setting) {
            logger.error(`Setting "${settingId}" not found`);
            return false;
        }

        if (!validateSettingType(setting, value)) {
            logger.error(
                `Setting "${settingId}" expects type ${setting.type}, got ${typeof value}`,
            );
            return false;
        }

        this._settings.set(settingId, { ...setting, value });
        return true;
    };

    /**
     * Get all settings grouped by owner
     */
    get allSettingsGrouped(): SettingsGroup[] {
        return groupSettingsByOwner(Array.from(this._settings.values()));
    }

    /**
     * Get settings for a specific owner
     */
    getOwnerSettings(ownerId: string): RegisteredSetting[] {
        return Array.from(this._settings.values()).filter(
            (setting) => setting.ownerId === ownerId,
        );
    }

    /**
     * Check if a setting exists
     */
    hasSetting(settingId: string): boolean {
        return this._settings.has(settingId);
    }

    /**
     * Get all settings (flat list)
     */
    get allSettings(): RegisteredSetting[] {
        return Array.from(this._settings.values());
    }

    /**
     * Reset a setting to its default value
     */
    resetSetting(settingId: string): void {
        const setting = this._settings.get(settingId);
        if (!setting) {
            logger.error(`Setting "${settingId}" not found`);
            return;
        }

        this._settings.set(settingId, {
            ...setting,
            value: setting.defaultValue,
        });
    }

    /**
     * Reset all settings for an owner to their default values
     */
    resetOwnerSettings(ownerId: string): void {
        const ownerSettings = this.getOwnerSettings(ownerId);
        ownerSettings.forEach((setting) => {
            this._settings.set(setting.id, {
                ...setting,
                value: setting.defaultValue,
            });
        });
    }
}
