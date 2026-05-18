/**
 * 2D Delaunay triangulation using Bowyer-Watson algorithm.
 * Pure TypeScript, no external dependencies.
 */

/**
 * 2D point for triangulation (planar Cartesian coordinates).
 * Uses {x, y} shape, distinct from geo Point2D = [number, number].
 */
export interface PointXY {
    x: number;
    y: number;
}

export interface Triangle {
    a: number;
    b: number;
    c: number;
}

interface CircumcircleResult {
    center: PointXY;
    radius: number;
}

type Edge = [number, number];

/**
 * Compute the circumcenter and circumradius of a triangle.
 */
function circumcircle(
    points: PointXY[],
    i: number,
    j: number,
    k: number,
): CircumcircleResult {
    const p1 = points[i]!;
    const p2 = points[j]!;
    const p3 = points[k]!;

    const D =
        2 *
        (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));

    if (Math.abs(D) < 1e-10) {
        return { center: { x: 0, y: 0 }, radius: Infinity };
    }

    const x1sq = p1.x * p1.x + p1.y * p1.y;
    const x2sq = p2.x * p2.x + p2.y * p2.y;
    const x3sq = p3.x * p3.x + p3.y * p3.y;

    const ux =
        (x1sq * (p2.y - p3.y) + x2sq * (p3.y - p1.y) + x3sq * (p1.y - p2.y)) /
        D;
    const uy =
        (x1sq * (p3.x - p2.x) + x2sq * (p1.x - p3.x) + x3sq * (p2.x - p1.x)) /
        D;

    const center = { x: ux, y: uy };
    const radius = Math.sqrt((p1.x - ux) ** 2 + (p1.y - uy) ** 2);

    return { center, radius };
}

/**
 * Check if a point is inside the circumcircle of a triangle.
 */
function isInCircumcircle(
    points: PointXY[],
    tri: Triangle,
    pointIdx: number,
): boolean {
    const { center, radius } = circumcircle(points, tri.a, tri.b, tri.c);
    if (radius === Infinity) return false;

    const p = points[pointIdx]!;
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return dx * dx + dy * dy < radius * radius;
}

/**
 * Find boundary edges of the cavity (edges not shared by bad triangles).
 */
function findBoundaryEdges(badTriangles: Triangle[]): Edge[] {
    const edges: Edge[] = [];

    for (let t = 0; t < badTriangles.length; t++) {
        const tri = badTriangles[t]!;
        const triEdges: Edge[] = [
            [tri.a, tri.b],
            [tri.b, tri.c],
            [tri.c, tri.a],
        ];

        for (const edge of triEdges) {
            const isShared = badTriangles.some((other, idx) => {
                if (idx === t) return false;
                const otherEdges: Edge[] = [
                    [other.a, other.b],
                    [other.b, other.c],
                    [other.c, other.a],
                ];
                return otherEdges.some(
                    (oe) =>
                        (edge[0] === oe[1] && edge[1] === oe[0]) ||
                        (edge[0] === oe[0] && edge[1] === oe[1]),
                );
            });

            if (!isShared) {
                edges.push(edge);
            }
        }
    }

    return edges;
}

/**
 * Create new triangles from cavity boundary to the new point.
 */
function createNewTriangles(
    points: PointXY[],
    edges: Edge[],
    pointIdx: number,
): Triangle[] {
    return edges.map(([e0, e1]) => {
        const area =
            (points[e1]!.x - points[e0]!.x) *
                (points[pointIdx]!.y - points[e0]!.y) -
            (points[e1]!.y - points[e0]!.y) *
                (points[pointIdx]!.x - points[e0]!.x);
        return area > 0
            ? { a: e0, b: e1, c: pointIdx }
            : { a: e1, b: e0, c: pointIdx };
    });
}

/**
 * Perform 2D Delaunay triangulation on a set of points.
 * Returns an array of triangles (each triangle has 3 indices into the points array).
 */
export function delaunayTriangulate(points: PointXY[]): Triangle[] {
    if (points.length < 3) return [];

    // Compute bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    // Create super-triangle
    const dx = maxX - minX;
    const dy = maxY - minY;
    const dmax = Math.max(dx, dy) * 100;
    const midx = (minX + maxX) / 2;
    const midy = (minY + maxY) / 2;

    const superA: PointXY = { x: midx - dmax, y: midy - dmax };
    const superB: PointXY = { x: midx, y: midy + dmax };
    const superC: PointXY = { x: midx + dmax, y: midy - dmax };

    const allPoints = [...points, superA, superB, superC];
    const n = points.length;

    let triangles: Triangle[] = [{ a: n, b: n + 1, c: n + 2 }];

    // Incrementally add each point
    for (let i = 0; i < n; i++) {
        const badTriangles = triangles.filter((tri) =>
            isInCircumcircle(allPoints, tri, i),
        );

        const edges = findBoundaryEdges(badTriangles);

        triangles = triangles.filter((tri) => !badTriangles.includes(tri));
        triangles.push(...createNewTriangles(allPoints, edges, i));
    }

    // Remove triangles that share vertices with the super-triangle
    return triangles.filter((tri) => tri.a < n && tri.b < n && tri.c < n);
}
