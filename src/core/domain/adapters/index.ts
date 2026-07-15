// Adapter factories for the modular architecture
export { LayerAdapterFactory } from "./layer/LayerAdapterFactory";
export { SourceAdapterFactory } from "./source/SourceAdapterFactory";

// Layer adapter implementations
export { RasterAdapter } from "./layer/impl/RasterAdapter";
export { VectorAdapter } from "./layer/impl/VectorAdapter";
export { PointCloudAdapter } from "./layer/impl/PointCloudAdapter";

export {
    LayerConfigRegistry,
    registerDefaultLayerConfigs,
} from "./layer/createDefaultLayerConfig";

// Re-export adapter interfaces for convenience
export type { SourceAdapter } from "@core/framework/types";
export type {
    AttributeDataAdapter,
    AttributeSourceConfig,
    AttributeFetchRequest,
    AttributeFetchResult,
} from "@core/framework/types";
