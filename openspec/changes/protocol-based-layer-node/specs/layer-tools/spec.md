## MODIFIED Requirements

### Requirement: Context Menu Extensibility

Every layer node in the tree SHALL be queryable for available tools. The set of tools returned SHALL be determined by capability linking: each tool is registered under one or more capability keys. A node's `capabilities` list links it to all tools registered under those keys. A tool is available for a node if at least one of its capability keys is present in the node's `capabilities` list. A tool registered without a capability key SHALL be available for all nodes.

Tool availability is independent of protocols — the data adapter assembles capabilities on the node, and `ToolStore` matches tools to nodes by capability key intersection.

#### Scenario: Tool shown for matching capability

- **GIVEN** a tool is registered under capability `"adjust-opacity"`
- **WHEN** the system queries tools for a node with `capabilities: ["adjust-opacity"]`
- **THEN** the query SHALL return the tool

#### Scenario: Tool not shown when capability absent

- **GIVEN** a tool is registered under capability `"adjust-point-size"`
- **WHEN** the system queries tools for a node with `capabilities: ["adjust-opacity"]`
- **THEN** the query SHALL NOT return the tool

#### Scenario: Tool registered under multiple capabilities

- **GIVEN** a tool is registered under capabilities `["render-raster", "has-legend"]`
- **WHEN** the system queries tools for a node with `capabilities: ["render-raster", "has-legend"]`
- **THEN** the tool SHALL appear (at least one capability matches)

#### Scenario: Tool registered under one of multiple node capabilities

- **GIVEN** a tool is registered under capability `"has-legend"`
- **WHEN** the system queries tools for a node with `capabilities: ["render-raster", "adjust-opacity"]`
- **THEN** the tool SHALL NOT appear

#### Scenario: Global tool available for all nodes

- **GIVEN** a tool is registered without a capability key (global tool)
- **WHEN** the system queries tools for any node
- **THEN** the tool SHALL appear regardless of node's capabilities

#### Scenario: Node with empty capabilities

- **GIVEN** a tree node has `capabilities: []`
- **WHEN** the system queries tools for that node
- **THEN** the result SHALL contain only global tools (registered without capability key)

### Requirement: Duplicate Action Prevention

The system SHALL prevent registering two tools with the same identifier.

#### Scenario: Duplicate tool registration

- **GIVEN** a tool with id `"opacity-slider"` is already registered
- **WHEN** a developer attempts to register another tool with id `"opacity-slider"`
- **THEN** the duplicate SHALL be silently ignored
- **THEN** the first-registered tool SHALL remain active

### Requirement: Action Execution Context

When the system invokes a tool, it SHALL pass the identity of the specific tree node the tool was triggered for. The tool SHALL validate that the node exists and has the expected configuration before producing output.

#### Scenario: Action receives correct node context

- **GIVEN** two tree nodes `"node-A"` and `"node-B"` with different style configurations
- **WHEN** the system invokes a tool with node `"node-A"`
- **THEN** the tool SHALL read configuration from `"node-A"` only
- **THEN** `"node-B"`'s configuration SHALL remain unchanged

#### Scenario: Action handles invalid node state

- **GIVEN** a tool is invoked for a node whose style lacks the fields expected by the tool
- **WHEN** the tool validates the node's configuration
- **THEN** the tool SHALL produce no output
- **THEN** no error SHALL be surfaced to the end user

#### Scenario: Rapid sequential updates

- **GIVEN** a tool's control fires multiple configuration updates within a single frame
- **WHEN** the final call arrives
- **THEN** only the final value SHALL be reflected in the layer's rendering
- **THEN** the layer SHALL render at most once per animation frame

### Requirement: Action Localization

Every tool SHALL support localization. The system SHALL display tool names and labels in the configured language when translations are provided.

#### Scenario: Action displayed with translation

- **GIVEN** a tool provides translations for English, and the portal locale is set to English
- **WHEN** the system renders the tool label
- **THEN** the displayed text SHALL match the English translation entry

#### Scenario: Missing translation fallback

- **GIVEN** a tool provides translations for English only, and the portal requests Russian
- **WHEN** the system resolves the tool label
- **THEN** the fallback SHALL be English

## REMOVED Requirements

### Requirement: Runtime Role Extensibility

**Reason**: Tool availability is now based on capability linking, not roles. The data adapter assembles capabilities on the node; tools register under capability keys.

**Migration**: Instead of calling `toolStore.registerRole("custom", adapter, configFactory)`, register tools under one or more capability keys via `toolStore.registerTool(capability, tool)`. The data adapter is responsible for assigning those capabilities to nodes.

## ADDED Requirements

### Requirement: Tool Registration with Capability Key

A `LayerTool` SHALL be registered under a capability key string. A tool MAY be registered under multiple capability keys. A tool registered without a capability key SHALL be available for all nodes (global tool).

#### Scenario: Tool registered under one capability

- **GIVEN** a developer creates a tool with `id: "opacity-slider"`
- **WHEN** the tool is registered via `toolStore.registerTool("adjust-opacity", tool)`
- **THEN** the tool SHALL be stored under the capability key `"adjust-opacity"`
- **THEN** the tool SHALL be available for nodes that have `"adjust-opacity"` in their capabilities

#### Scenario: Tool registered under multiple capabilities

- **GIVEN** a developer creates a tool with `id: "legend-tool"`
- **WHEN** the tool is registered under capabilities `["render-raster", "has-legend"]`
- **THEN** the tool SHALL be available for nodes that have either capability

#### Scenario: Global tool registered without capability

- **GIVEN** a developer creates a tool with `id: "info-panel"`
- **WHEN** the tool is registered via `toolStore.registerGlobalTool(tool)`
- **THEN** the tool SHALL be available for every node

### Requirement: ToolStore Capability-Linking Matching

`ToolStore` SHALL maintain a mapping from capability keys to tools. `getToolsForNode(node)` SHALL return the union of all tools registered under any capability present in `node.capabilities`, plus all global tools.

#### Scenario: getToolsForNode returns matched tools

- **GIVEN** a tool registered under `"a"`, a tool registered under `"b"`, and a tool registered under `"a"`
- **WHEN** `getToolsForNode` is called with a node having `capabilities: ["a"]`
- **THEN** the result SHALL contain both tools registered under `"a"`
- **THEN** the result SHALL NOT contain the tool registered under `"b"`

#### Scenario: Global tools always returned

- **GIVEN** a global tool registered without capability key
- **WHEN** `getToolsForNode` is called with a node having `capabilities: []`
- **THEN** the global tool SHALL be returned

#### Scenario: Multiple capabilities contribute tools

- **GIVEN** tool A under `"x"` and tool B under `"y"`
- **WHEN** `getToolsForNode` is called with a node having `capabilities: ["x", "y"]`
- **THEN** both tool A and tool B SHALL be returned
