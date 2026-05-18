/**
 * Spatial calculation utilities — Turf wrappers.
 * Pure functions for geodesic distance, area, and perimeter.
 */

import distance from "@turf/distance";
import { point, polygon } from "@turf/helpers";
import area from "@turf/area";

/**
 * Calculate the geodesic distance between two points in meters.
 */
export function geodesicDistance(
    a: [number, number],
    b: [number, number],
): number {
    return distance(point(a), point(b), { units: "meters" });
}

/**
 * Calculate the 2D area of a triangle in square meters using Turf.
 */
export function triangleArea(
    a: { lng: number; lat: number },
    b: { lng: number; lat: number },
    c: { lng: number; lat: number },
): number {
    const coords = [
        [a.lng, a.lat],
        [b.lng, b.lat],
        [c.lng, c.lat],
        [a.lng, a.lat],
    ];
    const poly = polygon([coords]);
    return area(poly);
}

/**
 * Calculate the perimeter of a polygon defined by an array of points.
 */
export function calculatePolygonPerimeter(
    points: { lng: number; lat: number }[],
): number {
    if (points.length < 2) return 0;

    let perimeter = 0;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]!;
        const curr = points[i]!;
        perimeter += geodesicDistance(
            [prev.lng, prev.lat],
            [curr.lng, curr.lat],
        );
    }
    // Close the ring
    const last = points[points.length - 1]!;
    const first = points[0]!;
    perimeter += geodesicDistance(
        [last.lng, last.lat],
        [first.lng, first.lat],
    );

    return perimeter;
}
