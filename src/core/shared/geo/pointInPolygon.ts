/**
 * Point-in-polygon test using the ray casting algorithm.
 * Works with 2D coordinates [x, y].
 */

/**
 * Check if a point is inside a polygon using ray casting.
 * @param point - [x, y] coordinates to test
 * @param polygon - array of [x, y] vertices (does not need to be closed)
 * @returns true if point is inside or on the boundary of the polygon
 */
export function isPointInPolygon(
    point: [number, number],
    polygon: [number, number][],
): boolean {
    const [px, py] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]!;
        const [xj, yj] = polygon[j]!;

        const intersect =
            yi > py !== yj > py &&
            px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Compute the bounding box of a polygon.
 * Returns [minX, minY, maxX, maxY].
 */
export function polygonBoundingBox(
    polygon: [number, number][],
): [number, number, number, number] {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const [x, y] of polygon) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }

    return [minX, minY, maxX, maxY];
}

/**
 * Check if a point is inside a bounding box.
 * @param point - [x, y] coordinates
 * @param bbox - [minX, minY, maxX, maxY]
 */
export function isPointInBoundingBox(
    point: [number, number],
    bbox: [number, number, number, number],
): boolean {
    const [x, y] = point;
    const [minX, minY, maxX, maxY] = bbox;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
}
