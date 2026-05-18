export interface AttributeLayerInfo {
    id: string;
    title: string;
    groupTitle: string | null;
}

export function getFeatureId(
    feature: Record<string, unknown>,
    index: number,
): string {
    const id =
        feature.id ?? feature.ID ?? feature.Id ?? feature.fid ?? feature.FID;
    if (id !== undefined) return `feature-${id}`;
    return `row-${index}`;
}

export { buildAttributeLayers } from "./buildAttributeLayers";
export { extractColumns } from "./extractColumns";
export { groupLayersByTitle } from "./groupLayersByTitle";
