## Context

The current architecture uses `LayerRole` (raster, vector, point-cloud, geojson) as the central discriminator for three separate concerns: rendering strategy (which adapter to use), data access (which attribute client to call), and tool availability (which context menu items to show). `LayerRole` is stored inside `NodeRoles.display.render.role` within a `RenderDescriptor` on every `LayerNode`.

The `samojlenko-protocols` branch explored extracting data access into a `Protocol` interface, but its `ProtocolRegistry` used `Map<LayerRole, Protocol>` — a 1:1 mapping that caused conflicts (WMS, XYZ, and COG all produce `LayerRoles.RASTER` output but are distinct protocols). The branch also kept `LayerRole` as the registry key, which perpetuated the false equivalence between rendering strategy and data protocol.

This design replaces `LayerRole` at the node level with three orthogonal concepts: **protocol bindings** (`renderer`/`data`), **style** (Mapbox format), and **capabilities** (string keys for tool matching).

## Goals / Non-Goals

**Goals:**
- Separate «how to render» from «how to fetch data» at the node level
- Allow per-node assignment of different protocols for visual and attribute data
- Replace `LayerRole`-based tool matching with capability-linking matching
- Make protocol registration conflict-free by using string IDs instead of `LayerRole` keys
- Use Mapbox GL style format for node styling to leverage an industry standard
- Compose `capabilities` at resolve time (in the data adapter), store them as a plain list on the node

**Non-Goals:**
- Remove `LayerRole` from the internal rendering pipeline (adapters, configs)
- Change MapLibre GL or deck.gl integration
- Change the WMS grouping algorithm itself
- Add runtime dynamic protocol switching on existing nodes

## Decisions

### Decision 1: Protocol keyed by string ID, not LayerRole

**Choice:** `ProtocolRegistry` is `Map<string, Protocol>` keyed by `protocol.id` (e.g., `"wms"`, `"xyz"`, `"copc"`).

**Alternatives considered:**
- `Map<LayerRole, Protocol>` — rejected. Multiple protocols produce the same `LayerRole` output (WMS, XYZ, COG → RASTER), causing registration conflicts.
- `Map<LayerRole, Protocol[]>` — rejected. Requires additional discriminator to pick the right protocol at runtime. Unclear who picks.

**Rationale:** String ID is the simplest conflict-free key. Nodes reference protocols by ID via `ProtocolBinding.protocolId`.

### Decision 2: ProtocolBinding as the node↔protocol link

**Choice:** Node stores `renderer: ProtocolBinding` and `data?: ProtocolBinding`, where:

```typescript
interface ProtocolBinding {
    protocolId: string;
    sourceUrl: string;                     // base endpoint URL, no query params
    params: Record<string, unknown>;       // single source of truth for parameters
}
```

`sourceUrl` is the base endpoint (e.g., `"https://geo.server/wms"`). All protocol-specific parameters (layers, version, typename, etc.) live in `params`. The protocol constructs the full request URL internally from `sourceUrl` + `params`.

**Alternatives considered:**
- Store full URL with query params in `sourceUrl` and keep `params` optional — rejected. Creates two sources of truth; they can drift.
- Store only `sourceUrl` with no `params` — rejected. Forces URL parsing to extract parameters.
- Store protocol reference directly on node — rejected. Breaks serializability.

**Rationale:** Single source of truth for parameters. Protocol implementations build URLs from `sourceUrl` + `params`, not by parsing query strings.

### Decision 3: Style in Mapbox format

**Choice:** Node stores `style: LayerStyle` in Mapbox GL style format:

```typescript
interface LayerStyle {
    type?: "fill" | "line" | "circle" | "symbol" | "raster"
         | "heatmap" | "fill-extrusion" | "hillshade" | "background";
    paint?: Record<string, unknown>;
    layout?: Record<string, unknown>;
    minzoom?: number;
    maxzoom?: number;
    filter?: unknown[];
    metadata?: Record<string, unknown>;
}
```

**Alternatives considered:**
- Per-role config types (`RasterLayerConfig`, `VectorLayerConfig`, ...) — rejected. Couples style to role, which we're removing from the node.
- Fully untyped `Record<string, unknown>` — rejected. Loses type guidance for protocol implementors.

**Rationale:** Mapbox GL style spec is well-documented, understood by the rendering layer (MapLibre GL), and flexible enough to cover all layer types. Each protocol interprets only the paint/layout properties relevant to its rendering strategy. Properties not applicable to a protocol are silently ignored.

### Decision 4: Capabilities as string[], composed by the data adapter

**Choice:** `capabilities: string[]` is a stored field on `LayerNode`, assembled entirely by the data adapter (e.g., STAC `RoleMapper`) at resolve time. Protocols do NOT declare capabilities — they are purely about data access. The data adapter has full freedom to decide what capabilities a node gets, based on any criteria: the chosen protocols, the data type, node metadata, etc.

```
// Capabilities are the data adapter's responsibility — not derived from protocols.
// The adapter can use any logic:
node.capabilities = dataAdapter.assembleCapabilities(node)
```

**Alternatives considered:**
- Derive capabilities from `protocol.capabilities` — rejected. Couples protocols to tool system. The data adapter is the single authority on what a node can do.
- `computed` in `LayerTreeStore` — rejected. Adapter has full context at resolve time. Computing in store adds unnecessary indirection.

**Rationale:** Data adapter knows the full context (source data, protocol choices, node metadata). It is the natural place to decide what the node is capable of. Protocols remain focused on data access, not on UI concerns like tool availability.

### Decision 5: ToolStore matches by capability linking

**Choice:** Tools are registered under capability keys. `ToolStore` returns the union of all tools whose capability key is present in `node.capabilities`, plus global tools. This is a linking model: the node's capabilities link it to all tools registered under those keys.

```typescript
getToolsForNode(node: LayerNode): LayerTool[] {
    const globalTools = this.globalTools;
    const capTools = node.capabilities.flatMap(
        cap => this.toolsByCapability.get(cap) ?? [],
    );
    return [...globalTools, ...capTools];
}
```

**Alternatives considered:**
- Tools declare `requiredCapabilities` and filter by intersection — rejected. Couples tools to capability naming and forces the data adapter to keep capability names in sync with tool declarations.
- `Map<LayerRole, LayerTool[]>` — rejected. Perpetuates role-based thinking.

**Rationale:** Capability-linking is decoupled: the data adapter decides which capabilities a node gets (based on any logic), and tools independently choose which capability keys to register under. Neither side needs to know about each other's conventions beyond the shared capability key.

### Decision 6: Protocol creates RenderDescriptor, node doesn't store it

**Choice:** `Protocol.createRenderDescriptor(sourceUrl: string, style: LayerStyle, params: Record<string, unknown>): RenderDescriptor`. The node stores `renderer.sourceUrl` + `style`; `RenderDescriptor` is created on demand when the rendering pipeline needs it.

**Alternatives considered:**
- Store `RenderDescriptor` on node — rejected. Descriptor carries `LayerRole` which we're removing from the node's public interface.
- Cache descriptor on node — rejected. Premature optimization; descriptor creation is cheap (object assembly).

**Rationale:** The protocol is the only entity that knows how to assemble a `RenderDescriptor` from a source URL and style. This keeps `LayerRole` as an internal protocol detail.

### Decision 7: Remove LayerRole entirely

**Choice:** Delete `LayerRole` type, `LayerRoles` constants, `LayerAdapterFactory`, `LayerConfig` discriminated union, and `RenderDescriptor.role` field. Each protocol directly instantiates and holds its adapter. `RenderDescriptor` becomes `{ sourceUrl: string, config: Record<string, unknown> }` — a 2-field object with opaque config.

**Alternatives considered:**
- Keep `LayerRole` as an internal protocol detail — rejected. If protocols own their adapters and configs, `LayerRole` has zero consumers. It becomes dead code.
- Keep `LayerAdapterFactory` but key it by protocol ID — rejected. Adds indirection with no benefit; protocol can hold adapter directly.

**Rationale:** Four concerns that `LayerRole` served are now handled by protocols:

| Concern | Before (`LayerRole`) | After (Protocol) |
|---|---|---|
| Adapter routing | `LayerAdapterFactory.get(role)` | `protocol.getLayerAdapter()` — direct |
| Config type safety | `LayerConfig` discriminated union + `isRasterConfig()` guards | Protocol creates its own config; adapter validates internally |
| Default configs | `createDefaultLayerConfig(role)` | Each protocol's `createRenderDescriptor()` applies defaults |
| Tool matching | `ToolStore.getLayerTools(role)` | Capability-linking matching (Decision 5) |

Adapter classes (`RasterAdapter`, `VectorAdapter`, `PointCloudAdapter`, `GeoJsonAdapter`) remain as implementation classes but lose their `role` field and generic parameter. Multiple protocols may instantiate the same adapter class (e.g., `WmsProtocol`, `XyzProtocol`, `CogProtocol` all use `RasterAdapter`), but each holds its own instance.

**Simplified types after removal:**

```typescript
// Before
interface RenderDescriptor<TRole extends LayerRole = LayerRole> {
    readonly role: TRole;
    readonly sourceUrl: string;
    readonly config: LayerConfigFor<TRole>;
}

// After
interface RenderDescriptor<C = Record<string, unknown>> {
    readonly sourceUrl: string;
    readonly config: C;
}

// Before
interface LayerAdapter<TRole extends LayerRole = LayerRole> {
    readonly role: TRole;
    addToMap(layerId: string, descriptor: RenderDescriptor<TRole>, ctx: MapContext): void;
    removeFromMap(layerId: string, ctx: MapContext): void;
    updateVisibility(layerId: string, visible: boolean, ctx: MapContext): void;
    updateConfig(renderUnit: RenderUnit<TRole>, ctx: MapContext): void;
    getLoadedData?(layerId: string): unknown;
}

// After
interface LayerAdapter<C = Record<string, unknown>> {
    addToMap(layerId: string, descriptor: RenderDescriptor<C>, ctx: MapContext): void;
    removeFromMap(layerId: string, ctx: MapContext): void;
    updateVisibility(layerId: string, visible: boolean, ctx: MapContext): void;
    updateConfig(renderUnit: RenderUnit<C>, ctx: MapContext): void;
    getLoadedData?(layerId: string): unknown;
}

// Before
interface RenderUnit<TRole extends LayerRole = LayerRole> {
    id: string;
    nodeIds: string[];
    adapter: LayerAdapter;
    descriptor: RenderDescriptor<TRole>;
}

// After
interface RenderUnit<C = Record<string, unknown>> {
    id: string;
    nodeIds: string[];
    adapter: LayerAdapter<C>;
    descriptor: RenderDescriptor<C>;
}
```

**Impact on protocol implementations:**

```typescript
class WmsProtocol implements Protocol<WmsConfig> {
    private readonly adapter = new RasterAdapter();

    getLayerAdapter(): LayerAdapter<WmsConfig> {
        return this.adapter;
    }

    createRenderDescriptor(
        sourceUrl: string,
        style: LayerStyle,
        params: Record<string, unknown>,
    ): RenderDescriptor<WmsConfig> {
        // Build full URL from base + params
        const url = buildUrl(sourceUrl, params);
        return {
            sourceUrl: url,
            config: {
                type: "wms",
                url,
                layers: params.layers as string,
                version: (params.version as string) ?? "1.3.0",
                opacity: style.paint?.["raster-opacity"] ?? 1.0,
            },
        };
    }
}
```

## Architecture: Before vs After

### Current (main branch)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STAC Module                                   │
│  STACEntityMapper  ──►  RoleMapper  ──►  RoleResolverRegistry       │
│       │                      │                  │                    │
│       ▼                      ▼                  ▼                    │
│  GroupNode / LayerNode    NodeRoles:       7 resolvers по priority  │
│   (tree nodes)           { display?,       (Report→Attribute→        │
│                            attribute?,      Raster/WMS/Vector/       │
│                            reports[] }      GeoJSON/PointCloud)      │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LayerTreeStore (MobX)                             │
│  observable.map<string, TreeNode>    _layerNodes computed            │
│       │                                    │                         │
│       ▼                                    ▼                         │
│  layerSnapshot: SnapshotItem[]   { id, visible, descriptor }        │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  buildGroupedRenderUnits()  ──► LayerManager.syncAllLayers()        │
│       │                              │                               │
│  WMS grouping via              per-adapter addToMap/                 │
│  groupVisibleWmsNodes()        removeFromMap on MapLibre GL         │
└─────────────────────────────────────────────────────────────────────┘
```

### Proposed (after change) — with LayerRole removed

```
                        ┌─────────────────────┐
                        │   ProtocolRegistry   │
                        │  byId: Map<string,   │
                        │        Protocol>     │
                        │                      │
                        │  Каждый Protocol      │
                        │  владеет адаптером   │
                        │  напрямую:           │
                        │  adapter = new       │
                        │    RasterAdapter()   │
                        └──────────┬──────────┘
                                   │
  ┌────────────────────────────────┼────────────────────────────────┐
  │                        Data Adapter (STAC)                       │
  │                                                                  │
  │  1. Определяет renderer.protocolId по источнику                  │
  │  2. Определяет data.protocolId (опционально)                     │
  │  3. Собирает capabilities по своей логике (на основе протоколов, │
  │     типа данных и метаданных)                                    │
  │  4. Собирает LayerNode с готовым списком capabilities            │
  └────────────────────────────────┼────────────────────────────────┘
                                   │
                                   ▼
  ┌────────────────────────────────────────────────────────────────┐
  │                         LayerNode                               │
  │                                                                │
  │  renderer: { protocolId: "wms", sourceUrl, params }            │
  │  data:     { protocolId: "wfs", sourceUrl, params }            │
  │  style:    { paint: { "raster-opacity": 0.8 } }                │
  │  capabilities: ["render-raster", "adjust-opacity", ...]        │
  │  legend, relatedObjects                                        │
  │                                                                │
  │  (нет roles, нет LayerRole)                                     │
  └────────────────────────────────────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │  Rendering   │    │  Attributes  │    │  Layer Tools │
    │              │    │              │    │              │
    │ renderer     │    │ data         │    │ capabilities │
    │ → protocol   │    │ → protocol   │    │ → ToolStore  │
    │ .create-     │    │ .fetch-      │    │   .getTools- │
    │ RenderDesc() │    │ Attributes() │    │   ForNode()  │
    │ .getAdapter()│    │              │    │              │
    │              │    │              │    │              │
    │ descriptor:  │    │              │    │              │
    │ { sourceUrl, │    │              │    │              │
    │   config }   │    │              │    │              │
    └──────┬───────┘    └──────┬───────┘    └──────────────┘
           │                   │
           ▼                   ▼
     MapLibre GL         AttributeTable
```

**Что исчезло по сравнению с текущей архитектурой:**
- `LayerRole` (raster, vector, point-cloud, geojson)
- `LayerAdapterFactory` (Map<LayerRole, LayerAdapter>)
- `LayerConfig` discriminated union
- `RenderDescriptor.role`

## Complete Type Signatures

### Simplified Rendering Types (after LayerRole removal)

```typescript
// src/core/framework/types/domain/layer/descriptor.ts

interface RenderDescriptor<C = Record<string, unknown>> {
    readonly sourceUrl: string;
    readonly config: C;
}

// src/core/framework/types/domain/layer/adapter.ts

interface LayerAdapter<C = Record<string, unknown>> {
    addToMap(layerId: string, descriptor: RenderDescriptor<C>, ctx: MapContext): void;
    removeFromMap(layerId: string, ctx: MapContext): void;
    updateVisibility(layerId: string, visible: boolean, ctx: MapContext): void;
    updateConfig(renderUnit: RenderUnit<C>, ctx: MapContext): void;
    getLoadedData?(layerId: string): unknown;
}

// src/core/framework/types/domain/layer/renderUnit.ts

interface RenderUnit<C = Record<string, unknown>> {
    id: string;
    nodeIds: string[];
    adapter: LayerAdapter<C>;
    descriptor: RenderDescriptor<C>;
}

interface SnapshotItem {
    id: string;
    visible: boolean;
    descriptor: RenderDescriptor | null;
}
```

### Protocol (core abstraction)

```typescript
// src/core/domain/protocols/Protocol.ts

import type * as maplibregl from "maplibre-gl";
import type {
  LayerAdapter,
  RenderDescriptor,
  RenderUnit,
  SnapshotItem,
  AttributeSourceConfig,
  AttributeFetchRequest,
  AttributeFetchResult,
} from "@core/framework/types";

interface Protocol<C = Record<string, unknown>> {
  /** Unique protocol identifier (e.g. "wms", "xyz", "copc") */
  readonly id: string;

  /** Human-readable label for UI */
  readonly label: string;

  // ── Rendering ──

  /** Create a RenderDescriptor from source URL and node style */
  createRenderDescriptor(
    sourceUrl: string,
    style: LayerStyle,
    params: Record<string, unknown>,
  ): RenderDescriptor<C>;

  /** Layer adapter for this protocol's rendering strategy */
  getLayerAdapter(): LayerAdapter<C>;

  /** Optional: group render units for batching (WMS) */
  groupRenderUnits?(
    renderUnits: Map<string, RenderUnit>,
    snapshot: SnapshotItem[],
  ): void;

  // ── Data access ──

  /** Optional: fetch paginated attribute data */
  fetchAttributes?(
    binding: ProtocolBinding,
    request: AttributeFetchRequest,
    signal?: AbortSignal,
  ): Promise<AttributeFetchResult>;

  /** Optional: query features at a map point */
  getFeatureInfo?(
    params: ProtocolFeatureInfoParams,
  ): Promise<Record<string, unknown>>;
}

interface ProtocolFeatureInfoParams {
  layerId: string;
  descriptor: RenderDescriptor;
  screenX: number;
  screenY: number;
  lng: number;
  lat: number;
  map: maplibregl.Map;
  signal?: AbortSignal;
}
```

### ProtocolRegistry

```typescript
// src/core/domain/protocols/ProtocolRegistry.ts

class ProtocolRegistry {
  private readonly byId = new Map<string, Protocol>();

  register(protocol: Protocol): void {
    if (this.byId.has(protocol.id)) {
      throw new Error(
        `Protocol "${protocol.id}" is already registered.`
      );
    }
    this.byId.set(protocol.id, protocol);
  }

  getById(id: string): Protocol | undefined {
    return this.byId.get(id);
  }

  getAll(): Protocol[] {
    return [...this.byId.values()];
  }
}
```

### LayerNode (new structure)

```typescript
// src/core/framework/types/domain/node/tree.ts

interface ProtocolBinding {
  protocolId: string;                     // ключ в ProtocolRegistry
  sourceUrl: string;                      // базовый URL эндпоинта (без query-параметров)
  params: Record<string, unknown>;        // параметры протокола (layers, typename, version...)
}

interface LayerStyle {
  type?: "fill" | "line" | "circle" | "symbol" | "raster"
       | "heatmap" | "fill-extrusion" | "hillshade" | "background";
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  minzoom?: number;
  maxzoom?: number;
  filter?: unknown[];
  metadata?: Record<string, unknown>;
}

interface LegendItem {
  label: string;
  color?: string;
  icon?: string;
  value?: string | number;
}

interface Legend {
  title?: string;
  url?: string;
  items?: LegendItem[];
}

interface RelatedObject {
  id: string;
  title: string;
  type: string;                           // "collection" | "item" | "report" | ...
  sourceUrl?: string;
  description?: string;
}

interface LayerNode extends TreeNodeBase {
  type: LayerTreeNodeTypes.Layer;

  renderer: ProtocolBinding;              // протокол отображения
  data?: ProtocolBinding;                 // протокол данных (опционально)

  style: LayerStyle;                      // Mapbox-формат

  legend?: Legend;
  relatedObjects: RelatedObject[];

  /** Составной список. Собирается адаптером данных при резолвинге */
  capabilities: string[];
}
```

### ToolStore (capability-linking)

```typescript
// src/core/framework/store/layer/ToolStore.ts

interface LayerTool {
  id: string;
  component: (nodeId: string) => React.ReactNode;
  localeTranslations?: Partial<Record<SupportedLanguage, TranslationDict>>;
}

class ToolStore {
  private toolsByCapability = new Map<string, LayerTool[]>();
  private globalTools: LayerTool[] = [];

  registerTool(capability: string, tool: LayerTool): void {
    const tools = this.toolsByCapability.get(capability) ?? [];
    if (!tools.some(t => t.id === tool.id)) {
      tools.push(tool);
      this.toolsByCapability.set(capability, tools);
    }
  }

  registerGlobalTool(tool: LayerTool): void {
    if (!this.globalTools.some(t => t.id === tool.id)) {
      this.globalTools.push(tool);
    }
  }

  getToolsForNode(node: LayerNode): LayerTool[] {
    const capTools = node.capabilities.flatMap(
      cap => this.toolsByCapability.get(cap) ?? [],
    );
    return [...this.globalTools, ...capTools];
  }

  getAllTools(): LayerTool[] {
    const all = [...this.globalTools];
    for (const tools of this.toolsByCapability.values()) {
      for (const t of tools) {
        if (!all.some(x => x.id === t.id)) all.push(t);
      }
    }
    return all;
  }
}
```

### Protocol ↔ Adapter Mapping (internal to protocol implementations)

Every protocol uses the unified `Protocol<C>` interface — there is no split into "data protocols" vs "render protocols". All protocols implement `createRenderDescriptor()` and `getLayerAdapter()`. A protocol placed in the `data` binding (e.g., WFS for attribute fetching) can just as well be placed in the `renderer` binding and produce a visible map layer. The distinction between `renderer` and `data` on the node is about **which role the binding plays on that specific node**, not about intrinsic protocol capabilities.

Each protocol instantiates the adapter class it needs directly. No registry, no role mapping:

| Protocol (id) | Adapter class | Config type `C` |
|---|---|---|
| `"wms"` | `new RasterAdapter()` | `{ type: "wms", url, layers?, version?, opacity, paint }` |
| `"xyz"` | `new RasterAdapter()` | `{ type: "xyz", url, opacity, paint }` |
| `"cog"` | `new RasterAdapter()` | `{ type: "cog", url, opacity, paint }` |
| `"vector-tile"` | `new VectorAdapter()` | `{ sourceLayer?, paint?, layout? }` |
| `"geojson-tiled"` | `new GeoJsonAdapter()` | `{ layerType, paint? }` |
| `"wfs"` | `new GeoJsonAdapter()` | `{ layerType, paint? }` |
| `"ogc-features"` | `new GeoJsonAdapter()` | `{ layerType, paint? }` |
| `"copc"` | `new PointCloudAdapter()` | `{ pointSize?, colorScheme?, bounds? }` |

### Capabilities → LayerTools mapping (ToolStore reference)

| Capability | Tool |
|---|---|
| `adjust-opacity` | `rasterOpacityTool` |
| `adjust-point-size` | `pointSizeTool` |
| `color-scheme` | `pointColorSchemeTool` |
| `pick-color` | `vectorColorPickerTool` |
| `view-attributes` | `viewAttributeTableTools` |

## Example Node Instances

### Orthophoto via WMS + attributes via WFS

```typescript
const orthoNode: LayerNode = {
  id: "ortho-2023",
  type: LayerTreeNodeTypes.Layer,
  title: "Ортофотоплан 2023",
  description: "",
  icon: "raster",
  parentId: "root",
  bbox: [37.0, 55.0, 38.0, 56.0],
  isVisible: true,
  isPanelOpen: false,

  renderer: {
    protocolId: "wms",
    sourceUrl: "https://geo.server/wms",
    params: { layers: "ortho_2023", version: "1.3.0" },
  },
  data: {
    protocolId: "wfs",
    sourceUrl: "https://geo.server/wfs",
    params: { typename: "buildings", version: "2.0.0" },
  },
  style: {
    type: "raster",
    paint: { "raster-opacity": 0.8 },
    minzoom: 10,
    maxzoom: 22,
  },
  legend: {
    title: "Land Use",
    items: [
      { label: "Forest", color: "#228B22" },
      { label: "Water",  color: "#1E90FF" },
      { label: "Urban",  color: "#A9A9A9" },
    ],
  },
  relatedObjects: [
    { id: "coll-1", type: "collection", title: "Aerial 2023 Collection" },
    { id: "rep-1",  type: "report",     title: "Quality Report", sourceUrl: "https://..." },
  ],

  capabilities: [
    "render-raster",       // от WmsProtocol
    "adjust-opacity",      // от WmsProtocol
    "inspect-features",    // от WmsProtocol ∩ WfsProtocol
    "view-attributes",     // от WfsProtocol
    "has-legend",          // от nodeMeta
    "has-related",         // от nodeMeta
  ],
};
```

### Point cloud via COPC (visual only, no data protocol)

```typescript
const lidarNode: LayerNode = {
  id: "lidar-scan",
  type: LayerTreeNodeTypes.Layer,
  title: "LiDAR Scan Q1",
  description: "",
  icon: "point-cloud",
  parentId: "root",
  bbox: [37.0, 55.0, 37.1, 55.1],
  isVisible: false,
  isPanelOpen: false,

  renderer: {
    protocolId: "copc",
    sourceUrl: "https://storage/lidar/q1.copc.laz",
  },
  // data — не задан
  style: {
    paint: {
      "circle-radius": 4,
      "circle-color": "#00BFFF",
    },
  },
  relatedObjects: [],

  capabilities: [
    "render-point-cloud",  // от CopcProtocol
    "adjust-point-size",   // от CopcProtocol
    "adjust-opacity",      // от CopcProtocol
    "color-scheme",        // от CopcProtocol
  ],
};
```

### GeoJSON via OGC Features (single protocol for both visual and data)

```typescript
const poisNode: LayerNode = {
  id: "pois",
  type: LayerTreeNodeTypes.Layer,
  title: "Points of Interest",
  description: "",
  icon: "geojson",
  parentId: "root",
  bbox: [37.0, 55.0, 38.0, 56.0],
  isVisible: true,
  isPanelOpen: false,

  renderer: {
    protocolId: "ogc-features",
    sourceUrl: "https://api/collections/pois/items",
  },
  data: {
    protocolId: "ogc-features",
    sourceUrl: "https://api/collections/pois/items",
  },
  style: {
    type: "circle",
    paint: {
      "circle-radius": 6,
      "circle-color": "#FF6B6B",
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 2,
    },
  },
  legend: {
    items: [
      { label: "Restaurant", color: "#FF6B6B" },
      { label: "Hotel", color: "#4ECDC4" },
    ],
  },
  relatedObjects: [],

  capabilities: [
    "render-geojson",      // от OgcFeaturesProtocol
    "view-attributes",     // от OgcFeaturesProtocol
    "inspect-features",    // от OgcFeaturesProtocol
    "pick-color",          // от OgcFeaturesProtocol
    "adjust-opacity",      // от OgcFeaturesProtocol
    "has-legend",          // от nodeMeta
  ],
};
```

## Style Interpretation by Protocol

```
Style: { paint: { "raster-opacity": 0.7, "fill-color": "#ff0000" }, minzoom: 5 }

┌──────────────────────────────────────────────────────────────────┐
│  WmsProtocol (raster)                                            │
│                                                                  │
│  ✓ "raster-opacity" → config.paint["raster-opacity"] = 0.7      │
│  ✓ minzoom          → config.minzoom = 5                         │
│  ✗ "fill-color"     → игнорируется (неприменимо к растру)       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  VectorTileProtocol (vector)                                     │
│                                                                  │
│  ✓ "fill-color"     → config.paint["fill-color"] = "#ff0000"    │
│  ✓ minzoom          → config.minzoom = 5                         │
│  ✗ "raster-opacity" → игнорируется (неприменимо к вектору)      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  CopcProtocol (point cloud)                                      │
│                                                                  │
│  ✗ "raster-opacity" → игнорируется                               │
│  ✗ "fill-color"     → игнорируется                               │
│  ✓ minzoom          → применяется                                │
│  (Для pointSize используется "circle-radius", для цвета —        │
│   "circle-color" — оба отсутствуют, применяются defaults)        │
└──────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

- **Migration complexity**: Every tool definition, every node creation site, and the entire rendering pipeline must be updated. **Mitigation**: Phase the migration — first add Protocol/ProtocolRegistry, then update LayerNode, then switch ToolStore, then remove old code.
- **Style field is loosely typed**: `paint?: Record<string, unknown>` means protocol implementations must do runtime validation of paint properties. **Mitigation**: Protocols are core code, not user code. Type guards inside each protocol validate what they need.
- **Capabilities are stringly-typed**: No compile-time check that capability values are valid. **Mitigation**: Export capability name constants from each protocol module. Data adapter authors import constants, not write raw strings.
- **Node structure is a breaking change**: Modules consuming `node.roles.display.render` will break. **Mitigation**: All module code lives in this repo; update all references as part of the change. No external consumers exist yet.

## Migration Plan

1. Add `Protocol` interface and `ProtocolRegistry` — not yet used by anything
2. Add `ProtocolBinding`, `LayerStyle`, `Legend`, `RelatedObject` types
3. Simplify `RenderDescriptor`, `LayerAdapter`, `RenderUnit` — remove `LayerRole` generic and `role` field
4. Update adapter classes (`RasterAdapter`, etc.) — remove `role` field and generic parameter; keep internal config validation
5. Delete `LayerRole` type, `LayerRoles` constants, `LayerConfig` discriminated union, `LayerAdapterFactory`
6. Extend `LayerNode` with new fields (`renderer`, `data`, `style`, `capabilities`, `legend`, `relatedObjects`), keep old `roles` field for now
7. Implement built-in protocols — each holds its adapter directly, implements `createRenderDescriptor`
8. Register all protocols in `registerProtocols()`, wire `ProtocolRegistry` into `RootStore`
9. Update STAC `RoleMapper` to produce new fields and capabilities alongside old `roles`
10. Update `LayerTreeStore.layerSnapshot` to resolve descriptors via protocol
11. Update `AttributeDataStore` to resolve data protocol by ID
12. Switch `ToolStore` to capability-linking matching; update all tool registrations to use `registerTool(capability, tool)`
13. Remove old `roles` field, old `LayerToolRole`, old `NodeRole` types
14. Remove `AttributeAdapterFactory` and `registerAttributeAdapters` (superseded by data protocols)

## Open Questions

- Should `params` on `ProtocolBinding` be typed per protocol? Currently `Record<string, unknown>` — could become generic `ProtocolBinding<P>` if needed.
- Should there be a `Protocol.supportsUrl(url: string): boolean` method for auto-detection? Currently the adapter (STAC module) always explicitly assigns protocol. Auto-detection is a future concern.
