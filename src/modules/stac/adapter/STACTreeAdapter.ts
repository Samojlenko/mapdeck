import {
    type SourceAdapter,
    type TreeNode,
    LayerTreeNodeTypes,
} from "@core/framework/types";
import { logger } from "@core/shared/diagnostics/logger";
import { type STACConfig } from "../core/STACConfig";
import { STACClient } from "../core/STACClient";
import { STACCache } from "../core/STACCache";
import { STACEntityMapper } from "../mapping/STACEntityMapper";
import { resolveBaseUrl, filterLinksByRel } from "../utils/url";
import { isSTACCollection, type STACCollection } from "../types";

export class STACTreeAdapter implements SourceAdapter {
    readonly type = "stac";

    private client: STACClient | null = null;
    private cache: STACCache | null = null;
    private mapper: STACEntityMapper | null = null;
    private config: STACConfig | null = null;
    private isInitialized = false;

    initialize(config: Record<string, unknown>): void {
        try {
            const stacConfig = this.extractConfig(config);
            this.config = stacConfig;

            this.cache = new STACCache();
            this.client = new STACClient(stacConfig);
            this.mapper = new STACEntityMapper(this.cache);

            this.isInitialized = true;
            logger.debug("STAC adapter initialized");
        } catch (error) {
            logger.error("Failed to initialize STAC adapter:", error);
            throw error;
        }
    }

    async fetchRoot(): Promise<TreeNode[]> {
        this.ensureInitialized();

        if (!this.config?.url) {
            throw new Error("STAC adapter requires 'url' configuration");
        }

        try {
            const catalog = await this.client!.fetchCatalog(this.config.url);
            this.cache!.store(catalog);

            // Fetch child collections via 'child' links (STAC static catalog pattern)
            const childLinks = filterLinksByRel(catalog.links, "child");

            if (childLinks.length > 0) {
                logger.info(
                    `Found ${childLinks.length} child link(s), fetching collections`,
                );
                const nodes: TreeNode[] = [];

                const fetchPromises = childLinks.map(async (link) => {
                    try {
                        const entity = await this.client!.fetchEntity(
                            link.href,
                        );

                        if (isSTACCollection(entity)) {
                            this.cache!.store(entity);
                            return this.mapper!.mapCollectionToGroupNode(
                                entity,
                            );
                        }
                    } catch (error) {
                        logger.warn(
                            `Failed to fetch child ${link.href}:`,
                            error,
                        );
                    }
                    return null;
                });

                const results = await Promise.allSettled(fetchPromises);
                for (const result of results) {
                    if (result.status === "fulfilled" && result.value) {
                        nodes.push(result.value);
                    }
                }

                return nodes;
            }

            logger.warn(`No child links found in catalog ${catalog.id}`);
            return [];
        } catch (error) {
            logger.error("Failed to fetch STAC catalog root:", error);
            throw error;
        }
    }

    async fetchChildren(parent: TreeNode): Promise<TreeNode[]> {
        this.ensureInitialized();

        if (parent.type !== LayerTreeNodeTypes.Group) {
            return [];
        }

        const collection = this.mapper!.getSTACCollectionFromNode(parent);
        if (!collection) {
            return [];
        }

        try {
            const baseUrl = resolveBaseUrl(collection, this.config?.baseUrl);
            const promises: Promise<TreeNode[]>[] = [];

            this.addItemFetchPromises(promises, collection, baseUrl);
            this.addChildCollectionFetchPromises(promises, collection, baseUrl);

            const results = await Promise.allSettled(promises);
            const children: TreeNode[] = [];
            for (const result of results) {
                if (result.status === "fulfilled") {
                    children.push(...result.value);
                }
            }

            return children;
        } catch (error) {
            logger.error(
                `Failed to fetch children for node ${parent.id}:`,
                error,
            );
            throw error;
        }
    }

    private addItemFetchPromises(
        promises: Promise<TreeNode[]>[],
        collection: STACCollection,
        baseUrl: string | undefined,
    ): void {
        const itemsLink = filterLinksByRel(collection.links, "items")[0];
        const itemLinks = filterLinksByRel(collection.links, "item");

        if (itemsLink) {
            promises.push(this.fetchItemsFromAPILink(itemsLink.href, baseUrl));
        } else if (itemLinks.length > 0) {
            for (const link of itemLinks) {
                promises.push(this.fetchItemsFromLink(link.href, baseUrl));
            }
        } else {
            logger.warn(
                `No items or item links found in collection ${collection.id}`,
            );
        }
    }

    private addChildCollectionFetchPromises(
        promises: Promise<TreeNode[]>[],
        collection: STACCollection,
        baseUrl: string | undefined,
    ): void {
        const childLinks = filterLinksByRel(collection.links, "child");
        const collectionLinks = filterLinksByRel(
            collection.links,
            "collection",
        );
        const allChildLinks = [...childLinks, ...collectionLinks];

        for (const link of allChildLinks) {
            promises.push(this.fetchChildCollection(link.href, baseUrl));
        }
    }

    private async fetchItemsFromAPILink(
        href: string,
        baseUrl: string | undefined,
    ): Promise<TreeNode[]> {
        try {
            const items = await this.client!.fetchItemsFromCollection(
                href,
                baseUrl,
            );
            logger.info(`Fetched ${items.length} items from ${href}`);
            items.forEach((item) => this.cache!.store(item));
            return items
                .map((item) => this.mapper!.createNodeFromItem(item))
                .filter((node): node is TreeNode => node !== null);
        } catch (error) {
            logger.warn(`Failed to load items from ${href}:`, error);
            return [];
        }
    }

    private async fetchItemsFromLink(
        href: string,
        baseUrl: string | undefined,
    ): Promise<TreeNode[]> {
        try {
            const items = await this.client!.fetchItems(href, baseUrl);
            items.forEach((item) => this.cache!.store(item));
            return items
                .map((item) => this.mapper!.createNodeFromItem(item))
                .filter((node): node is TreeNode => node !== null);
        } catch (error) {
            logger.warn(`Failed to load items from ${href}:`, error);
            return [];
        }
    }

    private async fetchChildCollection(
        href: string,
        baseUrl: string | undefined,
    ): Promise<TreeNode[]> {
        try {
            const entity = await this.client!.fetchEntity(href, baseUrl);
            if (isSTACCollection(entity)) {
                this.cache!.store(entity);
                return [this.mapper!.mapCollectionToGroupNode(entity)];
            }
        } catch (error) {
            logger.warn(`Failed to load collection from ${href}:`, error);
        }
        return [];
    }

    /**
     * Extract configuration from Record<string, unknown>
     */
    private extractConfig(config: Record<string, unknown>): STACConfig {
        const url = config.url;
        if (typeof url !== "string" || !url.trim()) {
            throw new Error("STAC adapter requires 'url' configuration");
        }

        const baseUrl =
            typeof config.baseUrl === "string"
                ? config.baseUrl.trim()
                : undefined;
        let timeout: number | undefined;
        if (typeof config.timeout === "number") {
            timeout = config.timeout;
        } else if (typeof config.timeout === "string") {
            timeout = parseFloat(config.timeout) || undefined;
        } else {
            timeout = undefined;
        }
        const headers = (() => {
            const headers = config.headers;
            if (
                !headers ||
                typeof headers !== "object" ||
                Array.isArray(headers)
            ) {
                return undefined;
            }
            const result: Record<string, string> = {};
            for (const [k, v] of Object.entries(headers)) {
                if (typeof v === "string") {
                    result[k] = v;
                }
            }
            return Object.keys(result).length > 0 ? result : undefined;
        })();

        // Conditional spread to comply with exactOptionalPropertyTypes
        return {
            url: url.trim(),
            ...(baseUrl !== undefined && { baseUrl }),
            ...(timeout !== undefined && { timeout }),
            ...(headers !== undefined && { headers }),
        };
    }

    dispose(): void {
        this.cache?.clear();
        this.client = null;
        this.cache = null;
        this.mapper = null;
        this.config = null;
        this.isInitialized = false;
    }

    private ensureInitialized(): void {
        if (!this.isInitialized) {
            throw new Error("STAC adapter must be initialized before use");
        }
    }
}
