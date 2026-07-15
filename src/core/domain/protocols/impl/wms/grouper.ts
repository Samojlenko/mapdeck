/**
 * WMS grouper — groups consecutive WMS layers into batch render units.
 *
 * Pure functions — no MobX, no MapLibre dependencies.
 * Operates on the same snapshot format as buildDesiredRenderUnits.
 */

import type {
    WmsGroupConfig,
    WmsGroupKey,
    RasterLayerConfig,
    RenderDescriptor,
} from "@core/framework/types";
import { generateGroupId, keysMatch, getWmsGroupKey } from "./grouping";

/**
 * Input item shape — matches the snapshot format from LayerTreeStore.
 */
interface WmsGroupInput {
    id: string;
    descriptor: RenderDescriptor;
}

/**
 * Group consecutive WMS layers into batch render units.
 *
 * Rules:
 * - Only processes items where config.type === "wms"
 * - Groups consecutive items with matching WmsGroupKey
 * - Max `maxPerGroup` items per group (default: 10)
 * - Returns groups in the same order as input items
 */
export function groupVisibleWmsNodes(
    items: WmsGroupInput[],
    maxPerGroup: number = 10,
): WmsGroupConfig[] {
    if (items.length === 0) return [];

    const groups: WmsGroupConfig[] = [];
    let currentGroup: WmsGroupInput[] = [];
    let currentKey: WmsGroupKey | null = null;

    for (const item of items) {
        const key = getWmsGroupKey(item.descriptor.config as RasterLayerConfig);

        if (shouldFlush(currentGroup, currentKey, key, maxPerGroup)) {
            groups.push(buildGroup(currentGroup, currentKey!));
            currentGroup = [];
            currentKey = null;
        }

        if (key) {
            currentKey = key;
            currentGroup.push(item);
        }
    }

    if (currentGroup.length > 0 && currentKey) {
        groups.push(buildGroup(currentGroup, currentKey));
    }

    return groups;
}

function shouldFlush(
    group: WmsGroupInput[],
    currentKey: WmsGroupKey | null,
    nextKey: WmsGroupKey | null,
    maxPerGroup: number,
): boolean {
    if (group.length === 0) return false;
    if (!nextKey) return true;
    if (!currentKey || !keysMatch(currentKey, nextKey)) return true;
    return group.length >= maxPerGroup;
}

function buildGroup(items: WmsGroupInput[], key: WmsGroupKey): WmsGroupConfig {
    const nodeIds = items.map((item) => item.id);
    return {
        groupId: generateGroupId(nodeIds, key),
        nodeIds,
        baseUrl: key.baseUrl,
        format: key.format,
        version: key.version,
        opacity: key.opacity,
    };
}
