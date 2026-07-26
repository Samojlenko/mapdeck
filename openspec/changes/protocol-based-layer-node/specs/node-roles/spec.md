## MODIFIED Requirements

### Requirement: Layer Node Structure

A `LayerNode` SHALL carry two protocol bindings: `renderer` (required) for map visualization and `data` (optional) for attribute data access. The node SHALL carry a `style` field in Mapbox GL format. The node SHALL carry a `capabilities` list (string keys) assembled by the data adapter at resolve time. The node SHALL carry optional `legend` and `relatedObjects` fields. The node SHALL NOT carry a `roles` field — protocol bindings replace `DisplayRole` and `AttributeRole`; related objects replace reports.

#### Scenario: LayerNode with separate visual and data protocols

- **GIVEN** a module creates a `LayerNode` with `renderer: { protocolId: "wms", sourceUrl: "https://geo.server/wms", params: { layers: "ortho" } }` and `data: { protocolId: "wfs", sourceUrl: "https://geo.server/wfs", params: { typename: "buildings" } }`
- **WHEN** the rendering pipeline processes the node
- **THEN** the system SHALL use the WMS protocol to create a render descriptor
- **WHEN** the attribute table requests data for the node
- **THEN** the system SHALL use the WFS protocol to fetch attributes

#### Scenario: LayerNode with same protocol for both

- **GIVEN** a module creates a `LayerNode` with `renderer: { protocolId: "ogc-features", ... }` and `data: { protocolId: "ogc-features", ... }`
- **WHEN** both rendering and attribute access are needed
- **THEN** the same `OgcFeaturesProtocol` instance SHALL serve both purposes

#### Scenario: LayerNode without data protocol

- **GIVEN** a module creates a `LayerNode` with `renderer` set but no `data` binding
- **WHEN** the attribute table widget checks the node
- **THEN** the widget SHALL detect `data` is absent and produce no data request

#### Scenario: LayerNode with style

- **GIVEN** a `LayerNode` with `style: { type: "raster", paint: { "raster-opacity": 0.6 }, minzoom: 8 }`
- **WHEN** the renderer protocol creates a render descriptor
- **THEN** the descriptor SHALL reflect `paint["raster-opacity"]` as `0.6` and `minzoom` as `8`

#### Scenario: LayerNode with legend

- **GIVEN** a `LayerNode` with `legend: { title: "Land Use", items: [{ label: "Forest", color: "#228B22" }] }`
- **WHEN** the capabilities list is assembled
- **THEN** `"has-legend"` SHALL be included in `node.capabilities`

#### Scenario: LayerNode with related objects

- **GIVEN** a `LayerNode` with `relatedObjects: [{ id: "coll-1", type: "collection", title: "Aerial 2023" }]`
- **WHEN** the capabilities list is assembled
- **THEN** `"has-related"` SHALL be included in `node.capabilities`
- **WHEN** UI components iterate related objects
- **THEN** each object SHALL expose `id`, `title`, `type`, and optional `sourceUrl` and `description`

### Requirement: Capabilities Assembly

The data adapter SHALL assemble a node's `capabilities` list based on the chosen protocols, data type, and node metadata. The assembly logic is entirely the adapter's responsibility — protocols do NOT declare capabilities. The adapter MAY use any criteria: the renderer protocol ID, the data protocol ID, or any other metadata available at resolve time. Capabilities SHALL be stored as a plain `string[]` on the node. Capability names are plain strings — the data adapter defines both the names and their mapping to tools.

#### Scenario: Capabilities derived from protocol combination

- **GIVEN** a data adapter assembles capabilities for a node with `renderer.protocolId = "wms"` and `data.protocolId = "wfs"`
- **WHEN** the adapter composes capabilities
- **THEN** `node.capabilities` SHALL contain `"adjust-opacity"`, `"inspect-features"`, and `"view-attributes"`
- **THEN** the exact capability names and mapping logic SHALL be defined by the adapter, not by the protocols

#### Scenario: Capabilities with metadata extras

- **GIVEN** a node with a legend, related objects, and `renderer.protocolId = "copc"`
- **WHEN** the adapter composes capabilities
- **THEN** `node.capabilities` SHALL include `"has-legend"` and `"has-related"` in addition to capabilities derived from protocols

#### Scenario: Capabilities from renderer only

- **GIVEN** a node with only `renderer.protocolId = "xyz"`, no `data`, no legend, no related objects
- **WHEN** the adapter composes capabilities
- **THEN** `node.capabilities` SHALL include `"adjust-opacity"`

### Requirement: LayerNode without renderer produces no map output

A `LayerNode` with `renderer` set SHALL produce a map layer when visible. If no protocol is found for `renderer.protocolId`, the node SHALL NOT render on the map.

#### Scenario: Renderer protocol not registered

- **GIVEN** a `LayerNode` with `renderer.protocolId = "unknown-protocol"`
- **WHEN** the rendering pipeline processes the node and resolves the protocol
- **THEN** `registry.getById("unknown-protocol")` SHALL return `undefined`
- **THEN** no map layer SHALL be created for that node
- **THEN** the system SHALL log a diagnostic message and continue processing other nodes

## REMOVED Requirements

### Requirement: Layer Role System

**Reason**: `LayerRole`-based display role assignment is replaced by protocol bindings (`renderer`/`data`). Rendering behavior is now determined by the protocol, not by a role stored on the node.

**Migration**: Update all node creation code to set `renderer` and `data` protocol bindings instead of `roles.display` and `roles.attribute`. Layer roles remain internal to protocols and adapters — they are never exposed on the public `LayerNode` interface.

### Requirement: Role-Based Tool Availability

**Reason**: Tool availability is now determined by capability linking, not by `LayerRole` matching. See `layer-tools` spec for the capability-linking model.

**Migration**: Update `ToolStore` to map capability keys to tools. Update all tool registrations from `role: LayerToolRole` to register under a capability key instead.

### Requirement: Display Role Constraints

**Reason**: The constraint «at most one display role» is now expressed as «exactly one `renderer` binding». The concept of a «placeholder node without display» is now a node with `renderer` set but no protocol resolved.

**Migration**: Nodes that previously had no display role should now have `renderer` set to a valid protocol binding.

### Requirement: Attribute Role Constraints

**Reason**: Attribute data access is now represented by the optional `data` protocol binding instead of an `AttributeRole` with an endpoint URL.

**Migration**: Update node creation to set `data: { protocolId, sourceUrl, params }` instead of `roles.attribute: { attributeConfig: { endpointUrl, ... } }`.

### Requirement: Report Role Multiplicity

**Reason**: Reports are now represented as entries in `relatedObjects` with `type: "report"` instead of a separate `reports` list on `NodeRoles`.

**Migration**: Move report entries from `roles.reports` to `relatedObjects` with `type: "report"`.

### Requirement: Custom Role Extensibility

**Reason**: Custom roles for tool binding are replaced by capabilities. Capabilities are assembled by the data adapter based on protocol choice, data type, and node metadata. Modules define new protocols for data access and configure the adapter to assign appropriate capabilities.

**Migration**: Instead of registering a custom `LayerRole`, define a new `Protocol` implementation. Configure the data adapter to assign the desired capabilities to nodes that use this protocol. Register the protocol with `ProtocolRegistry`.

### Requirement: Built-in Role Set

**Reason**: Built-in roles are no longer a public concept. The set of known rendering strategies is now implicitly defined by the set of registered protocols.

**Migration**: No direct replacement. Built-in protocols (`"wms"`, `"xyz"`, `"copc"`, `"vector-tile"`, `"wfs"`, `"ogc-features"`, `"cog"`, `"geojson-tiled"`) serve as the built-in data access strategies.

## ADDED Requirements

### Requirement: LayerNode Style in Mapbox Format

A `LayerNode` SHALL carry a `style` field conforming to the Mapbox GL style layer specification. The style SHALL have optional `type`, `paint`, `layout`, `minzoom`, `maxzoom`, `filter`, and `metadata` fields. The style SHALL be protocol-agnostic — each protocol interprets only the properties relevant to its rendering strategy.

#### Scenario: Raster protocol consumes raster paint

- **GIVEN** a node with `style: { paint: { "raster-opacity": 0.5, "fill-color": "#ff0000" } }` and renderer protocol `"wms"`
- **WHEN** the protocol creates a render descriptor
- **THEN** `"raster-opacity": 0.5` SHALL be applied to the raster config
- **THEN** `"fill-color"` SHALL be ignored (not applicable to raster)

#### Scenario: Point cloud protocol consumes circle paint

- **GIVEN** a node with `style: { paint: { "circle-radius": 4, "circle-color": "#00BFFF" } }` and renderer protocol `"copc"`
- **WHEN** the protocol creates a render descriptor
- **THEN** `pointSize` SHALL be set to `4` (from `"circle-radius"`)
- **THEN** `colorScheme` SHALL use `"#00BFFF"` (from `"circle-color"`)

#### Scenario: Missing style defaults are protocol-defined

- **GIVEN** a node with `style: {}` (empty) and renderer protocol `"wms"`
- **WHEN** the protocol creates a render descriptor
- **THEN** the protocol SHALL apply its own defaults for all required config fields (opacity 1.0, etc.)

### Requirement: LayerNode with Legend

A `LayerNode` MAY carry a `legend` field describing the visual legend for the layer. A legend SHALL have an optional `title`, optional `url`, and optional `items` array. Each legend item SHALL have a `label` and optional `color`, `icon`, and `value` fields.

#### Scenario: Legend with items

- **GIVEN** a node with `legend: { items: [{ label: "Forest", color: "#228B22" }, { label: "Water", color: "#1E90FF" }] }`
- **WHEN** the legend is displayed in the UI
- **THEN** each item SHALL be rendered with its label and color swatch

#### Scenario: Node without legend

- **GIVEN** a node with no `legend` field
- **WHEN** the capabilities list is composed
- **THEN** `"has-legend"` SHALL NOT be present

### Requirement: LayerNode with Related Objects

A `LayerNode` SHALL carry a `relatedObjects` list (may be empty). Each related object SHALL have `id`, `title`, `type`, and optional `sourceUrl` and `description`. The `type` field SHALL identify the relationship kind (e.g., `"collection"`, `"item"`, `"report"`, `"dataset"`).

#### Scenario: Node with related collection

- **GIVEN** a node with `relatedObjects: [{ id: "coll-1", type: "collection", title: "Aerial 2023 Collection" }]`
- **WHEN** related objects are displayed in the UI
- **THEN** the collection SHALL be shown with its title and a link if `sourceUrl` is set

#### Scenario: Node with report as related object

- **GIVEN** a node with `relatedObjects: [{ id: "rep-1", type: "report", title: "Quality Report", sourceUrl: "https://..." }]`
- **WHEN** the UI renders the report entry
- **THEN** the report SHALL be displayed as a downloadable link using `sourceUrl`
