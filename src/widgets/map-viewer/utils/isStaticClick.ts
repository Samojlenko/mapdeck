/**
 * Check whether a mouse click was static (not a drag).
 * @param start - Starting point of the mouse interaction
 * @param end - End point (where mouse button was released / contextmenu fired)
 * @param threshold - Maximum pixel distance to consider as a static click
 */
export function isStaticClick(
    start: { x: number; y: number },
    end: { x: number; y: number },
    threshold: number,
): boolean {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
}
