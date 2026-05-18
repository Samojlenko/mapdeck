export type { Point2D } from "@core/framework/types/geo";
export { Bbox } from "@core/framework/types/geo";
export {
    flattenTo2D,
    validateBbox,
    unionBbox,
    bboxesIntersect,
    bboxFromGeometry,
} from "./bbox";

export {
    isPointInPolygon,
    polygonBoundingBox,
    isPointInBoundingBox,
} from "./pointInPolygon";

export type { PointXY, Triangle } from "./delaunay2d";
export { delaunayTriangulate } from "./delaunay2d";

export {
    geodesicDistance,
    triangleArea,
    calculatePolygonPerimeter,
} from "./spatial";
