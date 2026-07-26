## MODIFIED Requirements

### Requirement: Render Descriptor

The system SHALL use a render descriptor as the single source of truth for map rendering. A descriptor SHALL carry a source URL and a configuration object. A descriptor SHALL be created by a protocol via `Protocol.createRenderDescriptor(sourceUrl, style, params)`, not stored on the node. The descriptor SHALL NOT carry a `role` field — the protocol that created the descriptor is the sole authority on how to interpret its config.

#### Scenario: Descriptor created by protocol

- **GIVEN** a WMS protocol, a source URL, and a style `{ paint: { "raster-opacity": 0.7 } }`
- **WHEN** `protocol.createRenderDescriptor(sourceUrl, style, params)` is called
- **THEN** the descriptor SHALL contain the source URL and a config with opacity `0.7`

#### Scenario: Immutable config update

- **GIVEN** a descriptor with opacity set to `1.0`
- **WHEN** a config update is applied to change opacity to `0.5`
- **THEN** the operation SHALL return a new descriptor with opacity `0.5`
- **THEN** the original descriptor SHALL be unchanged

#### Scenario: Descriptor with missing source URL

- **GIVEN** a protocol is asked to create a descriptor with an empty source URL
- **WHEN** the rendering pipeline processes the descriptor
- **THEN** the system SHALL NOT create a map layer for that descriptor

### Requirement: Layer Adapter

The system SHALL provide a layer adapter interface for map rendering operations. An adapter SHALL implement four methods: adding a layer, removing a layer, updating visibility, and applying configuration changes. An adapter SHALL NOT carry a `role` field — the protocol that owns the adapter is the sole authority on which rendering strategy the adapter implements. All adapter methods SHALL receive a map context.

#### Scenario: Adapter adds a layer

- **GIVEN** an adapter obtained from a protocol via `protocol.getLayerAdapter()` and a valid descriptor
- **WHEN** the adapter's add-to-map method is called with a layer identifier, the descriptor, and map context
- **THEN** a layer SHALL appear on the map

#### Scenario: Adapter removes a layer

- **GIVEN** a layer previously added to the map via an adapter
- **WHEN** the adapter's remove-from-map method is called with the layer identifier
- **THEN** the layer SHALL be removed from the map

#### Scenario: Adapter updates visibility

- **GIVEN** a visible layer on the map
- **WHEN** the adapter's update-visibility method is called with `visible: false`
- **THEN** the layer SHALL become hidden on the map

#### Scenario: Adapter applies config update

- **GIVEN** a layer on the map with opacity `1.0`
- **WHEN** the adapter's update-config method is called with a new descriptor containing opacity `0.3`
- **THEN** the layer SHALL reflect the new opacity value
- **THEN** the adapter SHALL ensure the final rendered state matches the new config

#### Scenario: Adapter obtained directly from protocol

- **GIVEN** a `WmsProtocol` instance
- **WHEN** `protocol.getLayerAdapter()` is called
- **THEN** the returned adapter SHALL handle raster tile rendering without any role-based routing

### Requirement: Layer Manager Reactive Sync

The system SHALL maintain a reactive synchronization loop between the tree state and the map. The layer manager SHALL observe changes to the tree snapshot and reconcile the map state to match. The snapshot SHALL resolve `RenderDescriptor` from each node's renderer protocol at snapshot time.

#### Scenario: New node appears in snapshot

- **GIVEN** the map currently shows no layers
- **WHEN** a new tree node with `renderer.protocolId = "wms"` and a valid source URL appears in the snapshot
- **THEN** the layer manager SHALL resolve the WMS protocol, create a render descriptor, and add the layer to the map

#### Scenario: Node removed from snapshot

- **GIVEN** the map currently shows a layer for a tree node
- **WHEN** the node is removed from the snapshot
- **THEN** the layer manager SHALL remove the corresponding layer from the map

#### Scenario: Node style changes

- **GIVEN** the map currently shows a raster layer at opacity `1.0`
- **WHEN** the node's `style.paint["raster-opacity"]` changes to `0.5`
- **THEN** the snapshot SHALL produce a new descriptor with the updated opacity
- **THEN** the layer manager SHALL call the adapter's update-config method

#### Scenario: Reactive sync is debounced

- **GIVEN** multiple tree node changes occur within a short interval
- **WHEN** the layer manager's reactive reaction fires
- **THEN** the layer manager SHALL reconcile all changes in a single synchronization pass
- **THEN** the map SHALL reflect the final state, not intermediate states

#### Scenario: Map not yet loaded

- **GIVEN** the map instance has not yet fired its load event
- **WHEN** tree nodes appear in the snapshot
- **THEN** the layer manager SHALL defer layer creation until the map load event fires

### Requirement: Render Unit

The system SHALL group one or more tree nodes into render units for map rendering. A render unit SHALL carry a unique identifier, the list of node identities it represents, an adapter, and a descriptor. A single layer produces a render unit with one node identity. Multiple layers of the same protocol MAY be grouped into a single render unit by the protocol's `groupRenderUnits` method.

#### Scenario: Single-layer render unit

- **GIVEN** a visible tree node with a valid renderer protocol
- **WHEN** the system builds render units from the tree snapshot
- **THEN** a render unit SHALL be created with the node's identity, descriptor, and adapter from the protocol

#### Scenario: WMS grouping via protocol

- **GIVEN** multiple visible WMS nodes on the same base URL
- **WHEN** `WmsProtocol.groupRenderUnits()` is called
- **THEN** the individual render units SHALL be replaced with a grouped unit
- **THEN** the grouped unit SHALL carry all node IDs

#### Scenario: Invisible node produces no render unit

- **GIVEN** a tree node with `isVisible` set to `false`
- **WHEN** the system builds render units
- **THEN** no render unit SHALL be created for that node

## REMOVED Requirements

### Requirement: Display Role Definition

**Reason**: `LayerRole` type and `LayerRoles` constants are removed. Rendering strategy is now determined by which protocol is bound to the node, not by a role identifier stored on the node. Each protocol directly owns its adapter and config format.

**Migration**: Remove all references to `LayerRole`, `LayerRoles.RASTER`, `LayerRoles.VECTOR`, `LayerRoles.POINT_CLOUD`, `LayerRoles.GEOJSON`. Use protocol IDs (`"wms"`, `"copc"`, `"vector-tile"`, etc.) instead. `LayerRole` type and constants files are deleted.

### Requirement: Layer Configuration

**Reason**: `LayerConfig` discriminated union (`RasterLayerConfig | VectorLayerConfig | PointCloudLayerConfig | GeoJsonLayerConfig`) is removed. Config shape is now protocol-specific: each protocol defines its own config internally. Node-level styling is represented by the protocol-agnostic `LayerStyle` (Mapbox format).

**Migration**: Remove all `LayerConfig*` types and type guards (`isRasterConfig`, `isVectorConfig`, etc.). Protocol implementations define their own internal config types. Existing config values migrate to `node.style` (paint/layout properties) and `node.renderer.params` (protocol-specific parameters).

### Requirement: Adapter Factory

**Reason**: `LayerAdapterFactory` is removed. Protocols own their adapters directly — `protocol.getLayerAdapter()` returns the protocol's adapter instance. No factory, no role-keyed registry, no async registration.

**Migration**: Remove `LayerAdapterFactory` class and `registerLayerAdapters()` function. Each protocol instantiates the adapter class it needs in its constructor. Built-in protocols instantiate `RasterAdapter`, `VectorAdapter`, `PointCloudAdapter`, or `GeoJsonAdapter` directly.

### Requirement: Map Context

**Reason**: Map context remains unchanged. This requirement is not modified by this change.

### Requirement: Layer Manager Reactive Sync (unchanged scenarios)

The reactive sync scenarios defined above in MODIFIED replace the original requirement text. See MODIFIED section above.

## ADDED Requirements

### Requirement: Snapshot Resolves Descriptors via Protocol

The layer tree snapshot SHALL resolve each node's `RenderDescriptor` by calling `protocol.createRenderDescriptor(node.renderer.sourceUrl, node.style, node.renderer.params)` where `protocol` is resolved from `ProtocolRegistry` using `node.renderer.protocolId`. Nodes with unregistered protocol IDs SHALL be excluded from the snapshot.

#### Scenario: Snapshot includes resolved descriptors

- **GIVEN** a visible node with `renderer.protocolId = "wms"` and the WMS protocol registered
- **WHEN** the snapshot is computed
- **THEN** the snapshot item SHALL include a `RenderDescriptor` created by the WMS protocol

#### Scenario: Node with unknown protocol excluded

- **GIVEN** a visible node with `renderer.protocolId = "unknown"`
- **WHEN** the snapshot is computed
- **THEN** the node SHALL NOT appear in the snapshot
- **THEN** no map layer SHALL be created

#### Scenario: Snapshot reacts to protocol registration

- **GIVEN** a visible node with `renderer.protocolId = "custom-protocol"` and no protocol registered for that ID
- **WHEN** a protocol with id `"custom-protocol"` is registered
- **THEN** the snapshot SHALL recompute and include the node with a descriptor from the new protocol
