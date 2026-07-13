// src/core/framework/types/domain/node/capabilities.ts

import type { LayerRole } from "../layer/role";
import type { RenderDescriptor } from "../layer/descriptor";

export type CapabilityKind = "render" | "data" | "report";

/**
 * Base interface for all node capabilities.
 */
export interface CapabilityBase {
    id: string;
    label: string;
    sourceUrl: string;
    mimeType?: string;
}

/**
 * Map rendering capability.
 */
export interface MapLayer {
    category: "render";
    id: string;
    label: string;
    mimeType?: string;
    render: RenderDescriptor;
}

/**
 * Attribute table capability.
 */
export interface DataTable extends CapabilityBase {
    category: "data";

    /**
     * Layer role used to resolve Protocol via ProtocolRegistry.
     */
    role: LayerRole;

    /**
     * Endpoint used for attribute requests.
     */
    endpointUrl: string;

    /**
     * Optional protocol-specific request parameters.
     */
    params?: Record<string, unknown>;
}

/**
 * Download capability.
 */
export interface Download extends CapabilityBase {
    category: "report";
}

/**
 * A single capability describing one feature of a node.
 */
export type NodeCapability =
    | MapLayer
    | DataTable
    | Download;

/**
 * Structured capabilities for a tree node.
 *
 * Cardinality:
 * - mapLayer: zero or one
 * - dataTable: zero or one
 * - downloads: any number
 * - extensions: module-defined capabilities
 */
export interface NodeCapabilities {
    mapLayer?: MapLayer;
    dataTable?: DataTable;
    downloads: Download[];
    extensions?: Record<string, unknown>;
}

/**
 * Structured capabilities for a LayerNode.
 */
export interface LayerNodeCapabilities extends NodeCapabilities {
    mapLayer?: MapLayer;
}