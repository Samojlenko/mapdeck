# Point Cloud Streaming

## Architecture

COPC (Cloud Optimized Point Cloud) files are loaded progressively using viewport-based LOD (Level of Detail). The system streams octree nodes on demand, keeping memory usage bounded.

```
CopcStreamingLoader          ViewportManager
      │                            │
      ├─ initialize()              ├─ start() → listen to map events
      │   ├─ fetch COPC metadata   │
      │   ├─ load octree hierarchy │
      │   └─ allocate buffers      │
      │                            │
      │   selectNodesForViewport() │
      │   ←─────────────────────── │ on viewport change
      │                            │
      ├─ queueNode()               │
      ├─ loadQueuedNodes()         │
      │   └─ _loadNode()           │
      │       ├─ fetch + decompress│
      │       └─ write to buffers  │
      │                            │
      └─ onPointsLoaded(callback)  │
          └─ PointCloudLayerFactory.createLayer()
```

---

## CopcStreamingLoader

Streams COPC.LAZ files with viewport-based node selection.

### Initialization

```ts
const result = await loader.initialize();
// Returns: { bounds, totalPoints, spacing, spacingMeters }
```

Loads COPC metadata, octree hierarchy, and allocates pre-sized buffers. Called by `PointCloudAdapter.addToMap()`.

### Viewport-based Loading

```ts
loader.selectNodesForViewport(viewportInfo);
```

Selects octree nodes intersecting the viewport at the target depth. Nodes are prioritized by distance from viewport center, with deeper nodes slightly preferred.

### Configuration

| Option | Default | Purpose |
|--------|---------|---------|
| `pointBudget` | 10,000,000 | Global max points across all clouds |
| `maxConcurrentRequests` | 4 | Parallel node downloads |
| `viewportDebounceMs` | 150 | Debounce viewport changes |
| `minDetailZoom` | 10 | Zoom level to start loading detail |
| `maxOctreeDepth` | 20 | Maximum octree depth to load |

### Data Output

Emits `PointCloudData` via `onPointsLoaded` callback:

```ts
interface PointCloudData {
    positions: Float32Array;     // XYZ offsets from coordinateOrigin
    coordinateOrigin: [number, number, number];  // WGS84 center
    colors?: Uint8Array;         // RGBA
    intensities?: Float32Array;  // normalized 0-1
    classifications?: Uint8Array; // LAS codes
    pointCount: number;
    bounds: [number, number, number, number, number, number];
}
```

See: [`src/core/domain/overlay/deck/loaders/CopcStreamingLoader.ts`](../../../src/core/domain/overlay/deck/loaders/CopcStreamingLoader.ts)

---

## ViewportManager

Listens to MapLibre events and calculates target octree depth.

### Depth Calculation

Depth is computed dynamically from COPC spacing and ground resolution:

```
groundRes = 156543.03 / 2^zoom              // meters per pixel at equator
depth = floor(log2(spacing / groundRes))     // target depth from spacing
depth = max(0, depth)                        // clamp to 0
```

Adjustments:
- **Pitch**: `pitchReduction = floor((1 - cos(pitch_radians)) * 3)` — higher tilt reduces depth to avoid loading distant nodes
- **Distance**: `depth -= floor(log2(distanceKm))` when `distance > 1km` — logarithmically reduces detail for far clouds
- **Spacing**: The COPC `spacing` value sets the base scale for depth calculation

Final depth is clamped to `[0, maxOctreeDepth]`.

### Lifecycle

```ts
const vm = new ViewportManager(map, (viewport) => {
    loader.selectNodesForViewport(viewport);
}, options);

vm.start();   // listen to moveend, zoomend, pitchend
vm.stop();    // remove listeners
vm.destroy(); // cleanup
```

Created and managed by `PointCloudAdapter` per layerId. Destroyed on `removeFromMap()`.

See: [`src/core/domain/overlay/deck/ViewportManager.ts`](../../../src/core/domain/overlay/deck/ViewportManager.ts)

---

## Coordinate Transformation

COPC files may use any projected coordinate system. The loader transforms to WGS84 (EPSG:4326) for deck.gl rendering:

1. Parse WKT from COPC header
2. Extract PROJCS definition
3. Use proj4 for coordinate transformation
4. Store positions as offsets from `coordinateOrigin` (center of bounds)

---

## Memory Management

- **Pre-allocated buffers**: `Float32Array` sized to `pointBudget × 3` for positions
- **Node cache**: Tracks loaded/pending/error state per octree node
- **Budget enforcement**: Stops loading when `totalLoadedPoints > pointBudget`
- **Error recovery**: Nodes in error state can be re-queued on next viewport change

---

## Related

- [overlay-system.md](./overlay-system.md) — Deck.gl overlay integration
- [layer-adapters.md](./layer-adapters.md) — PointCloudAdapter usage
