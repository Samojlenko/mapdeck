## Why

The current layer node model conflates three independent concerns — «how to render», «how to fetch data», and «what tools are available» — into a single `LayerRole` discriminator. This creates a false 1:1 coupling between rendering strategy and data protocol, blocks per-node separation of visual and attribute sources (e.g., WMS for rendering + WFS for attributes), and forces layertool registration to depend on rendering roles rather than actual node capabilities. The `samojlenko-protocols` branch attempted to introduce protocols but was blocked by the `Map<LayerRole, Protocol>` (1:1) registry constraint.

## What Changes

- **New `Protocol` abstraction**: defines how to interact with a remote data source. Protocols handle data access (rendering, attribute fetching, feature info). Protocols do NOT declare capabilities — capabilities are the data adapter's responsibility. Protocols are registered by string ID (not by `LayerRole`), allowing multiple protocols per rendering strategy.
- **`LayerNode` restructured** (**BREAKING**):
  - `roles: LayerNodeRoles` replaced by `renderer: ProtocolBinding`, `data?: ProtocolBinding`
  - `RenderDescriptor` no longer stored on node — protocol creates it on demand from `sourceUrl` + `style`. Descriptor is generic `RenderDescriptor<C>` — protocol types its own config.
  - `ProtocolBinding.sourceUrl` is the base endpoint URL; `params` is the single source of truth for protocol-specific parameters (no duplication between URL query and params)
  - `LayerConfig` decomposed into `style` (Mapbox-format, protocol-agnostic) + `params` (protocol-specific)
  - `capabilities: string[]` replaces `LayerRole` for tool matching — assembled entirely by the data adapter at resolve time, not derived from protocols
  - New fields: `legend?: Legend`, `relatedObjects: RelatedObject[]`
- **`ToolStore` switched to capability-linking matching** (**BREAKING**): tools are registered under capability keys. `ToolStore.getToolsForNode(node)` returns all tools whose capability key is present in `node.capabilities`, plus global tools. `LayerToolRole` type, `Map<LayerRole, LayerTool[]>` structure, and `registerRole()` are removed.
- **`ProtocolRegistry` replaces implicit routing**: keyed by `protocol.id` (string), no 1:1 constraint. `LayerManager` and `AttributeDataStore` resolve protocols by ID, not by role heuristic.
- **`LayerRole` removed entirely** (**BREAKING**): `LayerRole` type, `LayerRoles` constants, `LayerAdapterFactory`, `LayerConfig` discriminated union, and `RenderDescriptor.role` are all deleted. Each protocol directly holds its adapter instance — no factory, no role-based routing. `RenderDescriptor` is generic `RenderDescriptor<C>` — protocol owns its config type. `LayerAdapter` interface loses its `role` field and generic parameter.

## Capabilities

### New Capabilities

- `protocols`: Protocol interface and registry — standard contract for data access (rendering, attribute fetching, feature info). Protocols do NOT declare capabilities — capabilities are the data adapter's responsibility. Registration by unique string ID.

### Modified Capabilities

- `node-roles`: LayerNode structure changes. `roles` field replaced by `renderer`/`data` bindings + `capabilities` list + `style` + `legend` + `relatedObjects`.
- `layer-tools`: Tool registration changes from `role: LayerToolRole` to registration under capability keys. `ToolStore` matches tools to nodes by capability linking (tools whose capability key is in node.capabilities).
- `layer-system`: Render pipeline no longer reads `RenderDescriptor` from node roles. Descriptor is now created by protocol via `createRenderDescriptor(sourceUrl, style, params)`. `LayerRole` becomes an internal protocol detail, not exposed on the public node interface.

## Impact

- `src/core/framework/types/domain/node/` — **BREAKING**: tree.ts and role.ts replaced/restructured
- `src/core/framework/types/domain/layer/` — config.ts, role.ts, descriptor.ts: **BREAKING** — `LayerRole` type, `LayerRoles` constants, `LayerConfig` discriminated union removed; `RenderDescriptor` becomes generic `RenderDescriptor<C>`; `ProtocolBinding.sourceUrl` is base URL, `params` is required
- `src/core/domain/adapters/layer/LayerAdapterFactory.ts` — **REMOVED**: factory no longer needed, protocols hold adapters directly
- `src/core/domain/adapters/layer/impl/*` — adapter classes lose `role` field and generic parameter
- `src/core/domain/adapters/layer/registerLayerAdapters.ts` — **REMOVED**
- `src/core/framework/store/layer/ToolStore.ts` — **BREAKING**: role-keyed map replaced by capability-linking matching (tools registered under capability keys)
- `src/core/framework/store/layer/LayerTreeStore.ts` — layerSnapshot now resolves descriptors via `ProtocolRegistry`
- `src/core/framework/store/layer/AttributeDataStore.ts` — resolves data protocol by ID instead of heuristic
- `src/core/domain/protocols/` — new directory: Protocol interface, ProtocolRegistry, built-in protocol implementations
- `src/modules/stac/mapping/RoleMapper.ts` — composes ProtocolBindings and capabilities instead of NodeRoles
- `src/modules/stac/roles/` — resolvers repurposed to produce protocol assignments instead of NodeRoles
- `src/layer-tools/` — all tool definitions updated from `role` to registration under capability keys
- `src/core/domain/managers/layerSync.ts` — grouping delegated to protocol method
- `src/core/domain/managers/LayerManager.ts` — adapter resolution via protocol

## Non-goals

- Changing the WMS grouping algorithm — it moves into `WmsProtocol.groupRenderUnits()` but the logic is unchanged
- Changing the MapLibre GL / deck.gl integration layer
