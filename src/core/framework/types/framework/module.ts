/**
 * Core module interface that all modules must implement
 * This defines the metadata and contract for modules in the Mapdeck system
 */

import type { RootStore } from "@core/framework/store";

export interface Module<TConfig = Record<string, unknown>> {
    // === Required Properties ===
    /** Unique identifier for the module (kebab-case) */
    readonly id: string;

    /** Human-readable display name */
    readonly name: string;

    // === Required Methods ===
    /**
     * Register the module with the provided configuration
     * This method should handle all initialization required for the module
     */
    register(config?: TConfig): Promise<void>;

    // === Optional Methods ===
    /**
     * Provide access to RootStore for modules that need to interact with stores
     * Called after registration to allow module to set up data sources, etc.
     */
    setRootStore?(rootStore: RootStore): void;
}
