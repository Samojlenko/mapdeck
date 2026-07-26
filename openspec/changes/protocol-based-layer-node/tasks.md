## 1. Core Types — New Abstractions

- [ ] 1.1 Define `ProtocolBinding` type (protocolId, sourceUrl as base URL, params as required `Record<string, unknown>`)
- [ ] 1.2 Define `LayerStyle` type (Mapbox GL format: type, paint, layout, minzoom, maxzoom, filter, metadata)
- [ ] 1.3 Define `Legend` and `LegendItem` types
- [ ] 1.4 Define `RelatedObject` type (id, title, type, sourceUrl?, description?)
- [ ] 1.5 Define `Protocol<C>` interface — generic over config type, NO capabilities field
- [ ] 1.6 Implement `ProtocolRegistry` class (Map<string, Protocol>, register, getById, getAll)
- [ ] 1.7 Add `ProtocolRegistry` to `RootStore` as `protocolRegistry`

## 2. Simplify Rendering Types — Remove LayerRole

- [ ] 2.1 Make `RenderDescriptor` generic: `RenderDescriptor<C = Record<string, unknown>> { sourceUrl, config: C }`
- [ ] 2.2 Make `LayerAdapter` generic: `LayerAdapter<C>` — remove `role` field
- [ ] 2.3 Make `RenderUnit` generic: `RenderUnit<C>` — remove `<TRole>` generic
- [ ] 2.4 Delete `makeRenderDescriptor()`, `updateDescriptorConfig()`, `isDescriptorRole()` helper functions
- [ ] 2.5 Delete `LayerRole` branded type and `LayerRoles` constants (`src/core/framework/types/domain/layer/role.ts`)
- [ ] 2.6 Delete `LayerConfig` discriminated union and all config types (`RasterLayerConfig`, `VectorLayerConfig`, `PointCloudLayerConfig`, `GeoJsonLayerConfig`)
- [ ] 2.7 Delete type guards: `isRasterConfig()`, `isVectorConfig()`, `isPointCloudConfig()`, `isGeoJsonConfig()`
- [ ] 2.8 Delete `LayerConfigRegistry` interface and `LayerConfigFor` conditional type
- [ ] 2.9 Delete `BUILT_IN_ROLES` constant and `LayerRole.of()` factory
- [ ] 2.10 Delete `LayerAdapterFactory` class (`src/core/domain/adapters/layer/LayerAdapterFactory.ts`)
- [ ] 2.11 Delete `registerLayerAdapters.ts` and `createDefaultLayerConfig.ts`

## 3. Update Adapter Classes

- [ ] 3.1 Update `RasterAdapter` — remove `implements LayerAdapter<...>`, remove `role` field, remove generic from method signatures
- [ ] 3.2 Update `VectorAdapter` — same as above
- [ ] 3.3 Update `PointCloudAdapter` — same as above
- [ ] 3.4 Update `GeoJsonAdapter` — same as above
- [ ] 3.5 Update `LayerManager`, `layerSync`, and all consumers to use non-generic `RenderDescriptor` and `RenderUnit`

## 4. LayerNode — Extend with New Fields

- [ ] 4.1 Add `renderer: ProtocolBinding` field to `LayerNode` (alongside existing `roles`)
- [ ] 4.2 Add `data?: ProtocolBinding` field to `LayerNode`
- [ ] 4.3 Add `style: LayerStyle` field to `LayerNode`
- [ ] 4.4 Add `capabilities: string[]` field to `LayerNode`
- [ ] 4.5 Add `legend?: Legend` field to `LayerNode`
- [ ] 4.6 Add `relatedObjects: RelatedObject[]` field to `LayerNode`
- [ ] 4.7 Ensure `GroupNode` is unchanged (no protocol bindings on groups)

## 5. Built-in Protocol Implementations

- [ ] 5.1 Implement `WmsProtocol<WmsConfig>` (id: "wms", adapter: `new RasterAdapter()`)
- [ ] 5.2 Implement `XyzProtocol<XyzConfig>` (id: "xyz", adapter: `new RasterAdapter()`)
- [ ] 5.3 Implement `CogProtocol<CogConfig>` (id: "cog", adapter: `new RasterAdapter()`)
- [ ] 5.4 Implement `VectorTileProtocol<VectorTileConfig>` (id: "vector-tile", adapter: `new VectorAdapter()`)
- [ ] 5.5 Implement `GeoJsonTiledProtocol<GeoJsonConfig>` (id: "geojson-tiled", adapter: `new GeoJsonAdapter()`)
- [ ] 5.6 Implement `CopcProtocol<CopcConfig>` (id: "copc", adapter: `new PointCloudAdapter()`)
- [ ] 5.7 Implement `WfsProtocol<WfsConfig>` (id: "wfs", adapter: `new GeoJsonAdapter()`)
- [ ] 5.8 Implement `OgcFeaturesProtocol<OgcFeaturesConfig>` (id: "ogc-features", adapter: `new GeoJsonAdapter()`)
- [ ] 5.9 Each protocol implements `createRenderDescriptor(sourceUrl, style, params)` — builds full URL from base + params
- [ ] 5.10 Move WMS grouping logic into `WmsProtocol.groupRenderUnits()`
- [ ] 5.11 Move WFS attribute fetching into `WfsProtocol.fetchAttributes()`
- [ ] 5.12 Move OGC Features attribute fetching into `OgcFeaturesProtocol.fetchAttributes()`

## 6. Protocol Registration

- [ ] 6.1 Create `src/core/domain/protocols/registerProtocols.ts` — instantiate and register all 8 built-in protocols
- [ ] 6.2 Call `registerProtocols(rootStore)` from `RootStore.initialize()` (replaces old `registerLayerAdapters` call)

## 7. STAC Module — Compose Protocol Bindings + Capabilities

- [ ] 7.1 Update `RoleMapper.mapAssetsToNodeRoles()` to also produce `renderer`, `data`, `style`, `capabilities`, `legend`, `relatedObjects`
- [ ] 7.2 Implement capability assembly logic inline in the adapter (decides which capabilities to assign based on protocol IDs and metadata)
- [ ] 7.3 Update `STACEntityMapper` to set new fields on `LayerNode` alongside existing `roles`
- [ ] 7.4 Update `RoleResolver` interface or deprecate — resolvers now produce protocol assignments
- [ ] 7.5 Ensure `ReportRole` entries are moved to `relatedObjects[type="report"]`

## 8. Rendering Pipeline — Use Protocols

- [ ] 8.1 Update `LayerTreeStore.layerSnapshot` to resolve `RenderDescriptor` via `protocol.createRenderDescriptor(node.renderer.sourceUrl, node.style, node.renderer.params)`
- [ ] 8.2 Nodes with unregistered protocol IDs must be excluded from snapshot (log warning)
- [ ] 8.3 Update `buildGroupedRenderUnits()` in `layerSync.ts` to call `protocol.groupRenderUnits()` and use `protocol.getLayerAdapter()`
- [ ] 8.4 Ensure `LayerManager.syncAllLayers()` works with non-generic descriptors from protocols

## 9. Attribute Data — Use Protocols

- [ ] 9.1 Update `AttributeDataStore` to resolve data protocol via `registry.getById(node.data?.protocolId)`
- [ ] 9.2 Call `protocol.fetchAttributes()` instead of direct WFS/OGC client calls
- [ ] 9.3 Handle missing data protocol gracefully (return empty result, no error)
- [ ] 9.4 Remove `AttributeAdapterFactory` and `registerAttributeAdapters` (superseded by data protocols)

## 10. ToolStore — Switch to Capability-Linking Matching

- [ ] 10.1 Implement `Map<string, LayerTool[]>` in `ToolStore` (toolsByCapability)
- [ ] 10.2 Add `registerTool(capability: string, tool: LayerTool)` method
- [ ] 10.3 Add `registerGlobalTool(tool: LayerTool)` for tools available on all nodes
- [ ] 10.4 Implement `ToolStore.getToolsForNode(node)` — flatMap over `node.capabilities` + global tools
- [ ] 10.5 Migrate all built-in layer tools to register under capability keys:
  - [ ] 10.5a `rasterOpacityTool` → `registerTool("adjust-opacity", tool)`
  - [ ] 10.5b `pointSizeTool` → `registerTool("adjust-point-size", tool)`
  - [ ] 10.5c `pointColorSchemeTool` → `registerTool("color-scheme", tool)`
  - [ ] 10.5d `vectorColorPickerTool` → `registerTool("pick-color", tool)`
  - [ ] 10.5e `viewAttributeTableTools` → `registerTool("view-attributes", tool)`
- [ ] 10.6 Remove `ToolStore.resolveRoles()`, `ToolStore._knownRoles`, `ToolStore.registerRole()`
- [ ] 10.7 Remove `LayerToolRole` type
- [ ] 10.8 Remove old `Map<LayerRole, LayerTool[]>` structure from `ToolStore`

## 11. Cleanup — Remove Deprecated Node Role Types

- [ ] 11.1 Remove `NodeRole`, `DisplayRole`, `AttributeRole`, `ReportRole` types
- [ ] 11.2 Remove `NodeRoles`, `LayerNodeRoles` interfaces
- [ ] 11.3 Remove `roles` field from `TreeNodeBase` and `LayerNode`
- [ ] 11.4 Remove `src/core/framework/types/domain/node/role.ts`
- [ ] 11.5 Clean up unused imports and barrel exports across all affected files

## 12. Verification

- [ ] 12.1 Run `npm run lint` — ensure no type errors
- [ ] 12.2 Run `npm run build` — ensure successful production build
- [ ] 12.3 Verify all existing STAC integration tests pass (or update to new model)
- [ ] 12.4 Manual verification: layer tree renders, context menu tools appear correctly, WMS grouping works
- [ ] 12.5 Manual verification: attribute table fetches data via protocol
- [ ] 12.6 Verify all 8 protocols registered and accessible via `ProtocolRegistry`
