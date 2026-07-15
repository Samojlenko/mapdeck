// Logger — most widely used utility
export { logger } from "./diagnostics/logger";

// Debounce
export { debounce } from "./async/debounce";

// File download
export { downloadFile } from "./ui/download";

// Async / cancellation
export type { CancellableTask, CancellableReactionResult } from "./async";
export { createCancellable, createCancellableReaction } from "./async";

// Tree traversal
export type { TraverseResult, TraverseOptions } from "./async/treeTraversal";
export { traverseTreeAsync } from "./async/treeTraversal";

// MinHeap (priority queue for point cloud node loading)
export { MinHeap } from "./async/MinHeap";

// Geometry / spatial
export type { Point2D, PointXY, Triangle } from "./geo";
export {
    Bbox,
    flattenTo2D,
    validateBbox,
    unionBbox,
    bboxesIntersect,
    isPointInPolygon,
    polygonBoundingBox,
    isPointInBoundingBox,
    delaunayTriangulate,
    geodesicDistance,
    triangleArea,
    calculatePolygonPerimeter,
} from "./geo";

// Volume calculation
export type { DrapedSurfaceConfig } from "./geo/volume";
export {
    calculateGridTrapezoidVolume,
    SpatialHash,
    BaseSurfaceInterpolator,
    interpolateSurfaceZ,
    formatVolume,
    calculateVolumeFromTin,
} from "./geo/volume";

// Styling / theme
export {
    THEME_PRIMARY,
    THEME_SECONDARY,
    THEME_SUCCESS,
    COLOR_ALPHA_FILL,
    COLOR_ALPHA_STROKE,
    COLOR_ALPHA_PREVIEW,
    getThemeColor,
} from "./ui";

// Tile coordinates
export { tileToBBOX, tileToQuadkey, getTilesForBounds } from "./tile";
