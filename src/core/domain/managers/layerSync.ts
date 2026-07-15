import { LayerRoles } from "@core/framework/types";
import type { RenderUnit, SnapshotItem } from "@core/framework/types";
import type { ProtocolRegistry } from "@core/domain/protocols";

/**
 * Build the desired set of render units from the current layer snapshot.
 * Each visible layer with a valid config becomes a single-node RenderUnit.
 */
export function buildDesiredRenderUnits(
    snapshot: SnapshotItem[],
    protocolRegistry: ProtocolRegistry,
): Map<string, RenderUnit> {
    const desired = new Map<string, RenderUnit>();

    for (const item of snapshot) {
        if (!item.visible || !item.descriptor) continue;

        const role = item.descriptor.role;
        const protocol = protocolRegistry.getByRole(role);
        if (!protocol) continue;

        desired.set(item.id, {
            id: item.id,
            nodeIds: [item.id],
            adapter: protocol.getAdapter(role),
            descriptor: item.descriptor,
        });
    }

    return desired;
}

/**
 * Build grouped render units from the current layer snapshot.
 *
 * Starts with individual units via buildDesiredRenderUnits, then delegates
 * grouping to each registered protocol via groupRenderUnits.
 */
export function buildGroupedRenderUnits(
    snapshot: SnapshotItem[],
    protocolRegistry: ProtocolRegistry,
): Map<string, RenderUnit> {
    const result = buildDesiredRenderUnits(snapshot, protocolRegistry);

    for (const protocol of protocolRegistry.getAll()) {
        protocol.groupRenderUnits?.(result, snapshot);
    }

    return result;
}

/**
 * Collect render unit ids in tree order for RASTER/VECTOR roles.
 */
export function getNativeRenderOrder(
    snapshot: SnapshotItem[],
    nodeToRenderId: Map<string, string>,
): string[] {
    const renderOrder: string[] = [];
    const seen = new Set<string>();

    for (const item of snapshot) {
        if (!item.visible || !item.descriptor) continue;
        const role = item.descriptor.role;
        if (role !== LayerRoles.RASTER && role !== LayerRoles.VECTOR) continue;

        const renderId = nodeToRenderId.get(item.id);
        if (renderId && !seen.has(renderId)) {
            seen.add(renderId);
            renderOrder.push(renderId);
        }
    }

    return renderOrder;
}
