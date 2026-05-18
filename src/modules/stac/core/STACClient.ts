/**
 * STAC HTTP client
 * Replaces api.ts with a class-based approach
 */
/* global fetch */

import { logger } from "@core/shared/diagnostics/logger";
import type { STACConfig } from "./STACConfig";
import type {
    STACCatalog,
    STACEntity,
    STACItem,
    STACFeatureCollection,
} from "../types";
import { isSTACCatalog, isSTACItem, isSTACFeatureCollection } from "../types";

export class STACClient {
    constructor(private config: STACConfig) {}

    async fetchEntity(
        url: string,
        baseUrlOverride?: string,
    ): Promise<STACEntity> {
        const absoluteUrl = this.resolveUrl(url, baseUrlOverride);
        const timeout = this.config.timeout ?? 10000;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(absoluteUrl, {
                headers: {
                    "Content-Type": "application/json",
                    ...this.config.headers,
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP error ${response.status}: ${response.statusText}`,
                );
            }

            const data = await response.json();

            if (!data.stac_version || !data.type) {
                throw new Error(
                    "Response does not appear to be a valid STAC entity",
                );
            }

            return data as STACEntity;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(
                    `Failed to fetch STAC entity from ${url}: ${error.message}`,
                );
            }
            throw new Error(
                `Failed to fetch STAC entity from ${url}: Unknown error`,
            );
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async fetchCatalog(
        catalogUrl: string,
        baseUrlOverride?: string,
    ): Promise<STACCatalog> {
        logger.info(`Fetching STAC catalog from: ${catalogUrl}`);
        const entity = await this.fetchEntity(catalogUrl, baseUrlOverride);

        if (!isSTACCatalog(entity)) {
            throw new Error(
                `Expected STAC Catalog but got type: ${entity.type}`,
            );
        }

        logger.info(
            `Loaded STAC catalog: ${entity.id} (${entity.title || "untitled"})`,
        );
        return entity;
    }

    async fetchItems(
        itemLink: string,
        baseUrlOverride?: string,
    ): Promise<STACItem[]> {
        const entity = await this.fetchEntity(itemLink, baseUrlOverride);

        if (isSTACItem(entity)) {
            return [entity];
        } else if (isSTACFeatureCollection(entity)) {
            return entity.features;
        }

        throw new Error(
            `Expected STAC Item or FeatureCollection but got type: ${entity.type}`,
        );
    }

    /**
     * Fetch items from STAC API /items endpoint
     * This is a special endpoint that returns a FeatureCollection
     * without root-level stac_version field (only in features)
     */
    async fetchItemsFromCollection(
        itemsUrl: string,
        baseUrlOverride?: string,
    ): Promise<STACItem[]> {
        const absoluteUrl = this.resolveUrl(itemsUrl, baseUrlOverride);
        const timeout = this.config.timeout ?? 10000;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            logger.info(`Fetching STAC items from: ${absoluteUrl}`);

            const response = await fetch(absoluteUrl, {
                headers: {
                    "Content-Type": "application/json",
                    ...this.config.headers,
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP error ${response.status}: ${response.statusText}`,
                );
            }

            const data = (await response.json()) as STACFeatureCollection;

            if (!data.features || !Array.isArray(data.features)) {
                throw new Error(
                    "Response does not appear to be a valid STAC API items response",
                );
            }

            logger.info(
                `Loaded ${data.features.length} items from: ${absoluteUrl}`,
            );
            return data.features;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(
                    `Failed to fetch STAC items from ${itemsUrl}: ${error.message}`,
                );
            }
            throw new Error(
                `Failed to fetch STAC items from ${itemsUrl}: Unknown error`,
            );
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private resolveUrl(url: string, baseUrlOverride?: string): string {
        const baseUrl = baseUrlOverride ?? this.config.baseUrl;
        if (!baseUrl) {
            return url;
        }

        try {
            return new URL(url, baseUrl).href;
        } catch {
            return url;
        }
    }
}
