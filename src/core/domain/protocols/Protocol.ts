// src/core/domain/protocols/Protocol.ts

import type * as maplibregl from "maplibre-gl";

import type {
  LayerRole,
  LayerConfig,
  LayerAdapter,
  MapLayer,
  RenderDescriptor,
  RenderUnit,
  SnapshotItem,
  AttributeFetchRequest,
  AttributeSourceConfig,
  AttributeFetchResult,
} from "@core/framework/types";

/**
 * Parameters for feature info query at a point.
 */
export interface ProtocolFeatureInfoParams {
  layerId: string;
  descriptor: RenderDescriptor;
  screenX: number;
  screenY: number;
  lng: number;
  lat: number;
  map: maplibregl.Map;
  signal?: AbortSignal;
}

/**
 * ==========================================
 *  Protocol — explicit data protocol contract
 * ==========================================
 *
 * A Protocol knows how to:
 *  1. Create NodeCapabilities from source data  [required]
 *  2. Build render units for the map             [required]
 *  3. Fetch paginated attribute data             [optional]
 *  4. Query feature info at a point              [optional]
 *
 * Cardinality:
 *   - One role → exactly one protocol
 *   - One protocol → many roles (via protocol.roles)
 *
 * Registration: ProtocolRegistry (by role)
 * Consumers:    LayerManager, AttributeDataStore, FeatureInfoTool, STAC module
 */
export interface Protocol {
  /** Unique protocol identifier (e.g. "wms", "xyz", "wfs", "copc") */
  readonly id: string;

  /** Human-readable label for UI */
  readonly label: string;

  /**
   * Layer roles this protocol handles (1+).
   * E.g. WfsProtocol → [LayerRoles.GEOJSON, LayerRoles.of("wfs")]
   */
  readonly roles: LayerRole[];

  // =============================================
  // 1. Capability Creation  [required]
  // =============================================

  /**
   * Create a MapLayer for the given role from source URL and config.
   */
  createMapLayer(
    role: LayerRole,
    sourceUrl: string,
    config: LayerConfig,
  ): MapLayer;

  // =============================================
  // 2. Map Rendering  [required]
  // =============================================

  /**
   * Layer adapter for the given role.
   */
  getAdapter(role: LayerRole): LayerAdapter;

  /**
   * Apply protocol-specific grouping to render units.
   * Optional — only protocols requiring grouping (e.g. WMS) implement this.
   */
  groupRenderUnits?(
    renderUnits: Map<string, RenderUnit>,
    snapshot: SnapshotItem[],
  ): void;

  // =============================================
  // 3. Attribute Fetching  [optional]
  // =============================================

  /**
   * Fetch paginated attribute data.
   */
  fetchAttributes?(
    config: AttributeSourceConfig,
    request: AttributeFetchRequest,
    signal?: AbortSignal,
  ): Promise<AttributeFetchResult>;

  // =============================================
  // 4. Feature Info at Point  [optional]
  // =============================================

  /**
   * Query features at a map point.
   */
  getFeatureInfo?(
    params: ProtocolFeatureInfoParams,
  ): Promise<Record<string, unknown>>;
}

/** Sentinel returned by getFeatureInfo when no features are found. */
export const EMPTY_FEATURE_INFO: Record<string, unknown> = {
  _empty: true,
};