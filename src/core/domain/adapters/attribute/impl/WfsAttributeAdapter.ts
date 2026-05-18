import type {
    AttributeDataAdapter,
    AttributeFetchRequest,
    AttributeSourceConfig,
    AttributeFetchResult,
} from "@core/framework/types";
import { fetchWfsPageAsRows } from "@core/shared/protocols/ogc/wfs";

export class WfsAttributeAdapter implements AttributeDataAdapter {
    async fetchPage(
        config: AttributeSourceConfig,
        request: AttributeFetchRequest,
        signal?: AbortSignal,
    ): Promise<AttributeFetchResult> {
        const result = await fetchWfsPageAsRows(
            {
                url: config.endpointUrl,
                version: config.extraParams?.version ?? "2.0.0",
                startIndex: request.startIndex ?? 0,
                maxFeatures: request.maxFeatures ?? 50,
                sortBy: request.sortBy,
                sortDirection: request.sortDirection,
                extraParams: config.extraParams,
            },
            signal,
        );

        return { rows: result.rows, totalFeatures: result.totalFeatures };
    }
}
