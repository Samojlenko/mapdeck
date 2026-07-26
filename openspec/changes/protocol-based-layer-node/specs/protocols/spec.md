## ADDED Requirements

### Requirement: Protocol Interface

The system SHALL define a `Protocol<C>` interface that represents a standard contract for interacting with a remote data source. A protocol SHALL declare a unique string `id` and a human-readable `label`. A protocol SHALL provide a method `createRenderDescriptor(sourceUrl, style, params)` that returns a typed `RenderDescriptor<C>`. A protocol SHALL provide `getLayerAdapter()` returning `LayerAdapter<C>`. A protocol MAY optionally provide `fetchAttributes()` for attribute queries and `getFeatureInfo()` for point queries. Protocols do NOT declare capabilities — capabilities are the data adapter's responsibility.

#### Scenario: Protocol creates render descriptor from source URL, style and params

- **GIVEN** a `WmsProtocol` instance, a base source URL `"https://geo.server/wms"`, params `{ layers: "ortho", version: "1.3.0" }`, and a style `{ type: "raster", paint: { "raster-opacity": 0.7 } }`
- **WHEN** `protocol.createRenderDescriptor(sourceUrl, style, params)` is called
- **THEN** the returned `RenderDescriptor` SHALL contain a full tile URL built from the base URL and params, and its config SHALL have opacity `0.7`
- **THEN** style properties not applicable to raster rendering SHALL be silently ignored

#### Scenario: Protocol returns its layer adapter

- **GIVEN** a `WmsProtocol` instance
- **WHEN** `protocol.getLayerAdapter()` is called
- **THEN** the returned adapter SHALL handle raster tile rendering

#### Scenario: Protocol with attribute support fetches data

- **GIVEN** a `WfsProtocol` instance and a valid `ProtocolBinding` with `sourceUrl` and `params`
- **WHEN** `protocol.fetchAttributes(binding, request)` is called
- **THEN** the protocol SHALL build the full request URL from `binding.sourceUrl` and `binding.params`
- **THEN** the returned result SHALL contain rows and total feature count

#### Scenario: Protocol without attribute support

- **GIVEN** an `XyzProtocol` instance that does not implement `fetchAttributes`
- **WHEN** the system checks for attribute support
- **THEN** `protocol.fetchAttributes` SHALL be `undefined`

#### Scenario: Protocol groups render units for batching

- **GIVEN** a `WmsProtocol` instance and a set of render units from multiple WMS layers on the same base URL
- **WHEN** `protocol.groupRenderUnits(renderUnits, snapshot)` is called
- **THEN** the render units SHALL be replaced with a single grouped render unit containing all node IDs
- **THEN** the grouped render unit's descriptor SHALL use a combined tile URL

### Requirement: Protocol Registry

The system SHALL provide a `ProtocolRegistry` that stores protocols by their unique string `id`. Registration of a protocol with a duplicate id SHALL throw an error. Retrieval SHALL return the protocol or `undefined` if not found.

#### Scenario: Protocol registered and retrieved by id

- **GIVEN** a `WmsProtocol` with id `"wms"`
- **WHEN** the protocol is registered via `registry.register(wmsProtocol)`
- **THEN** `registry.getById("wms")` SHALL return the same protocol instance

#### Scenario: Multiple protocols with different rendering outputs coexist

- **GIVEN** a `WmsProtocol` (renders as raster), an `XyzProtocol` (renders as raster), and a `CopcProtocol` (renders as point cloud)
- **WHEN** all three are registered in the registry
- **THEN** all three SHALL be present (no conflict — they have different ids)
- **THEN** `registry.getById("wms")` SHALL return `WmsProtocol`
- **THEN** `registry.getById("xyz")` SHALL return `XyzProtocol`
- **THEN** `registry.getById("copc")` SHALL return `CopcProtocol`

#### Scenario: Duplicate protocol id throws

- **GIVEN** a protocol with id `"wms"` is already registered
- **WHEN** another protocol with id `"wms"` is registered
- **THEN** the registry SHALL throw an error

#### Scenario: Retrieval for unknown id returns undefined

- **GIVEN** no protocol with id `"unknown"` is registered
- **WHEN** `registry.getById("unknown")` is called
- **THEN** the call SHALL return `undefined`

### Requirement: Protocol Binding

The system SHALL define a `ProtocolBinding` type that links a node to a protocol at a specific data source. A binding SHALL carry the protocol identifier, the base endpoint URL, and required protocol-specific parameters.

#### Scenario: Binding identifies protocol and source

- **GIVEN** a `ProtocolBinding` with `protocolId: "wms"`, `sourceUrl: "https://geo.server/wms"`, and `params: { layers: "ortho" }`
- **WHEN** the binding is used to resolve a protocol
- **THEN** `registry.getById(binding.protocolId)` SHALL return the WMS protocol
- **THEN** the base URL and params SHALL be passed to protocol methods; the protocol SHALL construct the full request URL

#### Scenario: Binding params is the single source of truth

- **GIVEN** a `ProtocolBinding` with `params: { layers: "ortho_2023", version: "1.3.0" }`
- **WHEN** the WMS protocol creates a render descriptor
- **THEN** the protocol SHALL use `params.layers` and `params.version` to construct the tile URL
- **THEN** the protocol SHALL NOT parse query parameters from `sourceUrl`

### Requirement: Protocol registration at initialization

The system SHALL register all built-in protocol implementations during initialization, before any modules are loaded. Registration SHALL happen in a dedicated `registerProtocols()` function called from `RootStore.initialize()`.

#### Scenario: Built-in protocols available after init

- **GIVEN** a fresh portal instance
- **WHEN** `RootStore.initialize()` completes
- **THEN** the protocol registry SHALL contain entries for `"wms"`, `"xyz"`, `"cog"`, `"copc"`, `"vector-tile"`, `"geojson-tiled"`, `"wfs"`, and `"ogc-features"`
