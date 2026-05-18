/**
 * Attribute data adapter contract.
 * Defines the interface between attribute data stores and data source adapters.
 */

export interface AttributeFetchRequest {
    startIndex?: number;
    maxFeatures?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    filters?: Record<string, unknown>;
    signal?: AbortSignal;
}

export interface AttributeSourceConfig {
    endpointUrl: string;
    extraParams?: Record<string, string>;
}

export interface AttributeFetchResult {
    rows: Record<string, unknown>[];
    totalFeatures: number;
}

export interface AttributeDataAdapter {
    fetchPage(
        config: AttributeSourceConfig,
        request: AttributeFetchRequest,
        signal?: AbortSignal,
    ): Promise<AttributeFetchResult>;
}

export interface AttributeCacheEntry {
    features: Record<string, unknown>[];
    totalFeatures: number;
    timestamp: number;
    error: string | null;
    loading: boolean;
}
