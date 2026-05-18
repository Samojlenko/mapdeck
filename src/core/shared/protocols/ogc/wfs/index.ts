export { buildWfsUrl, setPaginationParams, setSortParams } from "./url";
export { parseGeoJsonResponse, parseGeoJsonFeatures } from "./parser";
export { fetchWfsFeatures, fetchWfsPageAsRows } from "./client";
export type {
    WfsFeature,
    WfsResponse,
    WfsRequestParams,
} from "@core/framework/types/ogc/wfs";
