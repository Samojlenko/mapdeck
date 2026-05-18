// mapdeck/src/core/types/layer/streaming-types.ts

/**
 * COPC loading mode options
 */
export type CopcLoadingMode = "full" | "dynamic";

/**
 * Represents an octree node key in COPC format
 * Format: [depth, x, y, z]
 */
export type NodeKey = [number, number, number, number];

/**
 * Source type for streaming loader - can be URL, File, or ArrayBuffer
 */
export type StreamingSource = string | File | ArrayBuffer;

/**
 * Streaming loader options
 */
export interface StreamingLoaderOptions {
    /**
     * Maximum number of points to keep in memory
     */
    pointBudget: number;

    /**
     * Maximum concurrent node requests
     */
    maxConcurrentRequests: number;

    /**
     * Debounce time for viewport changes in ms
     */
    viewportDebounceMs: number;

    /**
     * Maximum octree depth to load
     */
    maxOctreeDepth: number;

    /**
     * Maximum subtree hierarchies to load per viewport change (EPT only)
     * Increase this for large datasets with many subtrees
     */
    maxSubtreesPerViewport: number;
}

/**
 * Bounding box for point cloud data in WGS84 degrees (EPSG:4326)
 */
export type PointCloudBounds = {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
};

/**
 * State of a node in the streaming cache
 */
export type NodeState = "pending" | "loading" | "loaded" | "error" | "subtree";

/**
 * Cached node data
 */
export interface CachedNode {
    /** String format key: "depth-x-y-z" */
    key: string;
    /** Array format key: [depth, x, y, z] */
    keyArray: NodeKey;
    /** Current state of the node */
    state: NodeState;
    /** Number of points in this node */
    pointCount: number;
    /** Offset in the COPC file for point data */
    pointDataOffset: number;
    /** Length of point data in bytes */
    pointDataLength: number;
    /** Bounding box in source CRS (WGS84 degrees) */
    bounds: PointCloudBounds;
    /** Bounding box in WGS84 (same as bounds for EPSG:4326) */
    boundsWgs84: PointCloudBounds;
    /** Distance from viewport center (for priority queue) - lower = higher priority */
    priority?: number;
    /** Points array slice start index in the main buffer */
    bufferStartIndex: number | null;
    /** Error message if state is 'error' */
    error?: string;
    /** Timestamp (ms) before which this node should not be retried */
    retryAt?: number;
    /** Number of consecutive retries for exponential backoff */
    retryCount?: number;
}

/**
 * Viewport information for node selection
 */
export interface ViewportInfo {
    /** Viewport bounds in WGS84 [west, south, east, north] */
    bounds: [number, number, number, number];
    /** Viewport center in WGS84 [lng, lat] */
    center: [number, number];
    /** Current zoom level */
    zoom: number;
    /** Current pitch (tilt angle in degrees) */
    pitch: number;
    /** Target octree depth based on zoom and pitch */
    targetDepth: number;
    /** Distance from viewport center to point cloud bounds (in meters) */
    distanceToCloud: number;
}

/**
 * Load options that can be passed to loadPointCloud for streaming
 */
export interface StreamingLoadOptions extends StreamingLoaderOptions {
    /**
     * Loading mode: 'full' for complete load, 'dynamic' for viewport-based streaming
     * @default 'full'
     */
    loadingMode?: CopcLoadingMode;
}

/**
 * Union type for typed arrays used for point attributes
 */
export type AttributeArray =
    | Float64Array
    | Float32Array
    | Uint32Array
    | Uint16Array
    | Uint8Array
    | Int32Array
    | Int16Array
    | Int8Array;

/**
 * Extra point attributes beyond the core dimensions
 */
export type ExtraPointAttributes = Record<string, AttributeArray>;

/**
 * Dimension information for LAS/COPC files
 */
export interface DimensionInfo {
    name: string;
    type: string;
    size: number;
    scale?: number;
    offset?: number;
}

/**
 * COPC metadata information
 */
export interface CopcMetadata {
    lasVersion: string;
    pointDataRecordFormat: number;
    generatingSoftware: string;
    creationDate?: {
        year: number;
        dayOfYear: number;
    };
    scale: [number, number, number];
    offset: [number, number, number];
    nativeBounds: {
        min: [number, number, number];
        max: [number, number, number];
    };
    copcInfo: {
        spacing: number;
        rootHierarchyOffset: number;
        pointSpacing: number;
    };
    dimensions: DimensionInfo[];
}
